import express from 'express';
const router = express.Router();

import { isActive, isnBlocked, verifyToken } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { walletSchema } from '../validators/client.validator.js';
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

router.put('/wallet',
    verifyToken,
    isActive,
    isnBlocked,
    validate(walletSchema),
    ClientController.updateWallet
);


export default router;
