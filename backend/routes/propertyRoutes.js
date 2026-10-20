import express from 'express';
import {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty
} from '../controllers/propertyController.js';
import { placeAuctionBid } from '../controllers/bidController.js';

import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import { db } from '../database/db.js';

const ownedProperty = (req, res, next) => {
  const property = db.getPropertyById(req.params.id);
  if (!property) return res.status(404).json({ error: 'Property not found' });
  if (property.sellerEmail !== req.user.email) return res.status(403).json({ error: 'Only the owning seller may modify this property' });
  next();
};
const router = express.Router();

router.get('/', getProperties);
router.get('/auction-inventory', authenticate, requireRole('Seller'), (req, res) => {
  try { res.json({ properties: db.getSellerAuctionInventory(req.user.email) }); }
  catch (error) { res.status(500).json({ error: error.message }); }
});
router.get('/:id', getPropertyById);
router.post('/', authenticate, requireRole('Seller'), createProperty);
router.put('/:id', authenticate, requireRole('Seller'), ownedProperty, updateProperty);
router.delete('/:id', authenticate, requireRole('Seller'), ownedProperty, deleteProperty);
router.post('/:id/bid', authenticate, requireRole('Buyer'), (req, res, next) => {
  if ([req.body.buyerId, req.body.buyer_id, req.body.email].some(id => id && id !== req.user.email)) return res.status(403).json({ error: 'Identity mismatch' });
  next();
}, placeAuctionBid);

export default router;
