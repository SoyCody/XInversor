import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import usersRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import clientRoutes from './routes/client.routes.js';
import cookieParser from 'cookie-parser';
import auditRoutes from './routes/audit.routes.js';

const app = express();
app.use(cookieParser());
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

app.use('/users', usersRoutes);
app.use('/admin', adminRoutes);
app.use('/client', clientRoutes);
app.use('/audits', auditRoutes);

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});