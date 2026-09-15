import express from 'express';
import investmentController from '../controllers/investment.controller.js';
import { isAdmin, isActive, isnBlocked, verifyToken } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createInvestmentSchema, createApplicationSchema, updatePercentSchema } from '../validators/investment.validator.js';

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

router.put('/percent/edit',
    verifyToken,
    isAdmin,
    isActive,
    validate(updatePercentSchema),
    investmentController.percent
);

router.put('/:applicationId/approve',
    verifyToken, 
    isAdmin,
    isActive,
    investmentController.approve
);

router.put('/:applicationId/reject',
    verifyToken, 
    isAdmin,
    isActive,
    investmentController.reject
);

export default router;
