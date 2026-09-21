import express from 'express';
const router = express.Router();

import { isActive, isnBlocked, verifyToken } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { walletSchema } from '../validators/client.validator.js';
import ClientController from '../controllers/client.controller.js';
import NotificationController from '../controllers/notification.controller.js';

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

router.get('/highest/investment',
    verifyToken,
    isActive,
    isnBlocked,
    ClientController.highestInvestment
);

// Notificaciones del cliente: aprobaciones/rechazos de sus paquetes y
// retiros. "/recent" alimenta el desplegable del header (máximo 5); sin
// eso, el listado paginado completo de "Notificaciones".
router.get('/notifications/recent',
    verifyToken,
    isActive,
    isnBlocked,
    NotificationController.recentClient
);

router.get('/notifications',
    verifyToken,
    isActive,
    isnBlocked,
    NotificationController.listClient
);

export default router;
