/**
 * Bid & Auction Controller - Seller-Controlled Invitation & Token-Based Auction System
 */
import { db } from '../database/db.js';
import { GoogleGenAI } from '@google/genai';



export const getAuctions = (req, res) => {
  try {
    let auctions = db.getAuctions();
    if (req.user.role === 'Seller') auctions = auctions.filter(a => db.canManageAuction(a, req.user.email));
    if (req.query?.view === 'live' || (req.user.role !== 'Seller' && req.query?.view !== 'history')) auctions = auctions.filter(a => a.is_visible_live);
    if (req.user.role !== 'Seller' && req.query?.view === 'history') auctions = auctions.filter(a =>
      a.registrations.some(r => r.buyer_id === req.user.email) || a.participants.some(p => p.buyer_id === req.user.email) || a.winner_id === req.user.email);
    res.json({ auctions: auctions.map(a => visibleAuction(a, req.user)) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getAuctionById = (req, res) => {
  try {
    const { auctionId } = req.params;
    const auction = db.getAuctionById(auctionId);
    if (!auction) {
      return res.status(404).json({ error: "Auction not found" });
    }
    res.json({ auction: visibleAuction(auction, req.user) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getAuctionByProperty = (req, res) => {
  try {
    const { propertyId } = req.params;
    const auction = db.getAuctionByPropertyId(propertyId);
    if (!auction) {
      return res.status(404).json({ error: "Auction not found for this property" });
    }
    res.json({ auction: visibleAuction(auction, req.user) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const createAuction = (req, res) => {
  try {
    const {
      property_id, propertyId,
      seller_id, sellerId,
      starting_price, startingPrice,
      minimum_increment, minIncrement, minimumIncrement,
      duration_hours, durationHours,
      max_participants, maxParticipants
    } = req.body;

    const finalPropertyId = property_id || propertyId;
    const finalSellerId = req.user.email;
    const finalStartingPrice = starting_price ?? startingPrice;
    const finalMinIncrement = minimum_increment ?? minIncrement ?? minimumIncrement ?? 1;
    const finalDurationHours = duration_hours ?? durationHours ?? 24;
    const finalMaxParticipants = max_participants ?? maxParticipants ?? 10;

    if (!finalPropertyId || !finalStartingPrice) {
      return res.status(400).json({ error: "property_id and starting_price are required" });
    }

    const newAuction = db.createAuction({
      property_id: String(finalPropertyId),
      seller_id: finalSellerId,
      starting_price: finalStartingPrice,
      minimum_increment: finalMinIncrement,
      duration_hours: finalDurationHours,
      max_participants: finalMaxParticipants
    });
    res.status(201).json({ message: "Live auction launched successfully!", auction: newAuction });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const requestRegistration = (req, res) => {
  try {
    const { auctionId } = req.params;
    const {
      buyer_id, buyerId,
      buyer_name, buyerName,
      buyer_email, buyerEmail,
      buyer_phone, buyerPhone
    } = req.body;

    const finalBuyerId = req.user.email;
    const finalBuyerName = req.user.name;
    const finalBuyerEmail = req.user.email;
    const finalBuyerPhone = buyer_phone || buyerPhone || '+91 98765 00000';

    if (!finalBuyerId) {
      return res.status(400).json({ error: "buyer_id is required" });
    }

    const reg = db.requestRegistration(auctionId, {
      buyer_id: finalBuyerId,
      buyer_name: finalBuyerName,
      buyer_email: finalBuyerEmail,
      buyer_phone: finalBuyerPhone
    });
    res.json({ message: "Registration request submitted to seller!", registration: reg });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateRegistrationStatus = (req, res) => {
  try {
    const { registrationId } = req.params;
    const { status, sellerId, seller_id } = req.body; // 'APPROVED' or 'REJECTED'

    if (!status) {
      return res.status(400).json({ error: "status is required ('APPROVED' or 'REJECTED')" });
    }

    const reg = db.updateRegistrationStatus(registrationId, status, req.user.email);
    res.json({ message: `Registration request ${status.toLowerCase()}!`, registration: reg });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateAuctionStatus = (req, res) => {
  try {
    const { auctionId } = req.params;
    const { status, sellerId, seller_id } = req.body; // REGISTRATION_OPEN, REGISTRATION_CLOSED, LIVE, PAUSED, FROZEN, ENDED, CLOSED

    if (!status) {
      return res.status(400).json({ error: "status is required" });
    }

    const updatedAuction = db.updateAuctionStatus(auctionId, status, req.user.email);
    res.json({ message: `Auction status updated to ${status}`, auction: updatedAuction });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const placeAuctionBid = (req, res) => {
  try {
    const targetId = req.params.auctionId || req.params.propertyId || req.params.id;
    const {
      buyerId, buyer_id, bidderEmail, bidder_email, email,
      buyerName, buyer_name, bidderName, bidder_name, name,
      bidAmount, bid_amount, amount
    } = req.body;

    const finalBuyerId = req.user.email;
    const finalBuyerName = req.user.name;
    const rawBidAmount = bidAmount !== undefined ? bidAmount : (bid_amount !== undefined ? bid_amount : amount);

    if (!targetId || rawBidAmount === undefined || rawBidAmount === null || !Number.isFinite(Number(rawBidAmount))) {
      return res.status(400).json({ error: "A valid bid amount is required" });
    }

    const finalBidAmount = rawBidAmount;
    const newBid = db.placeAuctionBid(targetId, finalBuyerId, finalBuyerName, finalBidAmount);
    const updatedAuction = db.getAuctionById(targetId) || db.getAuctionByPropertyId(newBid.property_id || targetId);

    res.status(201).json({
      message: "Bid placed successfully!",
      bid: newBid,
      auction: visibleAuction(updatedAuction, req.user),
      property: updatedAuction?.property || db.getPropertyById(newBid.property_id || targetId)
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const sellProperty = (req, res) => {
  try {
    const { auctionId } = req.params;
    const {
      buyerId, buyer_id, selectedBuyerId, selected_buyer_id,
      finalPrice, final_price,
      sellerId, seller_id
    } = req.body;

    const finalBuyerId = buyerId || buyer_id || selectedBuyerId || selected_buyer_id;
    const finalSellingPrice = finalPrice !== undefined ? finalPrice : final_price;
    const finalSellerId = req.user.email;

    if (!finalBuyerId) {
      return res.status(400).json({ error: "buyerId is required to complete property sale" });
    }

    const result = db.sellProperty(auctionId, finalBuyerId, finalSellingPrice, finalSellerId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getUserRegistrations = (req, res) => {
  try {
    const { buyerId } = req.params;
    if (buyerId !== req.user.email) return res.status(403).json({ error: 'Access denied' });
    const registrations = db.getUserRegistrations(buyerId);
    res.json({ buyerId, registrations });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getBuyerTokens = (req, res) => {
  try {
    const { buyerId } = req.params;
    if (buyerId !== req.user.email) return res.status(403).json({ error: 'Access denied' });
    const tokens = db.getBuyerTokens(buyerId);
    res.json({ buyerId, tokens });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const topupBuyerTokens = (req, res) => {
  try {
    const { buyerId } = req.params;
    if (buyerId !== req.user.email) return res.status(403).json({ error: 'Access denied' });
    const { amount } = req.body;
    const tokens = db.topupBuyerTokens(buyerId, amount ?? 5);
    res.json({ message: "Tokens topped up successfully!", tokens });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getNotifications = (req, res) => {
  try {
    const { userId } = req.query;
    const notifications = db.getNotifications(req.user.email, req.user.role);
    res.json({ notifications });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const markNotificationRead = (req, res) => {
  try {
    const { id } = req.params;
    db.markNotificationRead(id, req.user.email, req.user.role);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const markAllNotificationsRead = (req, res) => {
  try {
    const { userId } = req.body;
    db.markAllNotificationsRead(req.user.email, req.user.role);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getWinnerAiReport = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const auction = db.getAuctionById(auctionId);
    if (!auction) {
      return res.status(404).json({ error: "Auction not found" });
    }

    const prompt = `Analyze this real estate property auction result and summarize key points:
Property: ${auction.property?.title} in ${auction.property?.location}
Starting Price: ₹${auction.starting_price} Lakhs
Winning / Final Selling Price: ₹${auction.winning_bid || auction.current_highest_bid} Lakhs
Total Bids: ${auction.total_bids}
Total Authorized Participants: ${auction.total_participants}
Winner: ${auction.winner_name || 'Selected Buyer'}

Provide a 3-bullet executive summary focusing on market valuation, competitive bidding intensity, and seller decision highlights. Keep concise.`;

    if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'AI reports are not configured' });
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    res.json({ report: response.text });
  } catch (error) {
    res.status(500).json({ error: error.message, report: "Property transaction finalized under seller agreement." });
  }
};

function visibleAuction(auction, user) {
  if (!auction) return auction;
  if (user.role === 'Seller' && db.canManageAuction(auction, user.email)) return { ...auction, can_manage_auction: true, can_sell: auction.seller_id === user.email, management_access: auction.seller_id === user.email ? 'OWNER' : 'AUCTION_MANAGER' };
  return { ...auction,
    registrations: auction.registrations.filter(r => r.buyer_id === user.email),
    participants: auction.participants.filter(p => p.buyer_id === user.email),
    distinct_bidders: [],
    bids: auction.bids.map(({ buyer_id, ...bid }) => ({ ...bid, ...(buyer_id === user.email ? { buyer_id } : {}) }))
  };
}
