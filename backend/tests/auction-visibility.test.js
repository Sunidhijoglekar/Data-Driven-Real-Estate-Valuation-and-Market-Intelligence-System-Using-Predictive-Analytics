import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { build } from 'esbuild';

async function component(file) {
  const compiled = await build({ entryPoints: [file], bundle: true, write: false, packages: 'external', platform: 'node', format: 'cjs', logLevel: 'silent' });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
  return module.exports.default;
}

test('property cards show bidding only with server-confirmed active auction access', async () => {
  const Card = await component('frontend/src/components/PropertyCard.jsx');
  const property = { id: 'card-fixture', name: 'Visibility fixture', price: 100, area: 1000, city: 'Pune', bhk: 2, auctionEnabled: true };
  const noAuction = renderToStaticMarkup(React.createElement(Card, { property }));
  assert.doesNotMatch(noAuction, /Bid Now|Live Auction/);
  const active = renderToStaticMarkup(React.createElement(Card, { property: { ...property, can_request_access: true, auction_highest_bid: 101 } }));
  assert.match(active, /Bid Now/); assert.match(active, /Live Auction/);
});

test('seller launch form retains duration and has no start-date field', async () => {
  const Seller = await component('frontend/src/pages/SellerDashboard.jsx');
  const html = renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: ['/seller?tab=create-auction'] }, React.createElement(Seller, { user: { email: 'seller-render@example.test', role: 'Seller', name: 'Seller render' } })));
  assert.match(html, /Duration \(Hours\)/);
  assert.match(html, /Launch Live Auction/);
  assert.doesNotMatch(html, /datetime-local|Auction start \(local time\)/);
});

test('fresh data import does not fabricate auctions from catalogue flags', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'auction-import-'));
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', "import {db} from './backend/database/db.js'; const properties=db.getAllProperties(); if(!properties.length) throw new Error('No catalogue imported'); if(db.getAuctions().length) throw new Error('Automatic auctions created'); if(db.getPropertyAuctionState(properties[0].id).can_request_access) throw new Error('Premature access'); console.log('Import preserved listings without creating auctions');"], { encoding: 'utf8', env: { ...process.env, DATA_DIR: directory } });
  assert.equal(child.status, 0, child.stderr);
});
