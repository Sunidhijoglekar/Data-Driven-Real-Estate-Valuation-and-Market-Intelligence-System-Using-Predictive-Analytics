/**
 * Bid & Auction Controller
 * Seller-controlled registration -> token approval -> live bidding -> final sale flow.
 */
import { db } from '../database/db.js';
import { GoogleGenAI } from '@google/genai';

let aiClient = null;

function getGeminiClient() {
  if (
    !aiClient &&
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE'
  ) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

const positiveNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
};

export const getAuctions = (req, res) => {
  try {
    res.json({ auctions: db.getAuctions() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAuctionById = (req, res) => {
  try {
    const auction = db.getAuctionById(req.params.auctionId);
    if (!auction) return res.status(404).json({ error: 'Auction not found' });
    res.json({ auction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAuctionByProperty = (req, res) => {
  try {
    const auction = db.getAuctionByPropertyId(req.params.propertyId);
    if (!auction) {
      return res.status(404).json({ error: 'Auction not found for this property' });
    }
    res.json({ auction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createAuction = (req, res) => {
  try {
    const {
      property_id,
      seller_id,
      starting_price,
      minimum_increment,
      duration_hours,
      max_participants,
      auction_start
    } = req.body;

    if (!property_id || !positiveNumber(starting_price)) {
      return res.status(400).json({
        error: 'property_id and a valid starting_price are required.'
      });
    }

    const auction = db.createAuction({
      property_id,
      seller_id,
      starting_price,
      minimum_increment: minimum_increment ?? 1,
      duration_hours: duration_hours ?? 24,
      max_participants: max_participants ?? 10,
      auction_start
    });

    res.status(201).json({
      message: 'Auction created and registration opened.',
      auction
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const requestRegistration = (req, res) => {
  try {
    const { buyer_id, buyer_name, buyer_email, buyer_phone } = req.body;

    if (!buyer_id) {
      return res.status(400).json({ error: 'buyer_id is required.' });
    }

    const registration = db.requestRegistration(req.params.auctionId, {
      buyer_id,
      buyer_name,
      buyer_email,
      buyer_phone
    });

    res.status(201).json({
      message: registration.status === 'PENDING'
        ? 'Registration request submitted to seller.'
        : 'Registration already exists.',
      registration
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateRegistrationStatus = (req, res) => {
  try {
    const { status, sellerId } = req.body;

    if (!sellerId) {
      return res.status(400).json({ error: 'sellerId is required.' });
    }

    const registration = db.updateRegistrationStatus(
      req.params.registrationId,
      status,
      sellerId
    );

    res.json({
      message: `Registration request ${String(status).toLowerCase()} successfully.`,
      registration
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getUserRegistrations = (req, res) => {
  try {
    const buyerId = decodeURIComponent(req.params.buyerId);
    res.json({
      buyerId,
      registrations: db.getUserRegistrations(buyerId)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAuctionStatus = (req, res) => {
  try {
    const { status, sellerId } = req.body;

    if (!sellerId) {
      return res.status(400).json({ error: 'sellerId is required.' });
    }
    if (!status) {
      return res.status(400).json({ error: 'status is required.' });
    }

    const auction = db.updateAuctionStatus(
      req.params.auctionId,
      status,
      sellerId
    );

    res.json({
      message: `Auction status updated to ${auction.status}.`,
      auction
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const placeAuctionBid = (req, res) => {
  try {
    const { buyerId, buyerName, bidAmount } = req.body;

    if (!buyerId || !positiveNumber(bidAmount)) {
      return res.status(400).json({
        error: 'buyerId and a valid positive bidAmount are required.'
      });
    }

    const bid = db.placeAuctionBid(
      req.params.auctionId,
      buyerId,
      buyerName,
      Number(bidAmount)
    );

    const auction = db.getAuctionById(req.params.auctionId);

    res.status(201).json({
      message: 'Bid placed successfully.',
      bid,
      auction
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const sellProperty = (req, res) => {
  try {
    const { buyerId, finalPrice, sellerId } = req.body;

    if (!sellerId) {
      return res.status(400).json({ error: 'sellerId is required.' });
    }
    if (!buyerId) {
      return res.status(400).json({ error: 'buyerId is required.' });
    }
    if (finalPrice !== undefined && finalPrice !== null && !positiveNumber(finalPrice)) {
      return res.status(400).json({ error: 'finalPrice must be a positive number.' });
    }

    const result = db.sellProperty(
      req.params.auctionId,
      buyerId,
      finalPrice,
      sellerId
    );

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getBuyerTokens = (req, res) => {
  try {
    const buyerId = decodeURIComponent(req.params.buyerId);
    res.json({
      buyerId,
      tokens: db.getBuyerTokens(buyerId)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const topupBuyerTokens = (req, res) => {
  try {
    const buyerId = decodeURIComponent(req.params.buyerId);
    const amount = Number(req.body?.amount ?? 5);

    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Token top-up amount must be a positive integer.' });
    }

    res.json({
      message: 'Tokens topped up successfully.',
      tokens: db.topupBuyerTokens(buyerId, amount)
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getNotifications = (req, res) => {
  try {
    res.json({ notifications: db.getNotifications(req.query.userId) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markNotificationRead = (req, res) => {
  try {
    db.markNotificationRead(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const markAllNotificationsRead = (req, res) => {
  try {
    db.markAllNotificationsRead(req.body?.userId);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getWinnerAiReport = async (req, res) => {
  try {
    const auction = db.getAuctionById(req.params.auctionId);
    if (!auction) return res.status(404).json({ error: 'Auction not found' });

    const property = auction.property || {};
    const prompt = `Analyze this real estate auction result and provide exactly 3 concise bullet points.
Property: ${property.name || property.title || 'Property'}
Location: ${property.locality || property.location || property.city || 'N/A'}
Starting Price: ₹${auction.starting_price} Lakhs
Final Price: ₹${auction.winning_bid || auction.current_highest_bid || auction.starting_price} Lakhs
Total Bids: ${auction.total_bids}
Authorized Participants: ${auction.total_participants}
Winner: ${auction.winner_name || 'Not selected'}

Focus on market value, bidding intensity, and seller decision.`;

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini AI is not configured.',
        report: 'AI winner reporting is unavailable. Add GEMINI_API_KEY to enable it.'
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    res.json({ report: response.text });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      report: 'Property transaction finalized under seller agreement.'
    });
  }
};
