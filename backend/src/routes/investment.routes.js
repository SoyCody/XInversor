import express from 'express';
import investmentController from '../controllers/investment.controller.js';
import { isAdmin, isActive, isnBlocked, verifyToken } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createApplicationSchema } from '../validators/investment.validator.js';

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

router.get('/my',
    verifyToken,
    isActive,
    isnBlocked,
    investmentController.myList
);

router.get('/:inversionId/watch',
    verifyToken,
    isActive,
    isnBlocked,
    investmentController.getInvestment
)

// Crear una solicitud de retiro sobre una inversión propia.
router.post('/:inversionId/application',
    verifyToken,
    isActive,
    isnBlocked,
    validate(createApplicationSchema),
    investmentController.createApplication
);

export default router;
