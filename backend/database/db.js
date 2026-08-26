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
let auctionRegistrationsData = [];
let auctionTokensData = [];
let auctionParticipantsData = [];
let auctionBidsData = [];
let propertySalesData = [];
let buyerTokensData = {
  'buyer@example.com': { available_tokens: 5, used_tokens: 1 }
};
let notificationsData = [
  {
    id: 'notif-1',
    user_id: 'buyer@example.com',
    title: 'Auction Token Welcome Bonus 🎟️',
    message: 'Welcome! You have active Auction Tokens to participate in seller-controlled property auctions.',
    type: 'SYSTEM',
    timestamp: new Date().toISOString(),
    read: false
  },
  {
    id: 'notif-2',
    user_id: 'seller@apexrealty.com',
    title: 'Seller Control Panel Ready ⚡',
    message: 'You have full control over buyer registrations, auction states, and final property sale decisions.',
    type: 'SYSTEM',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    read: false
  }
];

function initData() {
  try {
    if (fs.existsSync(PROPERTIES_FILE)) {
      propertiesData = JSON.parse(fs.readFileSync(PROPERTIES_FILE, 'utf8'));
    }
    if (fs.existsSync(HISTORICAL_FILE)) {
      historicalData = JSON.parse(fs.readFileSync(HISTORICAL_FILE, 'utf8'));
    }

    // Seed default auctions for properties that have auctionEnabled = true
    const now = new Date();
    propertiesData.forEach((prop, idx) => {
      if (prop.auctionEnabled && !auctionsData.find(a => a.property_id === prop.id)) {
        const startTime = new Date(now.getTime() - (idx % 2 === 0 ? 10 * 60 * 1000 : 0));
        const endTime = new Date(now.getTime() + (idx % 2 === 0 ? 2 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000));
        
        const auctionId = `auc-${prop.id}`;
        const initStatus = idx % 3 === 0 ? 'LIVE' : (idx % 3 === 1 ? 'REGISTRATION_OPEN' : 'FROZEN');

        auctionsData.push({
          auction_id: auctionId,
          property_id: prop.id,
          seller_id: prop.sellerEmail || 'seller@apexrealty.com',
          starting_price: prop.startingPrice || prop.price || 150,
          minimum_increment: prop.minIncrement || 1,
          auction_start: startTime.toISOString(),
          auction_end: endTime.toISOString(),
          duration_hours: idx % 2 === 0 ? 2 : 24,
          max_participants: 10,
          status: initStatus,
          winner_id: null,
          winner_name: null,
          winning_bid: null,
          completed_at: null,
          created_at: new Date().toISOString()
        });

        // Seed default approved registration & token for default buyer
        const regId = `reg-${auctionId}-buyer`;
        const tokenId = `tok-${auctionId}-buyer`;
        
        auctionRegistrationsData.push({
          id: regId,
          auction_id: auctionId,
          property_id: prop.id,
          buyer_id: 'buyer@example.com',
          buyer_name: 'Sunidhi Joglekar',
          buyer_email: 'buyer@example.com',
          buyer_phone: '+91 98765 43210',
          status: 'APPROVED',
          requested_at: new Date(now.getTime() - 3600000).toISOString(),
          approved_at: new Date(now.getTime() - 1800000).toISOString(),
          token_id: tokenId
        });

        auctionTokensData.push({
          token_id: tokenId,
          auction_id: auctionId,
          buyer_id: 'buyer@example.com',
          issued_at: new Date(now.getTime() - 1800000).toISOString(),
          status: 'ACTIVE'
        });

        auctionParticipantsData.push({
          participant_id: `part-${auctionId}-buyer`,
          auction_id: auctionId,
          buyer_id: 'buyer@example.com',
          buyer_name: 'Sunidhi Joglekar',
          buyer_email: 'buyer@example.com',
          buyer_phone: '+91 98765 43210',
          token_id: tokenId,
          joined_at: new Date(now.getTime() - 1800000).toISOString()
        });

        // Seed initial bids if any exist on the property
        if (prop.bids && Array.isArray(prop.bids)) {
          prop.bids.forEach(b => {
            auctionBidsData.push({
              bid_id: b.id || `bid-${Date.now()}`,
              auction_id: auctionId,
              property_id: prop.id,
              buyer_id: b.email || 'buyer@example.com',
              bidder_name: b.bidder || 'Sunidhi Joglekar',
              bid_amount: b.amount,
              bid_time: b.timestamp || new Date().toISOString()
            });
          });
        }
      }
    });
  } catch (err) {
    console.error('Error initializing data files:', err);
  }
}

initData();

function saveProperties() {
  try {
    fs.writeFileSync(PROPERTIES_FILE, JSON.stringify(propertiesData, null, 2));
  } catch (err) {
    console.error('Error saving properties:', err);
  }
}

const normalizeId = (value) => String(value ?? '').trim().toLowerCase();

const sameUser = (a, b) => normalizeId(a) !== '' && normalizeId(a) === normalizeId(b);

const assertSellerOwnsAuction = (auction, sellerId) => {
  if (!sellerId) return;
  if (!sameUser(auction.seller_id, sellerId)) {
    throw new Error('Access denied: this auction is owned by another seller.');
  }
};

const findParticipantForBuyer = (auctionId, buyerId) => {
  const normalized = normalizeId(buyerId);
  return auctionParticipantsData.find(
    p =>
      p.auction_id === auctionId &&
      (normalizeId(p.buyer_id) === normalized || normalizeId(p.buyer_email) === normalized)
  );
};

export const db = {
  getProperties: () => propertiesData.filter(p => !p.isSold && p.status !== 'Sold'),
  getAllProperties: () => propertiesData,
  
  getPropertyById: (id) => propertiesData.find(p => String(p.id) === String(id)),
  
  addProperty: (newProp) => {
    propertiesData.unshift(newProp);
    saveProperties();

    if (newProp.auctionEnabled) {
      const now = new Date();
      const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const auctionId = `auc-${newProp.id}`;
      const newAuction = {
        auction_id: auctionId,
        property_id: newProp.id,
        seller_id: newProp.sellerEmail || 'seller@apexrealty.com',
        starting_price: newProp.startingPrice || newProp.price || 100,
        minimum_increment: newProp.minIncrement || 1,
        auction_start: now.toISOString(),
        auction_end: endTime.toISOString(),
        duration_hours: 24,
        max_participants: newProp.maxParticipants || 15,
        status: 'REGISTRATION_OPEN',
        winner_id: null,
        winner_name: null,
        winning_bid: null,
        completed_at: null,
        created_at: now.toISOString()
      };
      auctionsData.unshift(newAuction);
    }
    return newProp;
  },
  
  updateProperty: (id, updatedFields) => {
    const idx = propertiesData.findIndex(p => String(p.id) === String(id));
    if (idx !== -1) {
      propertiesData[idx] = { ...propertiesData[idx], ...updatedFields };
      saveProperties();

      let auction = auctionsData.find(a => String(a.property_id) === String(id));
      if (updatedFields.auctionEnabled) {
        if (!auction) {
          const now = new Date();
          auction = {
            auction_id: `auc-${id}`,
            property_id: id,
            seller_id: propertiesData[idx].sellerEmail || 'seller@apexrealty.com',
            starting_price: updatedFields.startingPrice || propertiesData[idx].price,
            minimum_increment: updatedFields.minIncrement || 1,
            auction_start: now.toISOString(),
            auction_end: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
            duration_hours: 24,
            max_participants: 10,
            status: 'REGISTRATION_OPEN',
            winner_id: null,
            winner_name: null,
            winning_bid: null,
            completed_at: null,
            created_at: now.toISOString()
          };
          auctionsData.unshift(auction);
        } else {
          auction.starting_price = updatedFields.startingPrice || auction.starting_price;
          auction.minimum_increment = updatedFields.minIncrement || auction.minimum_increment;
        }
      } else if (updatedFields.auctionEnabled === false && auction) {
        auction.status = 'CANCELLED';
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
      saveProperties();
      return true;
    }
    return false;
  },

  addBid: (propertyId, bidData) => {
    const prop = propertiesData.find(p => String(p.id) === String(propertyId));
    if (prop) {
      if (!prop.bids) prop.bids = [];
      prop.bids.unshift(bidData);
      saveProperties();
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
      saveProperties();
      return prop;
    }
    return null;
  },

  // --- AUCTION & REGISTRATION APIS ---
  getAuctions: () => {
    return auctionsData.map(auc => {
      const property = propertiesData.find(p => String(p.id) === String(auc.property_id));
      const bids = auctionBidsData.filter(b => b.auction_id === auc.auction_id).sort((a, b) => new Date(b.bid_time) - new Date(a.bid_time));
      const registrations = auctionRegistrationsData.filter(r => r.auction_id === auc.auction_id);
      const participants = auctionParticipantsData.filter(p => p.auction_id === auc.auction_id);
      const highestBid = bids.length > 0 ? Math.max(...bids.map(b => b.bid_amount)) : auc.starting_price;
      const topBidder = bids.length > 0 ? [...bids].sort((a, b) => b.bid_amount - a.bid_amount)[0] : null;
      const saleSummary = propertySalesData.find(s => s.auction_id === auc.auction_id);

      // Distinct bidders summary for seller decision view
      const bidderMap = {};
      bids.forEach(b => {
        if (!bidderMap[b.buyer_id]) {
          const participant = participants.find(p => p.buyer_id === b.buyer_id);
          bidderMap[b.buyer_id] = {
            buyer_id: b.buyer_id,
            bidder_name: b.bidder_name,
            highest_bid: b.bid_amount,
            bid_count: 1,
            email: b.buyer_id,
            phone: participant?.buyer_phone || '+91 98765 00000',
            last_bid_time: b.bid_time
          };
        } else {
          bidderMap[b.buyer_id].bid_count += 1;
          if (b.bid_amount > bidderMap[b.buyer_id].highest_bid) {
            bidderMap[b.buyer_id].highest_bid = b.bid_amount;
          }
        }
      });
      const distinctBidders = Object.values(bidderMap).sort((a, b) => b.highest_bid - a.highest_bid);

      return {
        ...auc,
        property,
        bids,
        registrations,
        participants,
        distinct_bidders: distinctBidders,
        total_participants: participants.length,
        total_bids: bids.length,
        current_highest_bid: highestBid,
        highest_bidder_name: topBidder ? topBidder.bidder_name : null,
        highest_bidder_id: topBidder ? topBidder.buyer_id : null,
        sale_summary: saleSummary || null
      };
    });
  },

  getAuctionById: (auctionId) => {
    let auc = auctionsData.find(a => a.auction_id === auctionId);
    if (!auc) {
      // try matching property_id
      auc = auctionsData.find(a => String(a.property_id) === String(auctionId));
    }
    if (!auc) return null;

    const property = propertiesData.find(p => String(p.id) === String(auc.property_id));
    const bids = auctionBidsData.filter(b => b.auction_id === auc.auction_id).sort((a, b) => new Date(b.bid_time) - new Date(a.bid_time));
    const registrations = auctionRegistrationsData.filter(r => r.auction_id === auc.auction_id);
    const participants = auctionParticipantsData.filter(p => p.auction_id === auc.auction_id);
    const highestBid = bids.length > 0 ? Math.max(...bids.map(b => b.bid_amount)) : auc.starting_price;
    const topBidder = bids.length > 0 ? [...bids].sort((a, b) => b.bid_amount - a.bid_amount)[0] : null;
    const saleSummary = propertySalesData.find(s => s.auction_id === auc.auction_id);

    // Distinct bidders summary for seller decision view
    const bidderMap = {};
    bids.forEach(b => {
      if (!bidderMap[b.buyer_id]) {
        const participant = participants.find(p => p.buyer_id === b.buyer_id);
        bidderMap[b.buyer_id] = {
          buyer_id: b.buyer_id,
          bidder_name: b.bidder_name,
          highest_bid: b.bid_amount,
          bid_count: 1,
          email: b.buyer_id,
          phone: participant?.buyer_phone || '+91 98765 00000',
          last_bid_time: b.bid_time
        };
      } else {
        bidderMap[b.buyer_id].bid_count += 1;
        if (b.bid_amount > bidderMap[b.buyer_id].highest_bid) {
          bidderMap[b.buyer_id].highest_bid = b.bid_amount;
        }
      }
    });
    const distinctBidders = Object.values(bidderMap).sort((a, b) => b.highest_bid - a.highest_bid);

    return {
      ...auc,
      property,
      bids,
      registrations,
      participants,
      distinct_bidders: distinctBidders,
      total_participants: participants.length,
      total_bids: bids.length,
      current_highest_bid: highestBid,
      highest_bidder_name: topBidder ? topBidder.bidder_name : null,
      highest_bidder_id: topBidder ? topBidder.buyer_id : null,
      sale_summary: saleSummary || null
    };
  },

  getAuctionByPropertyId: (propertyId) => {
    let auc = auctionsData.find(a => String(a.property_id) === String(propertyId));
    if (!auc) {
      const prop = propertiesData.find(p => String(p.id) === String(propertyId));
      if (prop) {
        const now = new Date();
        auc = {
          auction_id: `auc-${prop.id}`,
          property_id: prop.id,
          seller_id: prop.sellerEmail || 'seller@apexrealty.com',
          starting_price: prop.startingPrice || prop.price || 100,
          minimum_increment: prop.minIncrement || 1,
          auction_start: now.toISOString(),
          auction_end: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          duration_hours: 24,
          max_participants: 10,
          status: 'REGISTRATION_OPEN',
          winner_id: null,
          winner_name: null,
          winning_bid: null,
          completed_at: null,
          created_at: now.toISOString()
        };
        auctionsData.unshift(auc);
      }
    }
    if (!auc) return null;

    return db.getAuctionById(auc.auction_id);
  },

  createAuction: (params) => {
    const {
      property_id,
      seller_id,
      starting_price,
      minimum_increment,
      duration_hours,
      max_participants,
      auction_start
    } = params;

    const property = propertiesData.find(p => String(p.id) === String(property_id));
    if (!property) throw new Error('Property not found.');
    if (property.isSold || property.status === 'Sold') {
      throw new Error('A sold property cannot be auctioned.');
    }

    const seller = seller_id || property.sellerEmail || 'seller@apexrealty.com';
    if (property.sellerEmail && !sameUser(property.sellerEmail, seller)) {
      throw new Error('Access denied: you can only auction properties owned by your seller account.');
    }

    const startPrice = Number(starting_price);
    const minIncrement = Number(minimum_increment ?? 1);
    const duration = Number(duration_hours ?? 24);
    const maxParticipants = Number(max_participants ?? 10);

    if (!Number.isFinite(startPrice) || startPrice <= 0) {
      throw new Error('Starting price must be greater than 0.');
    }
    if (!Number.isFinite(minIncrement) || minIncrement <= 0) {
      throw new Error('Minimum increment must be greater than 0.');
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error('Auction duration must be greater than 0 hours.');
    }
    if (!Number.isFinite(maxParticipants) || maxParticipants < 1) {
      throw new Error('Maximum participants must be at least 1.');
    }

    const now = new Date();
    const parsedStart = auction_start ? new Date(auction_start) : now;
    const startTime = Number.isNaN(parsedStart.getTime()) ? now : parsedStart;
    const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);

    // Replace an older non-completed auction for the same property.
    const existing = auctionsData.find(a => String(a.property_id) === String(property_id));
    if (existing && !['COMPLETED', 'CLOSED', 'CANCELLED'].includes(existing.status)) {
      throw new Error('This property already has an active auction.');
    }

    const auctionId = `auc-${Date.now()}`;
    const newAuction = {
      auction_id: auctionId,
      property_id,
      seller_id: seller,
      starting_price: startPrice,
      minimum_increment: minIncrement,
      auction_start: startTime.toISOString(),
      auction_end: endTime.toISOString(),
      duration_hours: duration,
      max_participants: Math.floor(maxParticipants),
      status: 'REGISTRATION_OPEN',
      winner_id: null,
      winner_name: null,
      winning_bid: null,
      completed_at: null,
      created_at: now.toISOString()
    };

    auctionsData = auctionsData.filter(a => String(a.property_id) !== String(property_id));
    auctionsData.unshift(newAuction);

    property.auctionEnabled = true;
    property.startingPrice = startPrice;
    property.minIncrement = minIncrement;
    property.auctionEnd = endTime.toISOString();
    property.status = 'Available';
    saveProperties();

    notificationsData.unshift({
      id: `notif-${Date.now()}`,
      user_id: seller,
      title: 'Auction Created & Registration Opened 📝',
      message: `Your property auction is created. Registration is open for buyer token requests.`,
      type: 'REGISTRATION_OPENED',
      timestamp: now.toISOString(),
      read: false,
      auction_id: auctionId
    });

    return newAuction;
  },

  // Token Registration Request from Buyer
  requestRegistration: (auctionId, buyerData) => {
    const { buyer_id, buyer_name, buyer_email, buyer_phone } = buyerData;
    if (!buyer_id) throw new Error('buyer_id is required.');

    const auc = auctionsData.find(a =>
      a.auction_id === auctionId || String(a.property_id) === String(auctionId)
    );
    if (!auc) throw new Error('Auction not found.');

    if (auc.status !== 'REGISTRATION_OPEN') {
      throw new Error('This auction is not open for registration.');
    }

    const participant = findParticipantForBuyer(auc.auction_id, buyer_id);
    if (participant) {
      const existingApproved = auctionRegistrationsData.find(
        r => r.auction_id === auc.auction_id &&
             r.buyer_id === participant.buyer_id &&
             r.status === 'APPROVED'
      );
      if (existingApproved) return existingApproved;
    }

    const existingReg = auctionRegistrationsData.find(
      r => r.auction_id === auc.auction_id &&
           (sameUser(r.buyer_id, buyer_id) || sameUser(r.buyer_email, buyer_email || buyer_id))
    );
    if (existingReg) {
      if (existingReg.status === 'REJECTED') {
        existingReg.status = 'PENDING';
        existingReg.requested_at = new Date().toISOString();
        existingReg.action_at = null;
        return existingReg;
      }
      return existingReg;
    }

    const approvedCount = auctionParticipantsData.filter(
      p => p.auction_id === auc.auction_id
    ).length;
    if (approvedCount >= Number(auc.max_participants || 10)) {
      throw new Error('This auction has reached its maximum number of authorized participants.');
    }

    const reg = {
      id: `reg-${Date.now()}`,
      auction_id: auc.auction_id,
      property_id: auc.property_id,
      buyer_id,
      buyer_name: buyer_name || 'Buyer',
      buyer_email: buyer_email || buyer_id,
      buyer_phone: buyer_phone || '',
      status: 'PENDING',
      requested_at: new Date().toISOString(),
      approved_at: null,
      action_at: null,
      token_id: null
    };

    auctionRegistrationsData.unshift(reg);

    notificationsData.unshift({
      id: `notif-reg-${Date.now()}`,
      user_id: auc.seller_id,
      title: 'New Token Registration Request 🎟️',
      message: `${reg.buyer_name} has requested an Auction Token.`,
      type: 'REGISTRATION_REQUESTED',
      timestamp: new Date().toISOString(),
      read: false,
      auction_id: auc.auction_id
    });

    return reg;
  },

  // Approve / Reject Token Registration by Seller
  updateRegistrationStatus: (registrationId, status, sellerId) => {
    const normalizedStatus = String(status || '').toUpperCase();
    if (!['APPROVED', 'REJECTED'].includes(normalizedStatus)) {
      throw new Error("status must be APPROVED or REJECTED.");
    }

    const reg = auctionRegistrationsData.find(r => r.id === registrationId);
    if (!reg) throw new Error('Registration request not found.');

    const auc = auctionsData.find(a => a.auction_id === reg.auction_id);
    if (!auc) throw new Error('Auction not found.');

    assertSellerOwnsAuction(auc, sellerId);

    if (auc.status !== 'REGISTRATION_OPEN') {
      throw new Error('Registration changes are only allowed while registration is open.');
    }

    if (normalizedStatus === 'APPROVED') {
      if (reg.status === 'APPROVED') return reg;

      const existingParticipant = findParticipantForBuyer(auc.auction_id, reg.buyer_id);
      if (!existingParticipant) {
        const approvedCount = auctionParticipantsData.filter(
          p => p.auction_id === auc.auction_id
        ).length;
        if (approvedCount >= Number(auc.max_participants || 10)) {
          throw new Error('Maximum authorized participant limit reached.');
        }

        const tokenId = `tok-${Date.now()}`;
        auctionTokensData.push({
          token_id: tokenId,
          auction_id: auc.auction_id,
          buyer_id: reg.buyer_id,
          issued_at: new Date().toISOString(),
          status: 'ACTIVE'
        });

        auctionParticipantsData.push({
          participant_id: `part-${Date.now()}`,
          auction_id: auc.auction_id,
          buyer_id: reg.buyer_id,
          buyer_name: reg.buyer_name,
          buyer_email: reg.buyer_email,
          buyer_phone: reg.buyer_phone,
          token_id: tokenId,
          joined_at: new Date().toISOString()
        });

        reg.token_id = tokenId;
      } else {
        reg.token_id = existingParticipant.token_id;
      }

      reg.status = 'APPROVED';
      reg.approved_at = new Date().toISOString();
      reg.action_at = new Date().toISOString();

      notificationsData.unshift({
        id: `notif-app-${Date.now()}`,
        user_id: reg.buyer_id,
        title: 'Registration Approved! 🎟️',
        message: 'You received an Auction Token and are now an authorized auction participant.',
        type: 'REGISTRATION_APPROVED',
        timestamp: new Date().toISOString(),
        read: false,
        auction_id: auc.auction_id
      });
    } else {
      // Rejection never destroys an existing token/participant.
      if (reg.status === 'APPROVED') {
        throw new Error('An already approved registration cannot be rejected.');
      }
      reg.status = 'REJECTED';
      reg.action_at = new Date().toISOString();

      notificationsData.unshift({
        id: `notif-rej-${Date.now()}`,
        user_id: reg.buyer_id,
        title: 'Registration Update',
        message: 'Your registration request for this property auction was declined by the seller.',
        type: 'REGISTRATION_REJECTED',
        timestamp: new Date().toISOString(),
        read: false,
        auction_id: auc.auction_id
      });
    }

    return reg;
  },

  // Seller Auction Controls (Start Registration, Stop Registration, Start Live, Pause, Resume, Freeze, End, Close)
  updateAuctionStatus: (auctionId, newStatus, sellerId) => {
    const allowed = [
      'REGISTRATION_OPEN',
      'REGISTRATION_CLOSED',
      'LIVE',
      'PAUSED',
      'FROZEN',
      'ENDED',
      'CLOSED'
    ];
    const status = String(newStatus || '').toUpperCase();
    if (!allowed.includes(status)) throw new Error('Invalid auction status.');

    const auc = auctionsData.find(a =>
      a.auction_id === auctionId || String(a.property_id) === String(auctionId)
    );
    if (!auc) throw new Error('Auction not found.');
    assertSellerOwnsAuction(auc, sellerId);

    if (['COMPLETED', 'CLOSED', 'CANCELLED'].includes(auc.status)) {
      throw new Error(`Auction is already ${auc.status.toLowerCase()} and cannot be changed.`);
    }

    const transitions = {
      REGISTRATION_OPEN: ['REGISTRATION_CLOSED', 'CLOSED'],
      REGISTRATION_CLOSED: ['LIVE', 'REGISTRATION_OPEN', 'CLOSED'],
      LIVE: ['PAUSED', 'FROZEN', 'ENDED', 'CLOSED'],
      PAUSED: ['LIVE', 'FROZEN', 'ENDED', 'CLOSED'],
      FROZEN: ['LIVE', 'ENDED', 'CLOSED'],
      ENDED: ['CLOSED']
    };

    if (auc.status !== status && !(transitions[auc.status] || []).includes(status)) {
      throw new Error(`Cannot change auction status from ${auc.status} to ${status}.`);
    }

    const oldStatus = auc.status;
    auc.status = status;
    if (status === 'LIVE') {
      const now = new Date();
      auc.auction_start = now.toISOString();
      const remaining = Math.max(
        60 * 60 * 1000,
        new Date(auc.auction_end).getTime() - now.getTime()
      );
      auc.auction_end = new Date(now.getTime() + remaining).toISOString();
    }

    const participants = auctionParticipantsData.filter(p => p.auction_id === auc.auction_id);
    const messages = {
      REGISTRATION_OPEN: ['Registration Opened 📝', 'Registration is now open for buyer token requests.'],
      REGISTRATION_CLOSED: ['Registration Closed 🔒', 'Registration has been closed. No new token requests can be submitted.'],
      LIVE: ['Live Auction Started! ⚡', 'The live auction has started. Authorized token holders may bid now.'],
      PAUSED: ['Auction Paused ⏸️', 'The seller has temporarily paused live bidding.'],
      FROZEN: ['Bidding Frozen 🧊', 'Bidding is frozen while the seller reviews offers.'],
      ENDED: ['Auction Ended 🏁', 'The seller has ended the bidding session.'],
      CLOSED: ['Auction Closed 🔒', 'The seller has closed this auction.']
    };

    const [notifTitle, notifMsg] = messages[status] || [];
    if (notifTitle && status !== oldStatus) {
      participants.forEach((p, idx) => {
        notificationsData.unshift({
          id: `notif-st-${Date.now()}-${idx}`,
          user_id: p.buyer_id,
          title: notifTitle,
          message: notifMsg,
          type: status,
          timestamp: new Date().toISOString(),
          read: false,
          auction_id: auc.auction_id
        });
      });
      notificationsData.unshift({
        id: `notif-seller-st-${Date.now()}`,
        user_id: auc.seller_id,
        title: `Auction Status: ${status}`,
        message: `You changed the auction status from ${oldStatus} to ${status}.`,
        type: 'SELLER_ACTION',
        timestamp: new Date().toISOString(),
        read: false,
        auction_id: auc.auction_id
      });
    }

    return db.getAuctionById(auc.auction_id);
  },

  // Place Bid (Restricted strictly to Token-Holding Authorized Participants)
  placeAuctionBid: (auctionId, buyerId, buyerName, bidAmount) => {
    const auc = auctionsData.find(a =>
      a.auction_id === auctionId || String(a.property_id) === String(auctionId)
    );
    if (!auc) throw new Error('Auction not found.');

    // Prevent bidding after the scheduled end time even if nobody manually ends it.
    if (auc.status === 'LIVE' && auc.auction_end && new Date(auc.auction_end).getTime() <= Date.now()) {
      auc.status = 'ENDED';
    }

    if (auc.status !== 'LIVE') {
      if (auc.status === 'FROZEN') throw new Error('Bidding is frozen by seller. No additional bids can be placed.');
      if (auc.status === 'PAUSED') throw new Error('Auction is currently paused by the seller.');
      if (auc.status === 'REGISTRATION_OPEN' || auc.status === 'REGISTRATION_CLOSED') {
        throw new Error('Live auction has not started yet.');
      }
      if (auc.status === 'ENDED' || auc.status === 'CLOSED') throw new Error('Auction bidding has ended.');
      throw new Error('Auction is not live.');
    }

    const participant = findParticipantForBuyer(auc.auction_id, buyerId);
    if (!participant) {
      throw new Error('Access denied: only authorized Auction Token holders can place bids.');
    }

    const token = auctionTokensData.find(
      t => t.auction_id === auc.auction_id &&
           t.status === 'ACTIVE' &&
           t.token_id === participant.token_id
    );
    if (!token) {
      throw new Error('Access denied: your Auction Token is not active.');
    }

    const amount = Number(bidAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Bid amount must be a valid positive number.');
    }

    const bids = auctionBidsData.filter(b => b.auction_id === auc.auction_id);
    const currentHighest = bids.length
      ? Math.max(...bids.map(b => Number(b.bid_amount)))
      : Number(auc.starting_price);
    const requiredMinimum = bids.length
      ? currentHighest + Number(auc.minimum_increment || 1)
      : Number(auc.starting_price);

    if (amount < requiredMinimum) {
      throw new Error(
        `Bid must be at least ₹${requiredMinimum} Lakhs (current highest/starting price plus minimum increment).`
      );
    }

    const canonicalBuyerId = participant.buyer_id;
    const previousHighestBidder = bids.length
      ? [...bids].sort((a, b) => Number(b.bid_amount) - Number(a.bid_amount))[0]
      : null;

    const newBid = {
      bid_id: `bid-${Date.now()}`,
      auction_id: auc.auction_id,
      property_id: auc.property_id,
      buyer_id: canonicalBuyerId,
      bidder_name: participant.buyer_name || buyerName || 'Authorized Buyer',
      bid_amount: amount,
      bid_time: new Date().toISOString()
    };

    auctionBidsData.unshift(newBid);

    db.addBid(auc.property_id, {
      id: newBid.bid_id,
      bidder: newBid.bidder_name,
      email: participant.buyer_email || canonicalBuyerId,
      amount,
      status: 'ACTIVE',
      timestamp: newBid.bid_time
    });

    if (previousHighestBidder && previousHighestBidder.buyer_id !== canonicalBuyerId) {
      notificationsData.unshift({
        id: `notif-outbid-${Date.now()}`,
        user_id: previousHighestBidder.buyer_id,
        title: 'Outbid Alert! ⚠️',
        message: `You have been outbid. The new highest bid is ₹${amount} Lakhs.`,
        type: 'OUTBID',
        timestamp: new Date().toISOString(),
        read: false,
        auction_id: auc.auction_id
      });
    }

    notificationsData.unshift({
      id: `notif-seller-bid-${Date.now()}`,
      user_id: auc.seller_id,
      title: 'New Bid Placed 🏷️',
      message: `A bid of ₹${amount} Lakhs was placed by ${newBid.bidder_name}.`,
      type: 'BID_PLACED',
      timestamp: new Date().toISOString(),
      read: false,
      auction_id: auc.auction_id
    });

    return newBid;
  },

  // Seller Decision & Final Sale ("Sell Property")
  sellProperty: (auctionId, selectedBuyerId, finalPrice, sellerId) => {
    const auc = auctionsData.find(a =>
      a.auction_id === auctionId || String(a.property_id) === String(auctionId)
    );
    if (!auc) throw new Error('Auction not found.');
    assertSellerOwnsAuction(auc, sellerId);

    if (auc.status === 'COMPLETED') {
      throw new Error('This auction has already been completed.');
    }
    if (auc.status === 'CANCELLED' || auc.status === 'CLOSED') {
      throw new Error('A closed auction cannot be sold.');
    }

    const property = propertiesData.find(p => String(p.id) === String(auc.property_id));
    if (!property) throw new Error('Property not found.');

    const participant = findParticipantForBuyer(auc.auction_id, selectedBuyerId);
    if (!participant) {
      throw new Error('Selected buyer is not an authorized participant in this auction.');
    }

    const bids = auctionBidsData.filter(b => b.auction_id === auc.auction_id);
    const highestBid = bids.length
      ? Math.max(...bids.map(b => Number(b.bid_amount)))
      : Number(auc.starting_price);

    const salePrice = Number(finalPrice || highestBid);
    if (!Number.isFinite(salePrice) || salePrice <= 0) {
      throw new Error('Final selling price must be a valid positive number.');
    }
    if (bids.length && salePrice < highestBid) {
      throw new Error(`Final selling price cannot be below the current highest bid of ₹${highestBid} Lakhs.`);
    }

    const now = new Date().toISOString();
    auc.status = 'COMPLETED';
    auc.winner_id = participant.buyer_id;
    auc.winner_name = participant.buyer_name || selectedBuyerId;
    auc.winning_bid = salePrice;
    auc.completed_at = now;

    property.isSold = true;
    property.status = 'Sold';
    property.auctionEnabled = false;
    property.soldTo = participant.buyer_id;
    property.soldPrice = salePrice;
    property.auctionEnd = now;
    saveProperties();

    // Deactivate every token after the transaction is finalized.
    auctionTokensData
      .filter(t => t.auction_id === auc.auction_id)
      .forEach(t => { t.status = 'USED'; });

    const saleRecord = {
      sale_id: `sale-${Date.now()}`,
      auction_id: auc.auction_id,
      property_id: property.id,
      property_title: property.name || property.title || 'Property',
      property_location: `${property.locality || ''}${property.locality ? ', ' : ''}${property.city || property.location || ''}`,
      property_image: property.image,
      final_selling_price: salePrice,
      buyer_id: participant.buyer_id,
      buyer_name: participant.buyer_name || participant.buyer_id,
      buyer_email: participant.buyer_email || participant.buyer_id,
      seller_id: auc.seller_id,
      seller_name: property.sellerName || property.seller || 'Property Seller',
      seller_email: auc.seller_id,
      auction_duration: `${auc.duration_hours || 24} Hours`,
      total_participants: auctionParticipantsData.filter(p => p.auction_id === auc.auction_id).length,
      total_bids_placed: bids.length,
      total_bids: bids.length,
      sold_at: now
    };

    // Avoid duplicate sale records if this method is retried.
    const existingSaleIndex = propertySalesData.findIndex(s => s.auction_id === auc.auction_id);
    if (existingSaleIndex >= 0) {
      propertySalesData[existingSaleIndex] = saleRecord;
    } else {
      propertySalesData.unshift(saleRecord);
    }

    notificationsData.unshift({
      id: `notif-sold-win-${Date.now()}`,
      user_id: participant.buyer_id,
      title: 'Property Deal Finalized! 🏠🎉',
      message: `Congratulations! The seller selected you to buy ${property.name || 'the property'} for ₹${salePrice} Lakhs.`,
      type: 'PROPERTY_SOLD',
      timestamp: now,
      read: false,
      auction_id: auc.auction_id
    });

    auctionParticipantsData
      .filter(p => p.auction_id === auc.auction_id && !sameUser(p.buyer_id, participant.buyer_id))
      .forEach((p, idx) => {
        notificationsData.unshift({
          id: `notif-sold-loss-${Date.now()}-${idx}`,
          user_id: p.buyer_id,
          title: 'Auction Concluded',
          message: `The property ${property.name || 'property'} has been sold by the seller.`,
          type: 'AUCTION_LOST',
          timestamp: now,
          read: false,
          auction_id: auc.auction_id
        });
      });

    return {
      message: 'Property successfully marked as SOLD!',
      saleRecord,
      auction: db.getAuctionById(auc.auction_id)
    };
  },

  getNotifications: (userId) => {
    if (!userId) return notificationsData;
    return notificationsData.filter(n => n.user_id === userId || n.user_id === 'all');
  },

  markNotificationRead: (notifId) => {
    const notif = notificationsData.find(n => n.id === notifId);
    if (notif) {
      notif.read = true;
    }
    return true;
  },

  markAllNotificationsRead: (userId) => {
    notificationsData.forEach(n => {
      if (!userId || n.user_id === userId || n.user_id === 'all') {
        n.read = true;
      }
    });
    return true;
  },

  getBuyerTokens: (buyerId) => {
    if (!buyerTokensData[buyerId]) {
      buyerTokensData[buyerId] = { available_tokens: 5, used_tokens: 0 };
    }
    return buyerTokensData[buyerId];
  },

  topupBuyerTokens: (buyerId, amount = 5) => {
    const tokens = db.getBuyerTokens(buyerId);
    tokens.available_tokens += amount;
    return tokens;
  },

  getUserRegistrations: (buyerId) => {
    return auctionRegistrationsData.filter(r => r.buyer_id === buyerId || r.buyer_email === buyerId);
  },
  
  getHistoricalData: () => historicalData
};
