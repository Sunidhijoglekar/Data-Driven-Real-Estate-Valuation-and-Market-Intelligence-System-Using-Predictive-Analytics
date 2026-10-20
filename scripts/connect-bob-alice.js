import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Explicit stored account keys and the first page (12 records) fetched by
// Alice's unfiltered dashboard. Never discover an account by display name.
export const bobId = 'bob@gmail.com';
export const aliceId = 'alice@gmail.com';
export const propertyIds = ['prop-4', 'prop-7', 'prop-8', 'prop-9', 'prop-10', 'prop-11',
  'prop-12', 'prop-13', 'prop-14', 'prop-15', 'prop-16', 'prop-17'];

export function inspectConnection(state, accounts) {
  if (accounts[bobId]?.role !== 'Seller' || accounts[bobId]?.email !== bobId) throw new Error(`Existing seller ${bobId} is required`);
  if (accounts[aliceId]?.role !== 'Buyer' || accounts[aliceId]?.email !== aliceId) throw new Error(`Existing buyer ${aliceId} is required`);
  return propertyIds.map(id => {
    const property = state.propertiesData.find(p => String(p.id) === id);
    if (!property || property.isSold || property.status === 'Sold') throw new Error(`Existing unsold property ${id} is required`);
    return { property_id: id, name: property.name, owner_id: property.sellerEmail, manager_id: bobId };
  });
}

async function main() {
  const directory = path.resolve(process.env.DATA_DIR || 'database/runtime');
  const statePath = path.join(directory, 'auction-state.json');
  const accountPath = path.join(directory, 'accounts.json');
  const accountBytes = fs.readFileSync(accountPath);
  let before = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const accounts = JSON.parse(accountBytes);
  const plan = inspectConnection(before, accounts);
  if (!process.argv.includes('--apply') && !process.argv.includes('--revoke')) {
    console.log(JSON.stringify({ mode: 'preview', accounts: { seller_id: bobId, buyer_id: aliceId }, properties: plan }, null, 2));
    return;
  }
  // Import acquires the server's exclusive lock; never edit a running server's state.
  const { db } = await import('../backend/database/db.js');
  before = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  inspectConnection(before, accounts);
  const backupDirectory = path.join(directory, 'backups');
  fs.mkdirSync(backupDirectory, { recursive: true });
  const backup = path.join(backupDirectory, `before-bob-access-${Date.now()}.json`);
  fs.copyFileSync(statePath, backup);
  if (process.argv.includes('--revoke')) {
    db.revokeAuctionManagement(propertyIds, bobId, 'project-owner-request', 'Revoke scoped Bob/Alice development auction access');
  } else {
    db.grantAuctionManagement(propertyIds, bobId, 'project-owner-request', 'Manage existing first-page Alice catalogue auctions for the Bob/Alice development workflow; ownership retained');
  }
  const after = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  for (const field of ['propertiesData', 'auctionsData', 'auctionRegistrationsData', 'auctionTokensData', 'auctionParticipantsData', 'auctionBidsData', 'propertySalesData', 'buyerTokensData']) {
    if (JSON.stringify(before[field]) !== JSON.stringify(after[field])) throw new Error(`Unexpected change to ${field}`);
  }
  if (!accountBytes.equals(fs.readFileSync(accountPath))) throw new Error('Account file changed unexpectedly');
  console.log(JSON.stringify({ mode: process.argv.includes('--revoke') ? 'revoked' : 'applied', manager_id: bobId,
    property_count: plan.length, backup, property_records_unchanged: true, credentials_unchanged: true,
    active_grants: after.auctionManagersData.filter(g => g.manager_id === bobId && !g.revoked_at).length }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
