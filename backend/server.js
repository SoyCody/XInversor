const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Habilitar CORS para permitir peticiones desde el frontend
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get('/api/mensaje', (req, res) => {
  res.json({ mensaje: 'Hola desde el servidor backend' });
});

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});