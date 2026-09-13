import express from 'express';
import investmentController from '../controllers/investment.controller.js';
import { isAdmin, isActive, isnBlocked, verifyToken } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createInvestmentSchema, createApplicationSchema } from '../validators/investment.validator.js';

const router = express.Router();

router.post('/new',
    verifyToken,
    isActive,
    isnBlocked,
    validate(createInvestmentSchema),
    investmentController.createInvestment
);

router.get('/list',
    verifyToken,
    isAdmin,
    isActive,
    investmentController.list
);

router.get('/my',
    verifyToken,
    isActive,
    isnBlocked,
    investmentController.myList
);

// totales + desglose por estado de las inversiones propias
router.get('/summary',
    verifyToken,
    isActive,
    investmentController.summary
);

router.get('/:inversionId/watch',
    verifyToken,
    isActive,
    isnBlocked,
    investmentController.getInvestment
)

router.post('/:inversionId/application',
    verifyToken,
    isActive,
    isnBlocked,
    validate(createApplicationSchema),
    investmentController.createApplication
);

export default router;
