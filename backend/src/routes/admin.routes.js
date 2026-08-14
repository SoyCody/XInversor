import adminController from '../controllers/admin.controller.js';
import { Router } from 'express';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/dashboard', verifyToken, isAdmin, adminController.adminPanel)
export default router;