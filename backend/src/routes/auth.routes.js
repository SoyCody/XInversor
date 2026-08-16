import { Router } from 'express';
import validate from '../middlewares/validate.middleware.js';
import { registerSchema, loginSchema, updateSchema } from '../validators/auth.validator.js';
import authController from '../controllers/auth.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.put('/edit/', validate(updateSchema), verifyToken, authController.update);


export default router;