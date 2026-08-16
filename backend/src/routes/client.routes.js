import express from 'express';
const router = express.Router();

import { verifyToken } from '../middlewares/auth.middleware.js';
import ClientController from '../controllers/client.controller.js';

router.get('/dashboard', verifyToken, ClientController.dashboard);
router.get('/me', verifyToken, ClientController.me);

export default router;