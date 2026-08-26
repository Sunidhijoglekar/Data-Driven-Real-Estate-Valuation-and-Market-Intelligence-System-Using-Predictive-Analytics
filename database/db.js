import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to ML datasets
const PROPERTIES_FILE = path.join(__dirname, '../ml/dataset/current_properties.json');
const HISTORICAL_FILE = path.join(__dirname, '../ml/dataset/historical_price_trends.json');

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
    const { property_id, seller_id, starting_price, minimum_increment, duration_hours, max_participants, auction_start } = params;
    const now = new Date();
    const duration = parseFloat(duration_hours || 24);
    const startTime = auction_start ? new Date(auction_start) : now;
    const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);
    
    const auctionId = `auc-${Date.now()}`;
    const newAuction = {
      auction_id: auctionId,
      property_id,
      seller_id: seller_id || 'seller@apexrealty.com',
      starting_price: parseFloat(starting_price),
      minimum_increment: parseFloat(minimum_increment || 1),
      auction_start: startTime.toISOString(),
      auction_end: endTime.toISOString(),
      duration_hours: duration,
      max_participants: max_participants ? parseInt(max_participants) : 10,
      status: 'REGISTRATION_OPEN',
      winner_id: null,
      winner_name: null,
      winning_bid: null,
      completed_at: null,
      created_at: now.toISOString()
    };

    auctionsData = auctionsData.filter(a => String(a.property_id) !== String(property_id));
    auctionsData.unshift(newAuction);

    const prop = propertiesData.find(p => String(p.id) === String(property_id));
    if (prop) {
      prop.auctionEnabled = true;
      prop.startingPrice = parseFloat(starting_price);
      prop.minIncrement = parseFloat(minimum_increment || 1);
      saveProperties();
    }

    // Send Notification to seller
    notificationsData.unshift({
      id: `notif-${Date.now()}`,
      user_id: seller_id || 'seller@apexrealty.com',
      title: 'Auction Created & Registration Opened 📝',
      message: `Your property auction is created. Registration is open for buyer token requests.`,
      type: 'REGISTRATION_OPENED',
      timestamp: new Date().toISOString(),
      read: false,
      auction_id: auctionId
    });

    return newAuction;
  },

  // Token Registration Request from Buyer
  requestRegistration: (auctionId, buyerData) => {
    const { buyer_id, buyer_name, buyer_email, buyer_phone } = buyerData;
    const auc = auctionsData.find(a => a.auction_id === auctionId || String(a.property_id) === String(auctionId));
    if (!auc) throw new Error("Auction not found");

    if (auc.status !== 'REGISTRATION_OPEN') {
      throw new Error("This auction is closed for registration.");
    }

    let existingReg = auctionRegistrationsData.find(r => r.auction_id === auc.auction_id && r.buyer_id === buyer_id);
    if (existingReg) {
      return existingReg;
    }

    const reg = {
      id: `reg-${Date.now()}`,
      auction_id: auc.auction_id,
      property_id: auc.property_id,
      buyer_id,
      buyer_name: buyer_name || 'Buyer',
      buyer_email: buyer_email || buyer_id,
      buyer_phone: buyer_phone || '+91 98765 00000',
      status: 'PENDING',
      requested_at: new Date().toISOString(),
      approved_at: null,
      token_id: null
    };

    auctionRegistrationsData.unshift(reg);

    // Notify Seller
    notificationsData.unshift({
      id: `notif-reg-${Date.now()}`,
      user_id: auc.seller_id,
      title: 'New Token Registration Request 🎟️',
      message: `${buyer_name || buyer_id} has requested an Auction Token to join property auction.`,
      type: 'REGISTRATION_REQUESTED',
      timestamp: new Date().toISOString(),
      read: false,
      auction_id: auc.auction_id
    });

    return reg;
  },

  // Approve / Reject Token Registration by Seller
  updateRegistrationStatus: (registrationId, status, sellerId) => {
    const reg = auctionRegistrationsData.find(r => r.id === registrationId);
    if (!reg) throw new Error("Registration request not found");

    const auc = auctionsData.find(a => a.auction_id === reg.auction_id);
    reg.status = status;
    reg.action_at = new Date().toISOString();

    if (status === 'APPROVED') {
      const tokenId = `tok-${Date.now()}`;
      reg.token_id = tokenId;
      reg.approved_at = new Date().toISOString();

      auctionTokensData.push({
        token_id: tokenId,
        auction_id: reg.auction_id,
        buyer_id: reg.buyer_id,
        issued_at: new Date().toISOString(),
        status: 'ACTIVE'
      });

      let participant = auctionParticipantsData.find(p => p.auction_id === reg.auction_id && p.buyer_id === reg.buyer_id);
      if (!participant) {
        auctionParticipantsData.push({
          participant_id: `part-${Date.now()}`,
          auction_id: reg.auction_id,
          buyer_id: reg.buyer_id,
          buyer_name: reg.buyer_name,
          buyer_email: reg.buyer_email,
          buyer_phone: reg.buyer_phone,
          token_id: tokenId,
          joined_at: new Date().toISOString()
        });
      }

      // Send Notification to Buyer
      notificationsData.unshift({
        id: `notif-app-${Date.now()}`,
        user_id: reg.buyer_id,
        title: 'Registration Approved! 🎟️',
        message: `You received an Auction Token and are now an Authorized Auction Participant!`,
        type: 'REGISTRATION_APPROVED',
        timestamp: new Date().toISOString(),
        read: false,
        auction_id: reg.auction_id
      });
    } else if (status === 'REJECTED') {
      notificationsData.unshift({
        id: `notif-rej-${Date.now()}`,
        user_id: reg.buyer_id,
        title: 'Registration Update',
        message: `Your registration request for property auction was declined by the seller.`,
        type: 'REGISTRATION_REJECTED',
        timestamp: new Date().toISOString(),
        read: false,
        auction_id: reg.auction_id
      });
    }

    return reg;
  },

  // Seller Auction Controls (Start Registration, Stop Registration, Start Live, Pause, Resume, Freeze, End, Close)
  updateAuctionStatus: (auctionId, newStatus, sellerId) => {
    const auc = auctionsData.find(a => a.auction_id === auctionId || String(a.property_id) === String(auctionId));
    if (!auc) throw new Error("Auction not found");

    const oldStatus = auc.status;
    auc.status = newStatus;

    const participants = auctionParticipantsData.filter(p => p.auction_id === auc.auction_id);

    // Trigger Notification depending on control action
    let notifTitle = '';
    let notifMsg = '';
    let notifType = newStatus;

    if (newStatus === 'REGISTRATION_OPEN') {
      notifTitle = 'Registration Opened 📝';
      notifMsg = 'Registration is now open for buyers to request Auction Tokens.';
    } else if (newStatus === 'REGISTRATION_CLOSED') {
      notifTitle = 'Registration Closed 🔒';
      notifMsg = 'Registration has been closed by the seller. No additional Auction Tokens will be issued.';
    } else if (newStatus === 'LIVE') {
      notifTitle = 'Live Auction Started! ⚡';
      notifMsg = 'The live property auction has officially started. You may now place your bids in real time!';
      auc.auction_start = new Date().toISOString();
    } else if (newStatus === 'PAUSED') {
      notifTitle = 'Auction Paused ⏸️';
      notifMsg = 'The seller has temporarily paused live bidding.';
    } else if (newStatus === 'FROZEN') {
      notifTitle = 'Bidding Frozen 🧊';
      notifMsg = 'Bidding is now frozen. No further bids can be placed while the seller reviews offers.';
    } else if (newStatus === 'ENDED' || newStatus === 'CLOSED') {
      notifTitle = 'Auction Ended 🏁';
      notifMsg = 'The auction bidding session has ended.';
    }

    if (notifTitle) {
      participants.forEach((p, idx) => {
        notificationsData.unshift({
          id: `notif-st-${Date.now()}-${idx}`,
          user_id: p.buyer_id,
          title: notifTitle,
          message: notifMsg,
          type: notifType,
          timestamp: new Date().toISOString(),
          read: false,
          auction_id: auc.auction_id
        });
      });

      notificationsData.unshift({
        id: `notif-seller-st-${Date.now()}`,
        user_id: auc.seller_id,
        title: `Auction Status: ${newStatus}`,
        message: `You updated auction status from ${oldStatus} to ${newStatus}.`,
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
    const auc = auctionsData.find(a => a.auction_id === auctionId || String(a.property_id) === String(auctionId));
    if (!auc) throw new Error("Auction not found");

    if (auc.status !== 'LIVE') {
      if (auc.status === 'FROZEN') {
        throw new Error("Bidding is frozen by seller. No additional bids can be placed.");
      } else if (auc.status === 'PAUSED') {
        throw new Error("Auction is currently paused by the seller.");
      } else if (auc.status === 'REGISTRATION_OPEN' || auc.status === 'REGISTRATION_CLOSED') {
        throw new Error("Live auction has not started yet.");
      } else {
        throw new Error("Auction is not live.");
      }
    }

    // CHECK AUTHORIZED TOKEN PARTICIPANT
    const isAuthorized = auctionParticipantsData.some(p => p.auction_id === auc.auction_id && p.buyer_id === buyerId);
    const hasToken = auctionTokensData.some(t => t.auction_id === auc.auction_id && t.buyer_id === buyerId && t.status === 'ACTIVE');

    if (!isAuthorized && !hasToken) {
      throw new Error("Access Denied: Only Authorized Auction Participants with an Auction Token can place bids.");
    }

    const bids = auctionBidsData.filter(b => b.auction_id === auc.auction_id);
    const amount = parseFloat(bidAmount);
    const minInc = auc.minimum_increment || 1;

    if (bids.length === 0) {
      if (amount < auc.starting_price) {
        throw new Error(`Bid amount must be at least the starting price of ₹${auc.starting_price} Lakhs.`);
      }
    } else {
      const currentHighest = Math.max(...bids.map(b => b.bid_amount));
      if (amount < currentHighest + minInc) {
        throw new Error(`Bid must be at least ₹${currentHighest + minInc} Lakhs (Current highest: ₹${currentHighest} Lakhs + Min increment: ₹${minInc} Lakhs).`);
      }
    }

    const previousHighestBidder = bids.length > 0 ? [...bids].sort((a, b) => b.bid_amount - a.bid_amount)[0] : null;

    const newBid = {
      bid_id: `bid-${Date.now()}`,
      auction_id: auc.auction_id,
      property_id: auc.property_id,
      buyer_id: buyerId,
      bidder_name: buyerName || 'Authorized Investor',
      bid_amount: amount,
      bid_time: new Date().toISOString()
    };
    auctionBidsData.unshift(newBid);

    db.addBid(auc.property_id, {
      id: newBid.bid_id,
      bidder: buyerName || 'Authorized Investor',
      email: buyerId,
      amount: amount,
      status: 'ACTIVE',
      timestamp: newBid.bid_time
    });

    if (previousHighestBidder && previousHighestBidder.buyer_id !== buyerId) {
      notificationsData.unshift({
        id: `notif-outbid-${Date.now()}`,
        user_id: previousHighestBidder.buyer_id,
        title: 'Outbid Alert! ⚠️',
        message: `You have been outbid! New highest bid is ₹${amount} Lakhs by ${buyerName || 'a competing investor'}.`,
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
      message: `A bid of ₹${amount} Lakhs was placed by ${buyerName || buyerId}.`,
      type: 'BID_PLACED',
      timestamp: new Date().toISOString(),
      read: false,
      auction_id: auc.auction_id
    });

    return newBid;
  },

  // Seller Decision & Final Sale ("Sell Property")
  sellProperty: (auctionId, selectedBuyerId, finalPrice, sellerId) => {
    const auc = auctionsData.find(a => a.auction_id === auctionId || String(a.property_id) === String(auctionId));
    if (!auc) throw new Error("Auction not found");

    const property = propertiesData.find(p => String(p.id) === String(auc.property_id));
    if (!property) throw new Error("Property not found");

    const bids = auctionBidsData.filter(b => b.auction_id === auc.auction_id);
    const participants = auctionParticipantsData.filter(p => p.auction_id === auc.auction_id);
    const selectedParticipant = participants.find(p => p.buyer_id === selectedBuyerId) || { buyer_name: selectedBuyerId, buyer_email: selectedBuyerId };
    
    const salePrice = parseFloat(finalPrice || (bids.length > 0 ? Math.max(...bids.map(b => b.bid_amount)) : auc.starting_price));

    auc.status = 'COMPLETED';
    auc.winner_id = selectedBuyerId;
    auc.winner_name = selectedParticipant.buyer_name || selectedBuyerId;
    auc.winning_bid = salePrice;
    auc.completed_at = new Date().toISOString();

    // Mark Property as SOLD and remove from active listings
    property.isSold = true;
    property.status = 'Sold';
    property.auctionEnabled = false;
    property.soldTo = selectedBuyerId;
    property.soldPrice = salePrice;
    saveProperties();

    // Create Property Sales Record
    const saleRecord = {
      sale_id: `sale-${Date.now()}`,
      auction_id: auc.auction_id,
      property_id: property.id,
      property_title: property.title,
      property_location: property.location,
      property_image: property.image,
      final_selling_price: salePrice,
      buyer_id: selectedBuyerId,
      buyer_name: selectedParticipant.buyer_name || selectedBuyerId,
      buyer_email: selectedParticipant.buyer_email || selectedBuyerId,
      seller_id: auc.seller_id || property.sellerEmail || 'seller@apexrealty.com',
      seller_name: property.sellerName || 'Apex Premium Properties',
      auction_duration: `${auc.duration_hours || 24} Hours`,
      total_participants: participants.length,
      total_bids: bids.length,
      sold_at: new Date().toISOString()
    };

    propertySalesData.unshift(saleRecord);

    // Notify Buyer
    notificationsData.unshift({
      id: `notif-sold-win-${Date.now()}`,
      user_id: selectedBuyerId,
      title: 'Property Deal Finalized! 🏠🎉',
      message: `Congratulations! The seller has chosen you to buy ${property.title} for ₹${salePrice} Lakhs!`,
      type: 'PROPERTY_SOLD',
      timestamp: new Date().toISOString(),
      read: false,
      auction_id: auc.auction_id
    });

    // Notify other participants
    participants.filter(p => p.buyer_id !== selectedBuyerId).forEach((p, idx) => {
      notificationsData.unshift({
        id: `notif-sold-loss-${Date.now()}-${idx}`,
        user_id: p.buyer_id,
        title: 'Auction Concluded',
        message: `The property ${property.title} has been sold by the seller.`,
        type: 'AUCTION_LOST',
        timestamp: new Date().toISOString(),
        read: false,
        auction_id: auc.auction_id
      });
    });

    return { message: "Property successfully marked as SOLD!", saleRecord, auction: db.getAuctionById(auc.auction_id) };
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
