import { randomUUID } from 'node:crypto';
import { readStore, writeStore } from './storage.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to ML datasets
const PROPERTIES_FILE = path.join(__dirname, '../../ml/datasets/current_properties.json');
const HISTORICAL_FILE = path.join(__dirname, '../../ml/datasets/historical_price_trends.json');

// In-Memory Data Store synced with JSON
let propertiesData = [];
let historicalData = {};

// Auction Tables
let auctionsData = [];
let auctionManagersData = [];
let auctionRegistrationsData = [];
let auctionTokensData = [];
let auctionParticipantsData = [];
let auctionBidsData = [];
let propertySalesData = [];
let buyerTokensData = {};
let notificationsData = [];

function initData() {
  try {
    if (fs.existsSync(PROPERTIES_FILE)) {
      propertiesData = JSON.parse(fs.readFileSync(PROPERTIES_FILE, 'utf8'));
    }
    if (fs.existsSync(HISTORICAL_FILE)) {
      historicalData = JSON.parse(fs.readFileSync(HISTORICAL_FILE, 'utf8'));
    }

    // Property imports preserve listing data and legacy property bid history.
    // Only an explicit seller launch creates/publishes an auction record.

  } catch (err) {
    throw err;
  }
}

const persisted = readStore('auction-state', null);
if (persisted) {
  restore(persisted);
  if (fs.existsSync(HISTORICAL_FILE)) historicalData = JSON.parse(fs.readFileSync(HISTORICAL_FILE, 'utf8'));
}
else initData();
function snapshot() {
  return structuredClone({ propertiesData, auctionsData, auctionRegistrationsData,
    auctionTokensData, auctionParticipantsData, auctionBidsData, propertySalesData,
    buyerTokensData, notificationsData, auctionManagersData });
}
function restore(state) {
  ({ propertiesData, auctionsData, auctionRegistrationsData, auctionTokensData,
    auctionParticipantsData, auctionBidsData, propertySalesData, buyerTokensData,
    notificationsData, auctionManagersData = [] } = state);
}
function owner(auction, sellerId) {
  if (!auction || auction.seller_id !== sellerId) throw new Error('Only the owning seller can modify this auction');
}
// Management grants are property-scoped and do not confer ownership or sale rights.
function canManageProperty(propertyId, actorId) {
  const property = propertiesData.find(p => String(p.id) === String(propertyId));
  return !!property && (property.sellerEmail === actorId || auctionManagersData.some(grant =>
    !grant.revoked_at && grant.property_id === String(property.id) && grant.manager_id === actorId && grant.owner_id === property.sellerEmail));
}
function canManageAuction(auction, actorId) {
  if (!auction) return false;
  const property = propertiesData.find(p => String(p.id) === String(auction.property_id));
  return auction.seller_id === actorId || (!!property && auction.seller_id === property.sellerEmail && canManageProperty(property.id, actorId));
}
function assertAuctionManager(auction, actorId) {
  if (!canManageAuction(auction, actorId)) throw new Error('Only the owner or an authorized auction manager can modify this auction');
}
function sellerRecipients(auction) {
  const property = propertiesData.find(p => String(p.id) === String(auction.property_id));
  const managers = auctionManagersData.filter(g => !g.revoked_at && g.property_id === String(auction.property_id) && g.owner_id === property?.sellerEmail).map(g => g.manager_id);
  return [...new Set([auction.seller_id, ...managers])];
}
function notifySellerTeam(type, message, auction, extra = {}) {
  for (const recipient of sellerRecipients(auction)) notify(recipient, type, message, auction, extra);
}
const terminal = status => ['ENDED', 'CLOSED', 'CANCELLED', 'COMPLETED'].includes(status);
function available(auction) {
  if (!auction) throw new Error('Auction not found');
  if (terminal(auction.status) || Date.parse(auction.auction_end) <= Date.now()) throw new Error('Auction has ended');
}
function participation(auction) {
  const property = auction && propertiesData.find(p => String(p.id) === String(auction.property_id));
  const published = !!auction?.published_at;
  const start = Date.parse(auction?.auction_start);
  const end = Date.parse(auction?.auction_end);
  const propertyAvailable = !!property && !property.isSold && property.status !== 'Sold';
  const inWindow = Number.isFinite(start) && Number.isFinite(end) && start <= Date.now() && Date.now() < end;
  const active = published && propertyAvailable && auction.status === 'LIVE' && inWindow;
  const upcoming = published && propertyAvailable && ['UPCOMING', 'LIVE'].includes(auction.status) && Date.now() < start && Date.now() < end;
  return { is_published: published, is_visible_live: active || upcoming, can_request_access: active, can_bid: active, is_upcoming: upcoming };
}
function positive(value, label) {
  if (!['number', 'string'].includes(typeof value) || !String(value).trim() || !Number.isFinite(Number(value)) || Number(value) <= 0) throw new Error(`${label} must be a positive finite number`);
  return Number(value);
}
function money(value, label) {
  const amount = positive(value, label);
  const units = Math.round(amount * 1e6);
  if (Math.abs(amount * 1e6 - units) > 1e-5 || !Number.isSafeInteger(units) || units < 1) throw new Error(`${label} must have at most six decimal places and fit the supported range`);
  return amount;
}
function notify(user, type, message, auction, extra = {}) {
  notificationsData.unshift({ id: randomUUID(), user_id: user, type, title: type.replaceAll('_', ' '), message,
    timestamp: new Date().toISOString(), read: false, auction_id: auction.auction_id,
    property_id: auction.property_id, property_name: db.getPropertyById(auction.property_id)?.name, ...extra });
}

export const db = {
  canManagePropertyAuctions: canManageProperty,
  canManageAuction,
  revokeAuctionManagement: (propertyIds, managerId, revokedBy, reason) => {
    if (!revokedBy || !reason) throw new Error('Revocation requires an audit reason and authorizer');
    for (const grant of auctionManagersData) if (!grant.revoked_at && grant.manager_id === managerId && propertyIds.map(String).includes(grant.property_id)) {
      Object.assign(grant, { revoked_at: new Date().toISOString(), revoked_by: revokedBy, revocation_reason: reason });
    }
    return true;
  },
  getSellerAuctionInventory: actorId => propertiesData.filter(p => !p.isSold && p.status !== 'Sold' && canManageProperty(p.id, actorId)).map(p => ({ ...p,
    can_manage_auctions: true, management_access: p.sellerEmail === actorId ? 'OWNER' : 'AUCTION_MANAGER',
    current_auction_id: auctionsData.find(a => String(a.property_id) === String(p.id))?.auction_id || null,
    current_auction_status: auctionsData.find(a => String(a.property_id) === String(p.id))?.status || null,
    current_auction_published: !!auctionsData.find(a => String(a.property_id) === String(p.id))?.published_at })),
  // Offline migration only; deliberately not exposed through an HTTP endpoint.
  grantAuctionManagement: (propertyIds, managerId, grantedBy, reason) => {
    const accounts = readStore('accounts', {});
    if (accounts[managerId]?.role !== 'Seller') throw new Error('Manager must be an existing Seller account');
    if (!grantedBy || !reason) throw new Error('Grant requires an audit reason and authorizer');
    const granted = [];
    for (const id of [...new Set(propertyIds.map(String))]) {
      const property = propertiesData.find(p => String(p.id) === id);
      if (!property || property.isSold || property.status === 'Sold') throw new Error(`Property ${id} is not an available listing`);
      if (property.sellerEmail === managerId) continue;
      const existing = auctionManagersData.find(g => !g.revoked_at && g.property_id === id && g.manager_id === managerId && g.owner_id === property.sellerEmail);
      if (existing) { granted.push(existing); continue; }
      const grant = { grant_id: randomUUID(), property_id: id, manager_id: managerId, owner_id: property.sellerEmail,
        scope: 'AUCTION_MANAGEMENT', granted_by: grantedBy, reason, granted_at: new Date().toISOString() };
      auctionManagersData.push(grant); granted.push(grant);
      // Surface already-pending requests to the newly authorized manager exactly once.
      for (const reg of auctionRegistrationsData.filter(r => String(r.property_id) === id && r.status === 'PENDING')) {
        const auction = auctionsData.find(a => a.auction_id === reg.auction_id);
        const alreadyNotified = notificationsData.some(n => n.user_id === managerId && n.type === 'REGISTRATION_REQUESTED' && n.registration_id === (reg.id || reg.registration_id));
        if (auction && !alreadyNotified) notify(managerId, 'REGISTRATION_REQUESTED', `${reg.buyer_name} requested bidding access.`, auction,
          { registration_id: reg.id || reg.registration_id, buyer_name: reg.buyer_name, buyer_email: reg.buyer_email });
      }
    }
    return granted;
  },
  getProperties: () => propertiesData.filter(p => !p.isSold && p.status !== 'Sold'),
  getAllProperties: () => propertiesData,

  getPropertyById: (id) => propertiesData.find(p => String(p.id) === String(id)),

  addProperty: (newProp) => {
    propertiesData.unshift(newProp);

    newProp.auctionEnabled = false;
    newProp.auctionEnd = null;
    return newProp;
  },

  updateProperty: (id, updatedFields) => {
    const idx = propertiesData.findIndex(p => String(p.id) === String(id));
    if (idx !== -1) {
      propertiesData[idx] = { ...propertiesData[idx], ...updatedFields };

      const auction = auctionsData.find(a => String(a.property_id) === String(id));
      if (updatedFields.auctionEnabled === false && auction && !terminal(auction.status)) {
        db.updateAuctionStatus(auction.auction_id, 'CANCELLED', propertiesData[idx].sellerEmail);
      } else if (updatedFields.auctionEnabled === true) {
        throw new Error('Use Launch Live Auction to enable bidding');
      }

      return propertiesData[idx];
    }
    return null;
  },

  deleteProperty: (id) => {
    const initialLen = propertiesData.length;
    propertiesData = propertiesData.filter(p => String(p.id) !== String(id));
    auctionsData = auctionsData.filter(a => String(a.property_id) !== String(id));
    if (propertiesData.length !== initialLen) {
      return true;
    }
    return false;
  },

  addBid: (propertyId, bidData) => {
    const prop = propertiesData.find(p => String(p.id) === String(propertyId));
    if (prop) {
      if (!prop.bids) prop.bids = [];
      prop.bids.unshift(bidData);
      return prop;
    }
    return null;
  },

  acceptBid: (propertyId, bidId) => {
    const prop = propertiesData.find(p => String(p.id) === String(propertyId));
    if (prop && prop.bids) {
      prop.bids.forEach(b => {
        if (b.id === bidId) {
          b.status = 'ACCEPTED';
        } else {
          b.status = 'OUTBID';
        }
      });
      return prop;
    }
    return null;
  },

  getPropertyAuctionState: propertyId => {
    const auction = auctionsData.find(a => String(a.property_id) === String(propertyId) && a.published_at && !terminal(a.status));
    const access = participation(auction);
    const bids = auction ? auctionBidsData.filter(b => b.auction_id === auction.auction_id) : [];
    return { auctionEnabled: access.can_request_access, can_request_access: access.can_request_access,
      auction_id: auction?.auction_id || null, auction_status: auction?.status || null,
      auction_start: auction?.auction_start || null, auctionEnd: auction?.auction_end || null,
      auction_highest_bid: auction ? Math.max(auction.starting_price, ...bids.map(b => b.bid_amount)) : null };
  },
  // Auction summaries use bid records as the source of truth.
  getAuctions: () => auctionsData.map(a => db.getAuctionById(a.auction_id)),
  getAuctionById: id => {
    const auction = auctionsData.find(a => a.auction_id === id || String(a.property_id) === String(id));
    if (!auction) return null;
    const bids = auctionBidsData.filter(b => b.auction_id === auction.auction_id).sort((a, b) => b.bid_amount - a.bid_amount);
    const participants = auctionParticipantsData.filter(p => p.auction_id === auction.auction_id);
    const bidders = new Map();
    for (const bid of bids) {
      const previous = bidders.get(bid.buyer_id);
      if (previous) previous.bid_count++;
      else bidders.set(bid.buyer_id, { buyer_id: bid.buyer_id, bidder_name: bid.bidder_name,
        highest_bid: bid.bid_amount, bid_count: 1, email: bid.buyer_id,
        phone: participants.find(p => p.buyer_id === bid.buyer_id)?.buyer_phone, last_bid_time: bid.bid_time });
    }
    return { ...auction, ...participation(auction), property: db.getPropertyById(auction.property_id), bids,
      registrations: auctionRegistrationsData.filter(r => r.auction_id === auction.auction_id), participants,
      distinct_bidders: [...bidders.values()], total_participants: participants.length, total_bids: bids.length,
      current_highest_bid: Math.max(auction.starting_price, bids[0]?.bid_amount ?? 0),
      highest_bidder_name: bids[0]?.bidder_name ?? null, highest_bidder_id: bids[0]?.buyer_id ?? null,
      sale_summary: propertySalesData.find(s => s.auction_id === auction.auction_id) || null };
  },
  getAuctionByPropertyId: id => {
    const auction = auctionsData.find(a => String(a.property_id) === String(id));
    return auction ? db.getAuctionById(auction.auction_id) : null;
  },
  createAuction: params => {
    const property = db.getPropertyById(params.property_id);
    if (!property) throw new Error('Property not found');
    if (!canManageProperty(property.id, params.seller_id)) throw new Error('Only the owner or an authorized auction manager can create an auction');
    if (property.isSold || property.status === 'Sold') throw new Error('Property is sold');
    const existing = auctionsData.find(a => String(a.property_id) === String(params.property_id) && !terminal(a.status));
    if (existing?.published_at) throw new Error('Property already has a published active auction');
    const duration = positive(params.duration_hours ?? 24, 'Duration');
    const capacity = positive(params.max_participants ?? 10, 'Capacity');
    if (!Number.isInteger(capacity)) throw new Error('Capacity must be an integer');
    const start = new Date();
    const end = new Date(start.getTime() + duration * 3600000);
    if (!Number.isFinite(end.getTime()) || end.getTime() <= start.getTime()) throw new Error('Invalid auction duration');
    const auction = { ...(existing || {}), auction_id: existing?.auction_id || `auc-${randomUUID()}`, property_id: String(property.id), seller_id: property.sellerEmail, created_by: params.seller_id,
      starting_price: money(params.starting_price, 'Starting price'), minimum_increment: money(params.minimum_increment ?? 1, 'Increment'),
      duration_hours: duration, max_participants: capacity, auction_start: start.toISOString(), auction_end: end.toISOString(),
      status: 'LIVE', published_at: start.toISOString(), winner_id: null, winner_name: null, winning_bid: null, completed_at: null, created_at: existing?.created_at || start.toISOString() };
    if (existing) Object.assign(existing, auction);
    else auctionsData.unshift(auction);
    Object.assign(property, { auctionEnabled: true, startingPrice: auction.starting_price, minIncrement: auction.minimum_increment, auctionEnd: auction.auction_end });
    notifySellerTeam('AUCTION_CREATED', `Live auction launched for ${property.name}. Buyer access requests are open.`, auction);
    notify('BUYERS', 'AUCTION_CREATED', `Request bidding access for ${property.name}.`, auction);
    return db.getAuctionById(auction.auction_id);
  },
  requestRegistration: (id, buyer) => {
    const auction = db.getAuctionById(id);
    available(auction);
    if (!auction.can_request_access) throw new Error('Access requests require a published, active live auction');
    const existing = auctionRegistrationsData.find(r => r.auction_id === auction.auction_id && r.buyer_id === buyer.buyer_id);
    if (existing) return existing;
    const reg = { ...buyer, id: `reg-${randomUUID()}`, auction_id: auction.auction_id, property_id: auction.property_id,
      status: 'PENDING', requested_at: new Date().toISOString(), approved_at: null, token_id: null };
    reg.registration_id = reg.id;
    auctionRegistrationsData.push(reg);
    notifySellerTeam('REGISTRATION_REQUESTED', `${buyer.buyer_name} requested bidding access.`, auction, { registration_id: reg.id, buyer_name: buyer.buyer_name, buyer_email: buyer.buyer_email });
    notify(buyer.buyer_id, 'REGISTRATION_PENDING', 'Your request is awaiting seller approval.', auction);
    return reg;
  },
  updateRegistrationStatus: (id, status, sellerId) => {
    const reg = auctionRegistrationsData.find(r => r.id === id || r.registration_id === id);
    if (!reg) throw new Error('Registration not found');
    const auction = db.getAuctionById(reg.auction_id);
    assertAuctionManager(auction, sellerId); available(auction);
    if (!['APPROVED', 'REJECTED'].includes(status)) throw new Error('Invalid registration status');
    if (reg.status === status) return reg;
    if (status === 'APPROVED' && !auction.can_request_access) throw new Error('Approval requires a published, active live auction');
    const others = auctionParticipantsData.filter(p => p.auction_id === auction.auction_id && p.buyer_id !== reg.buyer_id);
    if (status === 'APPROVED' && others.length >= auction.max_participants) throw new Error('Participant capacity reached');
    auctionParticipantsData = auctionParticipantsData.filter(p => !(p.auction_id === auction.auction_id && p.buyer_id === reg.buyer_id));
    auctionTokensData = auctionTokensData.filter(t => !(t.auction_id === auction.auction_id && t.buyer_id === reg.buyer_id));
    reg.status = status; reg.action_at = new Date().toISOString(); reg.token_id = null;
    if (status === 'APPROVED') {
      reg.token_id = `tok-${randomUUID()}`; reg.approved_at = reg.action_at;
      auctionTokensData.push({ token_id: reg.token_id, auction_id: reg.auction_id, buyer_id: reg.buyer_id, status: 'ACTIVE', issued_at: reg.action_at });
      auctionParticipantsData.push({ participant_id: `part-${randomUUID()}`, auction_id: reg.auction_id,
        buyer_id: reg.buyer_id, buyer_name: reg.buyer_name, buyer_email: reg.buyer_email, buyer_phone: reg.buyer_phone,
        token_id: reg.token_id, joined_at: reg.action_at });
    }
    notify(reg.buyer_id, `REGISTRATION_${status}`, status === 'APPROVED' ? 'Seller approved your access. Bidding is available when the seller starts the auction.' : 'Seller declined your access request.', auction);
    notifySellerTeam(`SELLER_${status}_BIDDER`, `${reg.buyer_name}: ${status}`, auction);
    return reg;
  },
  updateAuctionStatus: (id, status, sellerId) => {
    const summary = db.getAuctionById(id); assertAuctionManager(summary, sellerId); available(summary);
    const auction = auctionsData.find(a => a.auction_id === summary.auction_id);
    if (status === auction.status) return summary;
    const transitions = {
      UPCOMING: ['REGISTRATION_OPEN', 'LIVE', 'CLOSED', 'CANCELLED'],
      REGISTRATION_OPEN: ['REGISTRATION_CLOSED', 'LIVE', 'ENDED', 'CLOSED', 'CANCELLED'],
      REGISTRATION_CLOSED: ['REGISTRATION_OPEN', 'LIVE', 'ENDED', 'CLOSED', 'CANCELLED'],
      LIVE: ['PAUSED', 'FROZEN', 'ENDED', 'CLOSED', 'CANCELLED'], PAUSED: ['LIVE', 'FROZEN', 'ENDED', 'CLOSED', 'CANCELLED'], FROZEN: ['ENDED', 'CLOSED']
    };
    if (!transitions[auction.status]?.includes(status)) throw new Error('Invalid auction status transition');
    if (status === 'LIVE' && !auction.published_at) throw new Error('Launch the auction before starting bidding');
    if (status === 'LIVE' && Date.parse(auction.auction_start) > Date.now()) throw new Error('Auction has not started yet');
    auction.status = status;
    for (const participant of summary.participants) notify(participant.buyer_id, status, `Auction status: ${status}`, auction);
    notifySellerTeam('SELLER_ACTION', `Auction status: ${status}`, auction);
    return db.getAuctionById(auction.auction_id);
  },
  placeAuctionBid: (id, buyerId, buyerName, bidAmount) => {
    const auction = db.getAuctionById(id); available(auction);
    if (!auction.can_bid) throw new Error('Auction is not published and active for bidding');
    if (!auction.property || auction.property.isSold || auction.property.status === 'Sold') throw new Error('Property unavailable');
    const reg = auctionRegistrationsData.find(r => r.auction_id === auction.auction_id && r.buyer_id === buyerId);
    const token = auctionTokensData.some(t => t.token_id === reg?.token_id && t.buyer_id === buyerId && t.auction_id === auction.auction_id && t.status === 'ACTIVE');
    if (reg?.status !== 'APPROVED' || !token || !auction.participants.some(p => p.buyer_id === buyerId)) throw new Error('Seller approval and an active auction token are required');
    const amount = money(bidAmount, 'Bid');
    // Currency is stored in Lakhs, with at most six decimal places (one tenth rupee).
    const units = value => Math.round(value * 1e6);
    if (Math.abs(amount * 1e6 - units(amount)) > 1e-5 || !Number.isSafeInteger(units(amount))) throw new Error('Invalid bid precision');
    const minimum = units(auction.current_highest_bid) + units(auction.minimum_increment);
    if (units(amount) < minimum || units(amount) <= units(auction.current_highest_bid)) throw new Error(`Bid must be at least ₹${minimum / 1e6} Lakhs`);
    const bid = { bid_id: `bid-${randomUUID()}`, auction_id: auction.auction_id, property_id: auction.property_id,
      buyer_id: buyerId, bidder_name: buyerName, bid_amount: amount, bid_time: new Date().toISOString() };
    auctionBidsData.unshift(bid);
    const property = db.getPropertyById(auction.property_id);
    property.bids ??= [];
    property.bids.unshift({ id: bid.bid_id, bidder: buyerName, email: buyerId, amount, status: 'ACTIVE', timestamp: bid.bid_time, auction_id: bid.auction_id });
    if (auction.highest_bidder_id && auction.highest_bidder_id !== buyerId) notify(auction.highest_bidder_id, 'OUTBID', `You were outbid. Highest bid: ₹${amount} Lakhs.`, auction);
    notifySellerTeam('BID_PLACED', `${buyerName} bid ₹${amount} Lakhs.`, auction);
    return bid;
  },
  sellProperty: (id, buyerId, finalPrice, sellerId) => {
    const summary = db.getAuctionById(id); owner(summary, sellerId);
    if (['CLOSED', 'CANCELLED', 'COMPLETED'].includes(summary.status)) throw new Error('Auction cannot be sold in this status');
    const participant = summary.participants.find(p => p.buyer_id === buyerId);
    if (!participant) throw new Error('Select an approved participant');
    const price = positive(finalPrice ?? summary.current_highest_bid, 'Final price');
    const auction = auctionsData.find(a => a.auction_id === summary.auction_id);
    const property = db.getPropertyById(summary.property_id);
    if (!property || property.isSold) throw new Error('Property unavailable');
    Object.assign(auction, { status: 'COMPLETED', winner_id: buyerId, winner_name: participant.buyer_name, winning_bid: price, completed_at: new Date().toISOString() });
    Object.assign(property, { isSold: true, status: 'Sold', auctionEnabled: false, soldTo: buyerId, soldPrice: price });
    const saleRecord = { sale_id: randomUUID(), auction_id: auction.auction_id, property_id: property.id,
      property_title: property.name, property_location: property.locality, property_image: property.image,
      final_selling_price: price, buyer_id: buyerId, buyer_name: participant.buyer_name, buyer_email: buyerId,
      seller_id: sellerId, seller_name: property.seller, auction_duration: `${auction.duration_hours} Hours`,
      total_participants: summary.total_participants, total_bids: summary.total_bids, sold_at: auction.completed_at };
    propertySalesData.unshift(saleRecord);
    for (const token of auctionTokensData) if (token.auction_id === auction.auction_id) token.status = 'INACTIVE';
    for (const p of summary.participants) notify(p.buyer_id, p.buyer_id === buyerId ? 'PROPERTY_SOLD' : 'AUCTION_LOST', `Sale of ${property.name} completed.`, auction);
    return { message: 'Property successfully marked as SOLD!', saleRecord, auction: db.getAuctionById(auction.auction_id) };
  },
  getNotifications: (userId, role) => notificationsData.filter(n => n.user_id === userId || n.user_id === 'all' || (role === 'Buyer' && n.user_id === 'BUYERS')).map(n => ({ ...n, read: n.read || n.read_by?.includes(userId) || false, ...participation(auctionsData.find(a => a.auction_id === n.auction_id)) })),
  markNotificationRead: (id, userId, role) => {
    if (!db.getNotifications(userId, role).some(n => n.id === id)) throw new Error('Notification not found');
    const n = notificationsData.find(n => n.id === id);
    n.read_by = [...new Set([...(n.read_by || []), userId])];
    return true;
  },
  markAllNotificationsRead: (userId, role) => {
    for (const n of db.getNotifications(userId, role)) db.markNotificationRead(n.id, userId, role);
    return true;
  },
  getBuyerTokens: id => buyerTokensData[id] ||= { available_tokens: 5, used_tokens: 0 },
  topupBuyerTokens: (id, amount = 5) => {
    const tokens = db.getBuyerTokens(id); tokens.available_tokens += positive(amount, 'Token amount'); return tokens;
  },
  getUserRegistrations: id => auctionRegistrationsData.filter(r => r.buyer_id === id),
  getHistoricalData: () => historicalData
};

// No await or I/O callback may be introduced inside a transaction. Node executes each
// validation + state change + durable snapshot before processing the next bid.
let transactionDepth = 0;
for (const [name, operation] of Object.entries(db)) {
  if (['getHistoricalData', 'canManagePropertyAuctions', 'canManageAuction', 'getPropertyAuctionState'].includes(name)) continue;
  db[name] = (...args) => {
    if (transactionDepth) return operation(...args);
    const before = snapshot(); transactionDepth++;
    try {
      for (const auction of auctionsData) if (!['grantAuctionManagement', 'revokeAuctionManagement'].includes(name) && !terminal(auction.status) && Date.parse(auction.auction_end) <= Date.now()) auction.status = 'ENDED';
      const result = operation(...args);
      const after = snapshot();
      if (JSON.stringify(before) !== JSON.stringify(after)) writeStore('auction-state', after);
      return structuredClone(result);
    } catch (error) { restore(before); throw error; }
    finally { transactionDepth--; }
  };
}
if (!persisted) writeStore('auction-state', snapshot());
