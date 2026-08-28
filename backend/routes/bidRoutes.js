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

const router = express.Router();

router.get('/auctions', getAuctions);
router.get('/auctions/detail/:auctionId', getAuctionById);
router.get('/auctions/property/:propertyId', getAuctionByProperty);
router.post('/auctions/create', createAuction);

// Token Registration endpoints
router.post('/auctions/:auctionId/register', requestRegistration);
router.put('/registrations/:registrationId/status', updateRegistrationStatus);
router.post('/registrations/:registrationId/status', updateRegistrationStatus);
router.get('/registrations/user/:buyerId', getUserRegistrations);

// Seller Auction Control endpoints
router.put('/auctions/:auctionId/status', updateAuctionStatus);
router.post('/auctions/:auctionId/status', updateAuctionStatus);
router.post('/auctions/:auctionId/sell', sellProperty);

// Bidding
router.post('/auctions/:auctionId/bid', placeAuctionBid);
router.post('/auctions/property/:propertyId/bid', placeAuctionBid);
router.post('/property/:propertyId/bid', placeAuctionBid);

// Tokens
router.get('/tokens/:buyerId', getBuyerTokens);
router.post('/tokens/:buyerId/topup', topupBuyerTokens);

// AI & Notifications
router.get('/auctions/:auctionId/winner-ai', getWinnerAiReport);
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);
router.post('/notifications/read-all', markAllNotificationsRead);

// Backward compatibility legacy routes
router.post('/auctions/:auctionId/join', requestRegistration);
router.put('/auctions/:auctionId/end', (req, res) => {
  req.body.status = 'FROZEN';
  return updateAuctionStatus(req, res);
});
router.put('/auctions/:auctionId/cancel', (req, res) => {
  req.body.status = 'CLOSED';
  return updateAuctionStatus(req, res);
});

export default router;
