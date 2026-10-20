import express from 'express';
import {
  getAuctions,
  getAuctionById,
  getAuctionByProperty,
  createAuction,
  requestRegistration,
  updateRegistrationStatus,
  updateAuctionStatus,
  placeAuctionBid,
  sellProperty,
  getUserRegistrations,
  getBuyerTokens,
  topupBuyerTokens,
  getWinnerAiReport,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '../controllers/bidController.js';

import { authenticate, requireRole } from '../middleware/authMiddleware.js';
const router = express.Router();
router.use(authenticate);
// All identity aliases are checked; none may override the verified session.
router.use((req, res, next) => {
  const keys = ['sellerId', 'seller_id', 'buyerId', 'buyer_id', 'bidderEmail', 'bidder_email', 'email', 'buyerEmail', 'buyer_email'];
  // The selected buyer on a sale is a target, rather than the acting identity.
  for (const key of keys) {
    if (req.path.endsWith('/sell') && !key.startsWith('seller')) continue;
    if (req.body[key] !== undefined && req.body[key] !== req.user.email) return res.status(403).json({ error: 'Identity does not match signed-in user' });
  }
  if (req.params.buyerId && req.params.buyerId !== req.user.email) return res.status(403).json({ error: 'Access denied' });
  next();
});

router.get('/auctions', getAuctions);
router.get('/auctions/detail/:auctionId', getAuctionById);
router.get('/auctions/property/:propertyId', getAuctionByProperty);
router.post('/auctions/create', requireRole('Seller'), createAuction);

// Token Registration endpoints
router.post('/auctions/:auctionId/register', requireRole('Buyer'), requestRegistration);
router.put('/registrations/:registrationId/status', requireRole('Seller'), updateRegistrationStatus);
router.post('/registrations/:registrationId/status', requireRole('Seller'), updateRegistrationStatus);
router.get('/registrations/user/:buyerId', getUserRegistrations);

// Seller Auction Control endpoints
router.put('/auctions/:auctionId/status', requireRole('Seller'), updateAuctionStatus);
router.post('/auctions/:auctionId/status', requireRole('Seller'), updateAuctionStatus);
router.post('/auctions/:auctionId/sell', requireRole('Seller'), sellProperty);

// Bidding
router.post('/auctions/:auctionId/bid', requireRole('Buyer'), placeAuctionBid);
router.post('/auctions/property/:propertyId/bid', requireRole('Buyer'), placeAuctionBid);
router.post('/property/:propertyId/bid', requireRole('Buyer'), placeAuctionBid);

// Tokens
router.get('/tokens/:buyerId', getBuyerTokens);
router.post('/tokens/:buyerId/topup', topupBuyerTokens);

// AI & Notifications
router.get('/auctions/:auctionId/winner-ai', getWinnerAiReport);
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);
router.post('/notifications/read-all', markAllNotificationsRead);

// Backward compatibility legacy routes
router.post('/auctions/:auctionId/join', requireRole('Buyer'), requestRegistration);
router.put('/auctions/:auctionId/end', requireRole('Seller'), (req, res) => {
  req.body.status = 'FROZEN';
  return updateAuctionStatus(req, res);
});
router.put('/auctions/:auctionId/cancel', requireRole('Seller'), (req, res) => {
  req.body.status = 'CLOSED';
  return updateAuctionStatus(req, res);
});

export default router;
