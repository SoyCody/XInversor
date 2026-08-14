import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import usersRoutes from './routes/auth.routes.js'
import adminRoutes from './routes/admin.routes.js'

const app = express();
const PORT = process.env.PORT || 3001;

// Habilitar CORS para permitir peticiones desde el frontend
app.use(cors());
app.use(express.json());

// Montado en /api/users porque el frontend llama a
// `${API_URL}/api/users/...` — antes estaba en /users
// y el registro nunca llegaba a esta ruta (404).
app.use('/users', usersRoutes);
app.use('/admin', adminRoutes);

// Ruta de prueba
app.get('/api/mensaje', (req, res) => {
  res.json({ mensaje: 'Hola desde el servidor backend' });
});

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});