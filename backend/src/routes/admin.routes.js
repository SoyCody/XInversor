import adminController from '../controllers/admin.controller.js';
import { Router } from 'express';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';
import clientController from '../controllers/client.controller.js';

const router = Router();

router.get('/dashboard', verifyToken, isAdmin, adminController.adminPanel);
router.get('/me', verifyToken, clientController.me);
router.get('/users', verifyToken, isAdmin, adminController.obtenerClientes);
router.get('/watch/user/:id', verifyToken, isAdmin, adminController.verCliente);

export default router;