import express from 'express';
const router = express.Router();

import { isActive, verifyToken } from '../middlewares/auth.middleware.js';
import ClientController from '../controllers/client.controller.js';

router.get('/dashboard', 
    verifyToken, 
    isActive,
    ClientController.dashboard
);
router.get('/me', 
    verifyToken, 
    isActive,
    ClientController.me
);

export default router;