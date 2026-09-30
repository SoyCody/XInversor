import { Router } from 'express';
import validate from '../middlewares/validate.middleware.js';
import {
    registerSchema,
    loginSchema,
    updateSchema,
    passwordSchema,
    confirmCodeSchema
} from '../validators/auth.validator.js';
import authController from '../controllers/auth.controller.js';
import { verifyToken, isActive, isnBlocked } from '../middlewares/auth.middleware.js';
import { uploadAvatar } from '../middlewares/upload.middleware.js';
import { loginLimiter, registerLimiter, verifyCodeLimiter } from '../middlewares/rateLimit.middleware.js';

const router = Router();

// Paso 1: valida los datos y manda el código de verificación al correo.
router.post('/register',
    registerLimiter,
    validate(registerSchema),
    authController.register
);

// Paso 2: confirma el código y recién ahí crea la cuenta (ver
// auth.controller.js#confirmRegister). No lleva registerLimiter -- ya
// tiene su propio límite pensado para fuerza bruta de un código corto.
router.post('/register/confirm',
    verifyCodeLimiter,
    validate(confirmCodeSchema),
    authController.confirmRegister
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
// Paso 1: valida la contraseña actual y manda el código al correo.
router.put('/change/password',
    verifyToken,
    isActive,
    isnBlocked,
    validate(passwordSchema),
    authController.changePassword
);

// Paso 2: confirma el código y recién ahí aplica la contraseña nueva.
router.put('/change/password/confirm',
    verifyToken,
    isActive,
    isnBlocked,
    verifyCodeLimiter,
    validate(confirmCodeSchema),
    authController.confirmChangePassword
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