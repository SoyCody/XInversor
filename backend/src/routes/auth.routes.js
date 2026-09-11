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

// PENDIENTE (seguridad / auditoría): /login y /register no tienen rate
// limiting. Para una web pública con usuarios reales hace falta un
// express-rate-limit (p. ej. 5-10 intentos por IP cada 15 min en /login,
// y un límite más laxo en /register) antes de salir a producción.
// Nota de orden: `validate(...)` corre antes que `verifyToken` en /edit y
// /change/password; no es crítico aquí, pero lo habitual es autenticar
// primero y validar después.

router.post('/register',
    validate(registerSchema),
    authController.register
);

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

router.get('/:id/avatar', authController.getAvatar);

export default router;