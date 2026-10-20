import express from 'express';
import { loginUser } from '../controllers/authController.js';

import { authenticate, getSession, logout } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', loginUser);
router.post('/register', loginUser);
router.get('/me', authenticate, getSession);
router.post('/logout', logout);

export default router;
