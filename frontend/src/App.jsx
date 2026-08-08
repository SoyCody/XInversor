import { useState, useEffect } from 'react';

function App() {
  const [mensaje, setMensaje] = useState('Cargando...');

  useEffect(() => {
    // Hacemos la petición a la ruta que creamos en Express
    fetch('http://localhost:3001/api/mensaje')
      .then(res => res.json())
      .then(data => setMensaje(data.mensaje))
      .catch(err => setMensaje('Error conectando al backend'));
  }, []);

  return (
    <p>
      Plataforma Web
      Estado del Backend:
      {mensaje}
    </p>
  );
}

export default App;