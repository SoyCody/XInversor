import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../db.js';

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.get('/all', async (req, res) => {
  try {
    // IMPORTANTE: nunca usar findMany() sin "select" en un endpoint
    // de usuarios — devolvía el passwordHash de todos los registros.
    // TODO: además, este endpoint debería requerir autenticación
    // de administrador antes de salir a producción.
    const usuarios = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });

    res.json(usuarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Error al consultar usuarios'
    });
  }
});

router.post('/register', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password
    } = req.body;

    // ==============================
    // VALIDACIONES
    // ==============================

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        error: 'Todos los campos son obligatorios'
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        error: 'El correo electrónico no es válido'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 8 caracteres'
      });
    }

    // El registro público SIEMPRE crea cuentas CLIENT.
    // Nunca se debe confiar en un "role" que venga del body:
    // permitir eso deja que cualquier visitante se cree una
    // cuenta ADMIN. La creación de administradores debe vivir
    // en una ruta aparte, protegida por autenticación de admin.
    const userRole = 'CLIENT';

    // ==============================
    // COMPROBAR CORREO
    // ==============================

    const existingUser = await prisma.user.findUnique({
      where: {
        email
      }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'Ya existe una cuenta con este correo electrónico'
      });
    }

    // ==============================
    // HASH DE CONTRASEÑA
    // ==============================

    const passwordHash = await bcrypt.hash(password, 12);

    // ==============================
    // DATOS DEL USUARIO
    // ==============================

    const userData = {
      firstName,
      lastName,
      email,
      passwordHash,
      role: userRole,
      client: {
        create: {
          // Aquí posteriormente colocaremos
          // la generación definitiva del link.
          link: `user-${Date.now()}`
        }
      }
    };

    // ==============================
    // CREAR USUARIO
    // ==============================

    const newUser = await prisma.user.create({
      data: userData,

      include: {
        client: true
      }
    });

    // No devolver el hash
    const {
      passwordHash: _passwordHash,
      ...userWithoutPassword
    } = newUser;

    res.status(201).json(userWithoutPassword);

  } catch (error) {

    // Si dos registros llegan casi al mismo tiempo con el
    // mismo correo, la comprobación previa puede no alcanzar
    // a detectarlo: Prisma lanza P2002 por la restricción
    // única de la base de datos.
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Ya existe una cuenta con este correo electrónico'
      });
    }

    console.error(
      'Error al registrar usuario:',
      error
    );

    res.status(500).json({
      error: 'Error al registrar usuario'
    });
  }
});

export default router;