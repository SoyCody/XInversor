import { Router } from 'express';
import auditController from '../controllers/audit.controller.js';
import { isActive, isAdmin, verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/all', 
    verifyToken, 
    isAdmin, 
    isActive, 
    auditController.obtenerAuditorias
);

router.get('/:id', 
    verifyToken,
    isAdmin,
    isActive,
    auditController.verAuditoria
)

export default router;