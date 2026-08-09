import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import prisma from './db.js';

const app = express();
const PORT = 3001;

// Habilitar CORS para permitir peticiones desde el frontend
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get('/api/mensaje', (req, res) => {
  res.json({ mensaje: 'Hola desde el servidor backend' });
});

app.post('/login', (req, res) => {
  res.status(501).json({ message: 'No implementado aún' });
});
app.post('/register', (req, res) => {
  res.status(501).json({ message: 'No implementado aún' });
});
app.post('/logout', (req, res) => {
  res.status(200).json({ message: 'Sesión cerrada' });
});
app.get('/inicio', (req, res) => {
  res.json({ message: 'API funcionando' });
});
app.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await prisma.user.findMany();
    res.json(usuarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al consultar usuarios' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});