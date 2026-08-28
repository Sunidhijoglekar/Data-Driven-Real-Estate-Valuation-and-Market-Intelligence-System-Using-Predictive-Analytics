import express from 'express';
import { generatePropertyInsights } from '../controllers/geminiController.js';

const router = express.Router();

router.post('/insights', generatePropertyInsights);

export default router;
