import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [mensaje, setMensaje] = useState('Cargando...');

  useEffect(() => {
    // Hacemos la petición a la ruta que creamos en Express
    fetch('http://localhost:3001/api/mensaje')
      .then(res => res.json())
      .then(data => setMensaje(data.mensaje))
      .catch(() => setMensaje('Error conectando al backend'));
  }, []);

  return (
    <div className="app">

    {/* Sidebar */}
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">
          <span></span>
        </div>
        <div className="brand-name">XInversor</div>
      </div>

      <button className="collapse-btn" aria-label="Contraer menú">☰</button>

      <nav className="sidebar-nav">
        <a href="#" className="nav-link active">
          <span className="nav-icon dashboard-icon"></span>
          <span>Inicio</span>
        </a>

        <div className="nav-section">GESTIÓN</div>

        <a href="#" className="nav-link">
          <span className="nav-icon users-icon"></span>
          <span>Usuarios</span>
        </a>
        <a href="#" className="nav-link">
          <span className="nav-icon orders-icon"></span>
          <span>Órdenes</span>
        </a>
        <a href="#" className="nav-link">
          <span className="nav-icon verification-icon"></span>
          <span>KYC / Verificación</span>
        </a>

        <div className="nav-section">CONFIGURACIÓN</div>

        <a href="#" className="nav-link">
          <span className="nav-icon audit-icon"></span>
          <span>Auditorías</span>
        </a>
        <a href="#" className="nav-link">
          <span className="nav-icon reports-icon"></span>
          <span>Reportes</span>
        </a>
        <a href="#" className="nav-link">
          <span className="nav-icon settings-icon"></span>
          <span>Configuración</span>
        </a>
        <a href="#" className="nav-link">
          <span className="nav-icon notification-icon"></span>
          <span>Notificaciones</span>
        </a>
      </nav>
      <a href="#" className="logout">
        <span className="logout-icon"></span>
        <span>Cerrar sesión</span>
      </a>
    </aside>
    <main className="main">

      <header className="topbar">
        <button className="mobile-menu" aria-label="Abrir menú">☰</button>

        <div className="search">
          <input type="search" placeholder="Buscar..." aria-label="Buscar" />
          <span className="search-icon"></span>
        </div>

        <div className="top-actions">
          <button className="notification-button" aria-label="Notificaciones">
            <span className="bell-icon"></span>
            <span className="notification-count">3</span>
          </button>

          <div className="admin-profile">
            <div className="admin-avatar">EC</div>
            <div>
              <strong>Edgar Cabrera</strong>
              <span>Administrador</span>
            </div>
            <span className="chevron"></span>
          </div>
        </div>
      </header>

      <div className="content">

        <div className="page-heading">
          <div>
            <h1>Inicio</h1>
            <p>Resumen general</p>
            <p>{mensaje}</p>
          </div>

          <button className="date-picker">
            <span className="calendar-icon"></span>
            9 de Agosto, 2026
            <span className="chevron"></span>
          </button>
        </div>
        <section className="metrics">

          <article className="metric-card">
            <div className="metric-top">
              <div>
                <span className="metric-label">USUARIOS TOTALES</span>
                <strong>2</strong>
                <small className="positive">+0.0% <span>vs ayer</span></small>
              </div>
            </div>
            <div className="sparkline blue-line">
              <span></span><span></span><span></span><span></span><span></span>
              <span></span><span></span><span></span><span></span><span></span>
              <span></span><span></span><span></span><span></span><span></span>
            </div>
          </article>
          <article className="metric-card">
            <div className="metric-top">
              <div>
                <span className="metric-label">USUARIOS ACTIVOS</span>
                <strong>842</strong>
                <small className="positive">+0.0% <span>vs ayer</span></small>
              </div>
            </div>
            <div className="sparkline blue-line">
              <span></span><span></span><span></span><span></span><span></span>
              <span></span><span></span><span></span><span></span><span></span>
              <span></span><span></span><span></span><span></span><span></span>
            </div>
          </article>
        </section>




        <footer>
          © 2026 XInversor Todos los derechos reservados.
        </footer>

      </div>
    </main>
  </div>
  );
}

export default App;