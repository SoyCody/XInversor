import adminController from '../controllers/admin.controller.js';
import { Router } from 'express';
import { verifyToken, isAdmin, isActive } from '../middlewares/auth.middleware.js';
import clientController from '../controllers/client.controller.js';
import notificationController from '../controllers/notification.controller.js';

const router = Router();

router.get('/dashboard', 
    verifyToken, 
    isAdmin, 
    isActive, 
    adminController.adminPanel
);

router.get('/me', 
    verifyToken, 
    isActive,
    clientController.me
);

// GET /admin/users            -> todos
// GET /admin/users?tipo=CLIENT | ADMIN | BLOCKED | DELETED
router.get('/users',
    verifyToken,
    isAdmin,
    isActive,
    adminController.obtenerPersonas
);

router.get('/watch/user/:id',
    verifyToken,
    isAdmin,
    isActive,
    adminController.verCliente
);

router.put('/block/:id',
    verifyToken,
    isAdmin,
    isActive,
    adminController.blockClient
);

// Notificaciones del admin: paquetes y retiros nuevos por revisar.
// "/recent" alimenta el desplegable del header (máximo 5); sin eso, el
// listado paginado completo de "Notificaciones".
router.get('/notifications/recent',
    verifyToken,
    isAdmin,
    isActive,
    notificationController.recentAdmin
);

router.get('/notifications',
    verifyToken,
    isAdmin,
    isActive,
    notificationController.listAdmin
);

export default router;