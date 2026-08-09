import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import usersRoutes from './routes/user.routes.js'

const app = express();
const PORT = 3001;

// Habilitar CORS para permitir peticiones desde el frontend
app.use(cors());
app.use(express.json());

app.use('/users', usersRoutes);

// Ruta de prueba
app.get('/api/mensaje', (req, res) => {
  res.json({ mensaje: 'Hola desde el servidor backend' });
});

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});