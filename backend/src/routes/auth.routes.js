import { Router } from 'express';
import validate from '../middlewares/validate.middleware.js';
import { 
    registerSchema, 
    loginSchema, 
    updateSchema,
    passwordSchema
} from '../validators/auth.validator.js';
import authController from '../controllers/auth.controller.js';
import { verifyToken, isActive } from '../middlewares/auth.middleware.js';
import { uploadAvatar } from '../middlewares/upload.middleware.js';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);

router.post('/login', validate(loginSchema), authController.login);

router.post('/logout', authController.logout);

router.put('/edit', 
    validate(updateSchema), 
    verifyToken, 
    isActive,
    authController.update
);
router.put('/change/password', 
    validate(passwordSchema), 
    verifyToken, 
    isActive,
    authController.changePassword
);

router.put('/delete',
    verifyToken,
    authController.deleteUser
);

router.put('/avatar',
    verifyToken,
    isActive,
    uploadAvatar,
    authController.updateAvatar
);

// Pública: se sirve como una imagen normal (<img src>), sin cookie de sesión.
router.get('/:id/avatar', authController.getAvatar);

export default router;