import clientController from '../controllers/client.controller.js';
import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/dashboard', verifyToken, clientController.clientPanel);

export default router;