import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { bobId, aliceId, propertyIds, inspectConnection } from '../../scripts/connect-bob-alice.js';

const liveDirectory = path.resolve('database/runtime');
const hasSavedAccounts = fs.existsSync(path.join(liveDirectory, 'accounts.json')) && fs.existsSync(path.join(liveDirectory, 'auction-state.json'));

test('existing Bob and Alice: isolated replay of saved properties, request, delegation and bids', { skip: !hasSavedAccounts }, async t => {
  // All writes occur on copies. Do not log hashes, reset credentials, or bid in live data.
  const liveAccounts = fs.readFileSync(path.join(liveDirectory, 'accounts.json'));
  const liveState = fs.readFileSync(path.join(liveDirectory, 'auction-state.json'));
  const accounts = JSON.parse(liveAccounts);
  const saved = JSON.parse(liveState);
  inspectConnection(saved, accounts);
  const alice = accounts[aliceId];
  const pending = saved.auctionRegistrationsData.find(r => r.buyer_id === aliceId && r.property_id === 'prop-4');
  assert.ok(pending, 'Alice existing prop-4 request is required for this replay');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bob-alice-replay-'));
  fs.writeFileSync(path.join(directory, 'accounts.json'), liveAccounts);
  // Replay the auction within its original time window. An expired live auction
  // is never reopened: the replay status/clock change is confined to this copy.
  const auction = saved.auctionsData.find(a => a.auction_id === pending.auction_id);
  const replayClock = Date.parse(auction.auction_start) + 1000;
  t.mock.timers.enable({ apis: ['Date'], now: replayClock });
  auction.status = 'REGISTRATION_OPEN';
  saved.auctionManagersData = [];
  fs.writeFileSync(path.join(directory, 'auction-state.json'), JSON.stringify(saved));
  process.env.DATA_DIR = directory;
  const { db } = await import('../database/db.js');
  const controllers = await import('../controllers/bidController.js');
  const originalProperties = db.getAllProperties();
  let newAuction;

  await t.test('grant exposes exactly the intended properties without changing owners or credentials', () => {
    assert.equal(db.getSellerAuctionInventory(bobId).length, 0);
    const grants = db.grantAuctionManagement(propertyIds, bobId, 'project-owner-request', 'Isolated Bob/Alice replay');
    assert.equal(grants.length, 12);
    assert.deepEqual(db.getAllProperties(), originalProperties);
    assert.equal(fs.readFileSync(path.join(directory, 'accounts.json')).equals(liveAccounts), true);
    assert.deepEqual(db.getSellerAuctionInventory(bobId).map(p => p.id), propertyIds);
    assert.equal(db.getSellerAuctionInventory('bob@gamil.com').length, 0);
    assert.equal(db.canManagePropertyAuctions('prop-18', bobId), false);
    assert.equal(db.canManageAuction(db.getAuctionById(auction.auction_id), bobId), true);
    assert.equal(db.canManageAuction(db.getAuctionById(auction.auction_id), aliceId), false);
    assert.throws(() => db.grantAuctionManagement(['prop-18', 'missing-id'], bobId, 'project-owner-request', 'Rollback test'));
    assert.equal(db.canManagePropertyAuctions('prop-18', bobId), false, 'Failed batch must roll back grants');
  });
  await t.test('existing Alice request reaches Bob once and Bob approves with the real request ID', () => {
    const notices = () => db.getNotifications(bobId, 'Seller').filter(n => n.registration_id === pending.id);
    assert.equal(notices().length, 1);
    let response;
    controllers.getAuctions({ user: { email: bobId, role: 'Seller' } }, { json: data => { response = data; }, status: () => { throw new Error('Seller auction retrieval failed'); } });
    const managed = response.auctions.find(a => a.auction_id === auction.auction_id);
    assert.ok(managed);
    assert.equal(managed.can_manage_auction, true);
    assert.equal(managed.can_sell, false);
    assert.ok(managed.registrations.some(r => r.id === pending.id && r.buyer_id === aliceId));
    db.grantAuctionManagement(propertyIds, bobId, 'project-owner-request', 'Idempotent replay');
    assert.equal(notices().length, 1);
    const originalCount = db.getAuctions().length;
    assert.throws(() => db.requestRegistration(auction.auction_id, { buyer_id: aliceId }), /published/);
    const launched = db.createAuction({ property_id: 'prop-4', seller_id: bobId, starting_price: auction.starting_price, minimum_increment: auction.minimum_increment, duration_hours: 24 });
    assert.equal(launched.auction_id, auction.auction_id, 'Reuse unpublished nonterminal record without duplicating it');
    assert.equal(db.getAuctions().length, originalCount);
    assert.equal(launched.can_request_access, true);
    const approved = db.updateRegistrationStatus(pending.id, 'APPROVED', bobId);
    assert.equal(approved.buyer_id, aliceId);
    assert.equal(approved.status, 'APPROVED');
    assert.ok(approved.token_id);
    db.updateRegistrationStatus(pending.id, 'APPROVED', bobId);
    assert.equal(db.getAuctionById(auction.auction_id).participants.filter(p => p.buyer_id === aliceId).length, 1);
  });
  await t.test('Bob starts existing auction; Alice valid bid persists with exact IDs', () => {
    db.updateAuctionStatus(auction.auction_id, 'LIVE', bobId);
    const before = db.getAuctionById(auction.auction_id);
    const amount = Math.round((before.current_highest_bid + before.minimum_increment) * 1e6) / 1e6;
    const bid = db.placeAuctionBid(auction.auction_id, aliceId, alice.name, amount);
    assert.equal(bid.buyer_id, aliceId); assert.equal(bid.property_id, 'prop-4');
    assert.equal(bid.auction_id, pending.auction_id);
    const after = db.getAuctionById(auction.auction_id);
    assert.equal(after.current_highest_bid, amount); assert.equal(after.highest_bidder_id, aliceId);
    const persisted = JSON.parse(fs.readFileSync(path.join(directory, 'auction-state.json')));
    assert.ok(persisted.auctionBidsData.some(b => b.bid_id === bid.bid_id && b.buyer_id === aliceId));
    assert.ok(persisted.propertiesData.find(p => p.id === 'prop-4').bids.some(b => b.id === bid.bid_id));
    for (const recipient of [bobId, auction.seller_id]) {
      assert.equal(db.getNotifications(recipient, 'Seller').filter(n => n.type === 'BID_PLACED' && n.auction_id === auction.auction_id).length, 1);
    }
    assert.throws(() => db.placeAuctionBid(auction.auction_id, aliceId, alice.name, amount));
    assert.throws(() => db.placeAuctionBid(auction.auction_id, 'bob@gamil.com', 'Existing alternate Bob', amount + 100));
    assert.throws(() => db.updateAuctionStatus(auction.auction_id, 'PAUSED', 'bob@gamil.com'));
    assert.throws(() => db.sellProperty(auction.auction_id, aliceId, amount, bobId), /owning seller/);
  });
  await t.test('existing secondary buyer outbids Alice and only the former leader gets OUTBID', () => {
    const otherId = 'buyer@example.com';
    assert.equal(accounts[otherId]?.role, 'Buyer');
    const reg = db.requestRegistration(auction.auction_id, { buyer_id: otherId, buyer_name: accounts[otherId].name, buyer_email: otherId });
    db.updateRegistrationStatus(reg.id, 'APPROVED', bobId);
    const before = db.getAuctionById(auction.auction_id);
    const amount = Math.round((before.current_highest_bid + before.minimum_increment) * 1e6) / 1e6;
    db.placeAuctionBid(auction.auction_id, otherId, accounts[otherId].name, amount);
    assert.equal(db.getNotifications(aliceId, 'Buyer').filter(n => n.type === 'OUTBID' && n.auction_id === auction.auction_id).length, 1);
    assert.equal(db.getNotifications('bob@gamil.com', 'Seller').some(n => n.type === 'BID_PLACED'), false);
  });
  await t.test('Bob can create a new auction on an existing granted property while retaining original owner', () => {
    const before = db.getPropertyById('prop-7');
    newAuction = db.createAuction({ property_id: before.id, seller_id: bobId, starting_price: before.price, minimum_increment: 1, duration_hours: 24 });
    assert.equal(newAuction.seller_id, before.sellerEmail);
    assert.equal(newAuction.created_by, bobId);
    assert.equal(db.getPropertyById(before.id).sellerEmail, before.sellerEmail);
    assert.equal(db.getAllProperties().length, originalProperties.length);
    assert.throws(() => db.createAuction({ property_id: 'prop-18', seller_id: bobId, starting_price: 100 }));
  });
  await t.test('rejection, closure, permission revocation and reload are enforced', () => {
    db.updateRegistrationStatus(pending.id, 'REJECTED', bobId);
    assert.throws(() => db.placeAuctionBid(auction.auction_id, aliceId, alice.name, 10000));
    db.updateAuctionStatus(auction.auction_id, 'ENDED', bobId);
    assert.throws(() => db.placeAuctionBid(auction.auction_id, aliceId, alice.name, 10000));
    db.revokeAuctionManagement(['prop-7'], bobId, 'project-owner-request', 'Test revocation');
    assert.equal(db.canManageAuction(db.getAuctionById(newAuction.auction_id), bobId), false);
    assert.throws(() => db.updateAuctionStatus(newAuction.auction_id, 'LIVE', bobId));
    const replayRestart = fs.mkdtempSync(path.join(os.tmpdir(), 'bob-alice-reload-'));
    fs.copyFileSync(path.join(directory, 'auction-state.json'), path.join(replayRestart, 'auction-state.json'));
    const child = spawnSync(process.execPath, ['--input-type=module', '-e', `import {db} from './backend/database/db.js'; console.log(JSON.stringify({canManage:db.canManageAuction(db.getAuctionById(${JSON.stringify(auction.auction_id)}),${JSON.stringify(bobId)}),auction:db.getAuctionById(${JSON.stringify(auction.auction_id)})}));`], { encoding: 'utf8', env: { ...process.env, DATA_DIR: replayRestart } });
    assert.equal(child.status, 0, child.stderr);
    const reloaded = JSON.parse(child.stdout);
    assert.equal(reloaded.canManage, true); assert.equal(reloaded.auction.status, 'ENDED');
    assert.equal(reloaded.auction.bids.some(b => b.buyer_id === aliceId), true);
  });
  assert.equal(fs.readFileSync(path.join(liveDirectory, 'accounts.json')).equals(liveAccounts), true, 'Live credentials unchanged');
  assert.equal(fs.readFileSync(path.join(liveDirectory, 'auction-state.json')).equals(liveState), true, 'Live records unchanged by replay');
});
