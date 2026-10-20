import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'realty-auctions-'));
process.env.DATA_DIR = directory;
const { default: express } = await import('express');
const { default: authRoutes } = await import('../routes/authRoutes.js');
const { default: bidRoutes } = await import('../routes/bidRoutes.js');
const { default: propertyRoutes } = await import('../routes/propertyRoutes.js');
const { db } = await import('../database/db.js');

test('authenticated auction workflow, isolation, concurrency and persistence', async t => {
  const app = express(); app.use(express.json());
  app.use('/api/auth', authRoutes); app.use('/api/bids', bidRoutes); app.use('/api/properties', propertyRoutes);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/api`;
  async function request(route, method = 'GET', body, user) {
    const response = await fetch(url + route, { method, headers: { 'Content-Type': 'application/json', ...(user ? { Authorization: `Bearer ${user.token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, data: await response.json() };
  }
  async function account(email, role) {
    const result = await request('/auth/register', 'POST', { email, role, password: 'test-password-9264' });
    assert.equal(result.status, 200); return result.data.user;
  }
  const seller = await account('owner@test.example', 'Seller');
  const otherSeller = await account('other@test.example', 'Seller');
  const buyer = await account('first@test.example', 'Buyer');
  const second = await account('second@test.example', 'Buyer');
  const outsider = await account('outsider@test.example', 'Buyer');
  const investor = await account('investor@test.example', 'Investor');
  let property, auction, registration;
  await t.test('credentials and role cannot be forged', async () => {
    for (const user of [seller, buyer, investor]) {
      const login = await request('/auth/login', 'POST', { email: user.email.toUpperCase(), role: user.role, password: 'test-password-9264' });
      assert.equal(login.status, 200);
      const me = await request('/auth/me', 'GET', undefined, login.data.user);
      assert.equal(me.data.user.role, user.role);
      assert.equal(me.data.user.email, user.email);
      assert.equal('hash' in me.data.user, false);
    }
    assert.equal((await request('/auth/me')).status, 401);
    assert.equal((await request('/auth/login', 'POST', { email: seller.email, role: 'Seller', password: 'incorrect-password' })).status, 401);
    assert.equal((await request('/auth/login', 'POST', { email: seller.email, role: 'Buyer', password: 'test-password-9264' })).status, 401);
    assert.equal((await request('/bids/auctions')).status, 401);
    assert.equal((await request('/bids/auctions', 'GET', undefined, { token: 'jwt-token-seller-123' })).status, 401);
  });
  await t.test('seller creates property, publishes auction, buyer retrieves it', async () => {
    const before = await request('/properties', 'GET', undefined, seller);
    assert.equal(before.data.properties.filter(p => p.sellerEmail === seller.email).length, 0);
    const created = await request('/properties', 'POST', { name: 'Workflow property', city: 'Pune', area: 1200, price: 100, auctionEnabled: true }, seller);
    assert.equal(created.status, 201); property = created.data.property;
    assert.equal(property.sellerEmail, seller.email);
    assert.equal(property.auctionEnabled, false);
    assert.equal(db.getAuctionByPropertyId(property.id), null);
    assert.equal((await request('/bids/auctions?view=live', 'GET', undefined, buyer)).data.auctions.some(a => a.property_id === property.id), false);
    assert.equal(db.getPropertyAuctionState(property.id).can_request_access, false);
    assert.equal((await request(`/bids/auctions/${property.id}/register`, 'POST', {}, buyer)).status, 400);
    assert.equal((await request(`/bids/auctions/${property.id}/bid`, 'POST', { amount: 101 }, buyer)).status, 400);
    assert.equal(db.getAuctionByPropertyId(property.id), null);
    const inventory = await request('/properties', 'GET', undefined, seller);
    assert.equal(inventory.data.properties.filter(p => p.sellerEmail === seller.email).length, 1);
    assert.equal((await request('/bids/auctions/create', 'POST', { property_id: property.id, starting_price: 100 }, otherSeller)).status, 400);
    const result = await request('/bids/auctions/create', 'POST', { property_id: property.id, starting_price: 100, minimum_increment: 0.25, duration_hours: 1 }, seller);
    assert.equal(result.status, 201); auction = result.data.auction;
    assert.equal(auction.status, 'LIVE');
    assert.equal(auction.is_published, true);
    assert.equal(auction.can_request_access, true);
    assert.equal(Date.parse(auction.auction_end) - Date.parse(auction.auction_start), 3600000);
    assert.equal((await request('/bids/auctions?view=live', 'GET', undefined, buyer)).data.auctions.some(a => a.auction_id === auction.auction_id), true);
    const propertyView = (await request(`/properties/${property.id}`, 'GET')).data;
    assert.equal(propertyView.can_request_access, true);
    assert.equal(propertyView.auction_id, auction.auction_id);
    assert.equal((await request(`/bids/auctions/property/${property.id}`, 'GET', undefined, buyer)).data.auction.auction_id, auction.auction_id);
    assert.equal((await request('/bids/auctions/create', 'POST', { property_id: property.id, starting_price: 100 }, seller)).status, 400);
    assert.equal(db.getAuctionByPropertyId('missing-property'), null);
  });
  await t.test('buyer requests access and only owner approves, idempotently', async () => {
    registration = (await request(`/bids/auctions/${auction.auction_id}/register`, 'POST', {}, buyer)).data.registration;
    assert.equal(registration.status, 'PENDING');
    assert.equal((await request(`/bids/registrations/${registration.id}/status`, 'PUT', { status: 'APPROVED' }, otherSeller)).status, 400);
    assert.equal((await request(`/bids/registrations/${registration.id}/status`, 'PUT', { status: 'APPROVED' }, investor)).status, 403);
    assert.equal((await request(`/bids/registrations/${registration.id}/status`, 'PUT', { status: 'INVALID' }, seller)).status, 400);
    for (let i = 0; i < 2; i++) assert.equal((await request(`/bids/registrations/${registration.id}/status`, 'PUT', { status: 'APPROVED' }, seller)).status, 200);
    assert.equal(db.getAuctionById(auction.auction_id).total_participants, 1);
    assert.equal((await request(`/bids/auctions/${auction.auction_id}/status`, 'PUT', { status: 'LIVE' }, seller)).status, 200);
  });
  await t.test('unapproved and impersonated bids rejected on all routes', async () => {
    for (const route of [`/bids/auctions/${auction.auction_id}/bid`, `/bids/auctions/property/${property.id}/bid`, `/bids/property/${property.id}/bid`, `/properties/${property.id}/bid`]) {
      assert.equal((await request(route, 'POST', { amount: 102 }, outsider)).status, 400);
      assert.equal((await request(route, 'POST', { buyer_id: buyer.email, amount: 102 }, outsider)).status, 403);
    }
    assert.equal(db.getAuctionById(auction.auction_id).total_participants, 1);
    assert.equal((await request(`/properties/${property.id}`, 'PUT', { sellerEmail: otherSeller.email }, otherSeller)).status, 403);
  });
  await t.test('valid bid persists with authenticated buyer, history and seller notification', async () => {
    const result = await request(`/bids/auctions/${auction.auction_id}/bid`, 'POST', { amount: 100.25, buyerName: 'Forged name' }, buyer);
    assert.equal(result.status, 201); assert.equal(result.data.bid.buyer_id, buyer.email);
    assert.equal(result.data.bid.bidder_name, buyer.name);
    assert.equal(result.data.auction.current_highest_bid, 100.25);
    assert.equal(db.getPropertyById(property.id).bids[0].id, result.data.bid.bid_id);
    assert.equal(db.getNotifications(seller.email, seller.role).filter(n => n.type === 'BID_PLACED').length, 1);
  });
  await t.test('another approved bidder outbids, notification recipient and references are correct', async () => {
    const reg = (await request(`/bids/auctions/${auction.auction_id}/register`, 'POST', {}, second)).data.registration;
    await request(`/bids/registrations/${reg.id}/status`, 'PUT', { status: 'APPROVED' }, seller);
    assert.equal((await request(`/bids/auctions/${auction.auction_id}/bid`, 'POST', { amount: 101 }, second)).status, 201);
    const notifications = (await request('/bids/notifications', 'GET', undefined, buyer)).data.notifications;
    const outbid = notifications.filter(n => n.type === 'OUTBID');
    assert.equal(outbid.length, 1); assert.equal(outbid[0].property_id, property.id); assert.equal(outbid[0].auction_id, auction.auction_id);
    assert.equal((await request('/bids/notifications', 'GET', undefined, outsider)).data.notifications.some(n => n.type === 'OUTBID'), false);
    assert.equal((await request(`/bids/notifications/${outbid[0].id}/read`, 'PUT', {}, outsider)).status, 400);
    assert.equal((await request(`/bids/registrations/user/${buyer.email}`, 'GET', undefined, outsider)).status, 403);
    const broadcast = notifications.find(n => n.user_id === 'BUYERS');
    await request(`/bids/notifications/${broadcast.id}/read`, 'PUT', {}, buyer);
    assert.equal(db.getNotifications(second.email, 'Buyer').find(n => n.id === broadcast.id).read, false);
  });
  await t.test('equal, low, malformed and nonfinite bids rejected without changes', async () => {
    for (const amount of [101, 100, 101.1, 0, -5, '102junk', 'Infinity', true, [], {}, '']) {
      assert.equal((await request(`/bids/auctions/${auction.auction_id}/bid`, 'POST', { amount }, buyer)).status, 400, JSON.stringify(amount));
    }
    assert.equal(db.getAuctionById(auction.auction_id).total_bids, 2);
  });
  await t.test('simultaneous bids are serialized; one duplicate amount succeeds', async () => {
    const results = await Promise.all(Array.from({ length: 12 }, (_, i) => request(`/bids/auctions/${auction.auction_id}/bid`, 'POST', { amount: 102 }, i % 2 ? buyer : second)));
    assert.equal(results.filter(r => r.status === 201).length, 1);
    const state = db.getAuctionById(auction.auction_id);
    assert.equal(state.current_highest_bid, 102); assert.equal(state.total_bids, 3);
    assert.equal(new Set(state.bids.map(b => b.bid_id)).size, 3);
  });
  await t.test('failed durable write rolls back bids, property mirror and notifications', async () => {
    const before = db.getAuctionById(auction.auction_id);
    const count = db.getNotifications(seller.email, 'Seller').length;
    const blocked = path.join(directory, 'auction-state.json.tmp'); fs.mkdirSync(blocked);
    try { assert.throws(() => db.placeAuctionBid(auction.auction_id, buyer.email, buyer.name, 103)); }
    finally { fs.rmdirSync(blocked); }
    assert.deepEqual(db.getAuctionById(auction.auction_id), before);
    assert.equal(db.getNotifications(seller.email, 'Seller').length, count);
  });
  await t.test('rejection revokes token and participation', async () => {
    await request(`/bids/registrations/${registration.id}/status`, 'PUT', { status: 'REJECTED' }, seller);
    assert.equal((await request(`/bids/auctions/${auction.auction_id}/bid`, 'POST', { amount: 103 }, buyer)).status, 400);
    assert.equal(db.getAuctionById(auction.auction_id).participants.some(p => p.buyer_id === buyer.email), false);
  });
  await t.test('pause/end block bids, unauthorized control and terminal reopening blocked', async () => {
    assert.equal((await request(`/bids/auctions/${auction.auction_id}/status`, 'PUT', { status: 'PAUSED' }, buyer)).status, 403);
    assert.equal((await request(`/bids/auctions/${auction.auction_id}/status`, 'PUT', { status: 'PAUSED' }, otherSeller)).status, 400);
    await request(`/bids/auctions/${auction.auction_id}/status`, 'PUT', { status: 'PAUSED' }, seller);
    assert.equal((await request(`/bids/auctions/${auction.auction_id}/bid`, 'POST', { amount: 103 }, second)).status, 400);
    await request(`/bids/auctions/${auction.auction_id}/status`, 'PUT', { status: 'ENDED' }, seller);
    assert.equal((await request(`/bids/auctions/${auction.auction_id}/bid`, 'POST', { amount: 103 }, second)).status, 400);
    assert.equal((await request(`/bids/auctions/${auction.auction_id}/register`, 'POST', {}, outsider)).status, 400);
    assert.equal((await request('/bids/auctions?view=live', 'GET', undefined, buyer)).data.auctions.some(a => a.auction_id === auction.auction_id), false);
    assert.equal((await request(`/properties/${property.id}`, 'GET')).data.can_request_access, false);
    assert.equal((await request('/bids/auctions?view=history', 'GET', undefined, buyer)).data.auctions.some(a => a.auction_id === auction.auction_id), true);
    assert.equal((await request(`/bids/auctions/${auction.auction_id}/status`, 'PUT', { status: 'LIVE' }, seller)).status, 400);
  });
  await t.test('launch uses server time, ignores client schedule and enforces duration/expiry', async () => {
    const another = db.addProperty({ id: 'timing-property', name: 'Timing', price: 100, sellerEmail: seller.email });
    const launchBefore = Date.now();
    const future = db.createAuction({ property_id: another.id, seller_id: seller.email, starting_price: 100, auction_start: new Date(Date.now() + 3600000).toISOString() });
    assert.ok(Date.parse(future.auction_start) >= launchBefore);
    assert.ok(Date.parse(future.auction_start) <= Date.now());
    assert.equal(future.status, 'LIVE');
    assert.equal(Date.parse(future.auction_end) - Date.parse(future.auction_start), 24 * 3600000);
    db.updateAuctionStatus(future.auction_id, 'CLOSED', seller.email);
    const expired = db.createAuction({ property_id: another.id, seller_id: seller.email, starting_price: 100, duration_hours: 0.00001 });
    await new Promise(resolve => setTimeout(resolve, 50));
    assert.equal(db.getAuctionById(expired.auction_id).status, 'ENDED');
    assert.equal(db.getAuctionById(expired.auction_id).is_visible_live, false);
    assert.throws(() => db.requestRegistration(expired.auction_id, { buyer_id: second.email }), /ended/);
    assert.throws(() => db.placeAuctionBid(expired.auction_id, second.email, second.name, 110), /ended/);
    // Read a legacy scheduled record from an isolated copy, without enabling
    // client scheduling for new launches or changing the live database.
    const scheduledDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'auction-upcoming-'));
    const scheduledState = JSON.parse(fs.readFileSync(path.join(directory, 'auction-state.json'), 'utf8'));
    const scheduled = scheduledState.auctionsData.find(a => a.auction_id === future.auction_id);
    Object.assign(scheduled, { status: 'UPCOMING', published_at: new Date().toISOString(), auction_start: new Date(Date.now() + 3600000).toISOString(), auction_end: new Date(Date.now() + 7200000).toISOString() });
    fs.writeFileSync(path.join(scheduledDirectory, 'auction-state.json'), JSON.stringify(scheduledState));
    const child = spawnSync(process.execPath, ['--input-type=module', '-e', `import {db} from './backend/database/db.js'; const a=db.getAuctionById(${JSON.stringify(future.auction_id)}); if(!a.is_visible_live||!a.is_upcoming||a.can_bid||a.can_request_access)throw new Error('Upcoming gating failed'); for(const action of [()=>db.requestRegistration(a.auction_id,{buyer_id:'future-buyer'}),()=>db.placeAuctionBid(a.auction_id,'future-buyer','Buyer',1000)]){let blocked=false;try{action()}catch{blocked=true}if(!blocked)throw new Error('Upcoming participation allowed')}`], { encoding: 'utf8', env: { ...process.env, DATA_DIR: scheduledDirectory } });
    assert.equal(child.status, 0, child.stderr);
  });
  await t.test('closed, cancelled, frozen and completed auctions reject bids; sale preserves result', () => {
    for (const status of ['CLOSED', 'CANCELLED', 'FROZEN', 'COMPLETED']) {
      const prop = db.addProperty({ id: `state-${status}`, name: status, price: 100, sellerEmail: seller.email });
      const auc = db.createAuction({ property_id: prop.id, seller_id: seller.email, starting_price: 100 });
      const reg = db.requestRegistration(auc.auction_id, { buyer_id: second.email, buyer_name: second.name, buyer_email: second.email });
      db.updateRegistrationStatus(reg.id, 'APPROVED', seller.email);
      db.updateAuctionStatus(auc.auction_id, 'LIVE', seller.email);
      if (status === 'COMPLETED') {
        const sold = db.sellProperty(auc.auction_id, second.email, 110, seller.email);
        assert.equal(sold.saleRecord.final_selling_price, 110);
        assert.equal(db.getPropertyById(prop.id).isSold, true);
        assert.equal(sold.auction.winner_id, second.email);
        assert.throws(() => db.sellProperty(auc.auction_id, second.email, 110, seller.email));
      } else db.updateAuctionStatus(auc.auction_id, status, seller.email);
      assert.throws(() => db.placeAuctionBid(auc.auction_id, second.email, second.name, 111));
    }
  });
  await t.test('auction capacity, fractional increments and invalid creation are enforced', () => {
    const prop = db.addProperty({ id: 'capacity-property', name: 'Capacity', price: 100, sellerEmail: seller.email });
    for (const fields of [{ starting_price: -1 }, { minimum_increment: 0 }, { minimum_increment: 0.0000001 }, { duration_hours: '1junk' }, { max_participants: 1.5 }]) {
      assert.throws(() => db.createAuction({ property_id: prop.id, seller_id: seller.email, starting_price: 100, ...fields }));
    }
    const auc = db.createAuction({ property_id: prop.id, seller_id: seller.email, starting_price: 100, minimum_increment: 0.1, max_participants: 1 });
    const firstReg = db.requestRegistration(auc.auction_id, { buyer_id: buyer.email, buyer_name: buyer.name });
    const nextReg = db.requestRegistration(auc.auction_id, { buyer_id: second.email, buyer_name: second.name });
    db.updateRegistrationStatus(firstReg.id, 'APPROVED', seller.email);
    assert.throws(() => db.updateRegistrationStatus(nextReg.id, 'APPROVED', seller.email), /capacity/);
    db.updateAuctionStatus(auc.auction_id, 'LIVE', seller.email);
    assert.equal(db.placeAuctionBid(auc.auction_id, buyer.email, buyer.name, 100.1).bid_amount, 100.1);
    assert.equal(db.placeAuctionBid(auc.auction_id, buyer.email, buyer.name, 100.2).bid_amount, 100.2);
    assert.throws(() => db.placeAuctionBid(auc.auction_id, buyer.email, buyer.name, 100.299999));
  });
  await t.test('restart reloads bids, approvals, status and notifications; second server blocked', () => {
    const duplicate = spawnSync(process.execPath, ['--input-type=module', '-e', "import './backend/database/db.js'"], { encoding: 'utf8', env: process.env });
    assert.notEqual(duplicate.status, 0); assert.match(duplicate.stderr, /already in use/);
    const restarted = fs.mkdtempSync(path.join(os.tmpdir(), 'realty-restart-'));
    fs.copyFileSync(path.join(directory, 'auction-state.json'), path.join(restarted, 'auction-state.json'));
    const child = spawnSync(process.execPath, ['--input-type=module', '-e', `import { db } from './backend/database/db.js'; if (!Object.keys(db.getHistoricalData()).length) throw new Error('Historical data lost'); if (!db.getNotifications(${JSON.stringify(seller.email)}, 'Seller').some(n => n.type === 'BID_PLACED')) throw new Error('Notifications lost'); console.log(JSON.stringify(db.getAuctionById(${JSON.stringify(auction.auction_id)})));`], { encoding: 'utf8', env: { ...process.env, DATA_DIR: restarted } });
    assert.equal(child.status, 0, child.stderr);
    const state = JSON.parse(child.stdout); assert.equal(state.current_highest_bid, 102); assert.equal(state.total_bids, 3); assert.equal(state.status, 'ENDED');
    assert.equal(state.registrations.find(r => r.buyer_id === buyer.email).status, 'REJECTED');
  });
  await t.test('logout invalidates session', async () => {
    await request('/auth/logout', 'POST', {}, buyer);
    assert.equal((await request('/bids/auctions', 'GET', undefined, buyer)).status, 401);
  });
});
