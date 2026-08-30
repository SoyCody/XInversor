import express from 'express';
import investmentController from '../controllers/investment.controller.js';
import { isAdmin, isActive, isnBlocked, verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/new',
    verifyToken,
    isActive,
    isnBlocked,
    investmentController.createInvestment
);

router.get('/list',
    verifyToken,
    isAdmin,
    isActive,
    investmentController.list
);

export default router;