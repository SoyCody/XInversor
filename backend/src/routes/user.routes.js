import {Router} from 'express';
import prisma from '../db.js';

const router = Router();


// Peticion temporal
router.get('/all', async (req, res) => {
  try {
    const usuarios = await prisma.user.findMany();
    res.json(usuarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al consultar usuarios' });
  }
});

router.post('/register', async(req, res) =>{
    try{
        const { firstName, lastName, email, passwordHash, role, link } = req.body;
        const userRole = role || 'CLIENT';
        const userData = {
            firstName,
            lastName,
            email,
            passwordHash,
            role: userRole,
        };
        if (userRole === 'CLIENT') {
            // Si es cliente, el campo 'link' es obligatorio según tu schema
            if (!link) {
                return res.status(400).json({ error: 'El campo "link" es obligatorio para el rol CLIENT' });
            }
            // Escritura anidada para crear el Client
            userData.client = {
                create: {
                    link: link,
                },
            };
        } else if (userRole === 'ADMIN') {
            // Escritura anidada para crear el Admin (no requiere campos extra iniciales)
            userData.admin = {
                create: {}, 
            };
        } else {
            return res.status(400).json({ error: 'Rol inválido' });
        }
        // 4. Crear el usuario en la base de datos
        const newUser = await prisma.user.create({
        data: userData,
        include: {
            client: true, // Incluimos esto para que la respuesta de la API devuelva los datos del cliente
            admin: true,  // Igual para el admin
        },
        });

        // 5. Devolver el usuario creado
        res.status(201).json(newUser);
    }catch(error){
        console.log(error);
        res.status(500).json({error: 'Error al registrar usuario'})
    }
})
export default router;