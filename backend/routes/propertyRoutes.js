import express from 'express';
import {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty
} from '../controllers/propertyController.js';
import { placeAuctionBid } from '../controllers/bidController.js';

const router = express.Router();

router.get('/', getProperties);
router.get('/:id', getPropertyById);
router.post('/', createProperty);
router.put('/:id', updateProperty);
router.delete('/:id', deleteProperty);
router.post('/:id/bid', placeAuctionBid);

export default router;
