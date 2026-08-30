import { Link, useLocation } from "react-router-dom";
import { useLogout } from "../../hooks/useLogout";

const ClientSideBar = () => {
  const { logout, isSubmitting } = useLogout();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">
          <span></span>
        </div>
        <div className="brand-name">XInversor</div>
      </div>

      <nav className="sidebar-nav">
        <Link to="/dashboard" className={`nav-link ${isActive("/dashboard") ? "active" : ""}`}>
          <span className="nav-icon dashboard-icon"></span>
          <span>Inicio</span>
        </Link>

        <div className="nav-section">GESTIÓN</div>

        <Link to="/client/inversiones" className={`nav-link ${isActive("/client/inversiones") ? "active" : ""}`}>
          <span className="nav-icon orders-icon"></span>
          <span>Inversiones</span>
        </Link>

        <div className="nav-section">CONFIGURACIÓN</div>

        <Link to="/client/me" className={`nav-link ${isActive("/client/me") ? "active" : ""}`}>
          <span className="nav-icon settings-icon"></span>
          <span>Configuración</span>
        </Link>

        <a href="#" className="nav-link">
          <span className="nav-icon notification-icon"></span>
          <span>Notificaciones</span>
        </a>
        
      </nav>

      <button
        className="auth-submit logout"
        type="button"
        onClick={logout}
        disabled={isSubmitting}
      >
        <span className="logout-icon"></span>
        {isSubmitting ? "Cerrando sesión..." : "Cerrar sesión"}
      </button>
    </aside>
  );
};

export default ClientSideBar;