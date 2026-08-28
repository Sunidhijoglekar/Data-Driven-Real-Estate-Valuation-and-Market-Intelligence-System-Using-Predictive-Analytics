/**
 * Bid & Auction Controller - Seller-Controlled Invitation & Token-Based Auction System
 */
import { db } from '../database/db.js';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getAuctions = (req, res) => {
  try {
    const auctions = db.getAuctions();
    res.json({ auctions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAuctionById = (req, res) => {
  try {
    const { auctionId } = req.params;
    const auction = db.getAuctionById(auctionId);
    if (!auction) {
      return res.status(404).json({ error: "Auction not found" });
    }
    res.json({ auction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAuctionByProperty = (req, res) => {
  try {
    const { propertyId } = req.params;
    const auction = db.getAuctionByPropertyId(propertyId);
    if (!auction) {
      return res.status(404).json({ error: "Auction not found for this property" });
    }
    res.json({ auction });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
      max_participants, maxParticipants,
      auction_start, auctionStart
    } = req.body;

    const finalPropertyId = property_id || propertyId;
    const finalSellerId = seller_id || sellerId || 'seller@apexrealty.com';
    const finalStartingPrice = starting_price || startingPrice;
    const finalMinIncrement = minimum_increment || minIncrement || minimumIncrement || 1;
    const finalDurationHours = duration_hours || durationHours || 24;
    const finalMaxParticipants = max_participants || maxParticipants || 10;
    const finalAuctionStart = auction_start || auctionStart;

    if (!finalPropertyId || !finalStartingPrice) {
      return res.status(400).json({ error: "property_id and starting_price are required" });
    }

    const newAuction = db.createAuction({
      property_id: String(finalPropertyId),
      seller_id: finalSellerId,
      starting_price: parseFloat(finalStartingPrice),
      minimum_increment: parseFloat(finalMinIncrement),
      duration_hours: parseFloat(finalDurationHours),
      max_participants: parseInt(finalMaxParticipants, 10),
      auction_start: finalAuctionStart
    });
    res.status(201).json({ message: "Auction created and registration opened!", auction: newAuction });
  } catch (error) {
    res.status(500).json({ error: error.message });
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

    const finalBuyerId = buyer_id || buyerId;
    const finalBuyerName = buyer_name || buyerName || 'Buyer';
    const finalBuyerEmail = buyer_email || buyerEmail || finalBuyerId;
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

    const reg = db.updateRegistrationStatus(registrationId, status, sellerId || seller_id);
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

    const updatedAuction = db.updateAuctionStatus(auctionId, status, sellerId || seller_id);
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

    const finalBuyerId = buyerId || buyer_id || bidderEmail || bidder_email || email || 'buyer@apexrealty.com';
    const finalBuyerName = buyerName || buyer_name || bidderName || bidder_name || name || 'Authorized Investor';
    const rawBidAmount = bidAmount !== undefined ? bidAmount : (bid_amount !== undefined ? bid_amount : amount);

    if (!targetId || rawBidAmount === undefined || rawBidAmount === null || isNaN(parseFloat(rawBidAmount))) {
      return res.status(400).json({ error: "A valid bid amount is required" });
    }

    const finalBidAmount = parseFloat(rawBidAmount);
    const newBid = db.placeAuctionBid(targetId, finalBuyerId, finalBuyerName, finalBidAmount);
    const updatedAuction = db.getAuctionById(targetId) || db.getAuctionByPropertyId(newBid.property_id || targetId);

    res.status(201).json({
      message: "Bid placed successfully!",
      bid: newBid,
      auction: updatedAuction,
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
    const finalSellerId = sellerId || seller_id;

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
    const registrations = db.getUserRegistrations(buyerId);
    res.json({ buyerId, registrations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getBuyerTokens = (req, res) => {
  try {
    const { buyerId } = req.params;
    const tokens = db.getBuyerTokens(buyerId);
    res.json({ buyerId, tokens });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const topupBuyerTokens = (req, res) => {
  try {
    const { buyerId } = req.params;
    const { amount } = req.body;
    const tokens = db.topupBuyerTokens(buyerId, amount ? parseInt(amount) : 5);
    res.json({ message: "Tokens topped up successfully!", tokens });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getNotifications = (req, res) => {
  try {
    const { userId } = req.query;
    const notifications = db.getNotifications(userId);
    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markNotificationRead = (req, res) => {
  try {
    const { id } = req.params;
    db.markNotificationRead(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markAllNotificationsRead = (req, res) => {
  try {
    const { userId } = req.body;
    db.markAllNotificationsRead(userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    res.json({ report: response.text });
  } catch (error) {
    res.status(500).json({ error: error.message, report: "Property transaction finalized under seller agreement." });
  }
};
