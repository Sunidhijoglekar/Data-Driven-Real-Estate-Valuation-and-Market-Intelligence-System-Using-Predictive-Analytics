import express from 'express';
import {
  predictPropertyPrice,
  getModelEvaluationMetrics,
  getHistoricalTrends
} from '../controllers/mlController.js';

const router = express.Router();

router.post('/predict', predictPropertyPrice);
router.get('/metrics', getModelEvaluationMetrics);
router.get('/historical-trends', getHistoricalTrends);

export default router;
