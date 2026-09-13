import { Router } from 'express';
import validate from '../middlewares/validate.middleware.js';
import { 
    registerSchema, 
    loginSchema, 
    updateSchema,
    passwordSchema
} from '../validators/auth.validator.js';
import authController from '../controllers/auth.controller.js';
import { verifyToken, isActive, isnBlocked } from '../middlewares/auth.middleware.js';
import { uploadAvatar } from '../middlewares/upload.middleware.js';
import { loginLimiter, registerLimiter } from '../middlewares/rateLimit.middleware.js';

const router = Router();

router.post('/register',
    registerLimiter,
    validate(registerSchema),
    authController.register
);

router.post('/login', loginLimiter, validate(loginSchema), authController.login);

router.post('/logout', authController.logout);

router.put('/edit',
    verifyToken,
    isActive,
    isnBlocked,
    validate(updateSchema),
    authController.update
);
router.put('/change/password',
    verifyToken,
    isActive,
    isnBlocked,
    validate(passwordSchema),
    authController.changePassword
);

router.put('/delete',
    verifyToken,
    authController.deleteUser
);

router.put('/avatar',
    verifyToken,
    isActive,
    isnBlocked,
    uploadAvatar,
    authController.updateAvatar
);

router.get('/:id/avatar', authController.getAvatar);

export default router;