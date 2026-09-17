import { Link, useLocation } from "react-router-dom";
import { useLogout } from "../../hooks/useLogout";
import "./SideBar.css";
import logo from "../../assets/logo.png";
import inicioIcon from "../../assets/inicio.png";
import inversionesIcon from "../../assets/inversiones.png";
import configuracionIcon from "../../assets/configuracion.png";
import notificacionIcon from "../../assets/notificacion.png";
import cerrarSesionIcon from "../../assets/cerrarSesion.png";

const ClientSideBar = () => {
  const { logout, isSubmitting } = useLogout();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="sidebar">
      <div className="brand">
        <img className="brand-logo-img" src={logo} alt="FXInversors" />
        <div className="brand-name">FXINVERSORS</div>
      </div>

      <nav className="sidebar-nav">
        <Link to="/dashboard" className={`nav-link ${isActive("/dashboard") ? "active" : ""}`}>
          <img className="nav-icon-img" src={inicioIcon} alt="" aria-hidden="true" />
          <span>Inicio</span>
        </Link>

        <div className="nav-section">GESTIÓN</div>

        <Link to="/client/inversiones" className={`nav-link ${isActive("/client/inversiones") ? "active" : ""}`}>
          <img className="nav-icon-img" src={inversionesIcon} alt="" aria-hidden="true" />
          <span>Paquetes</span>
        </Link>

        <div className="nav-section">CONFIGURACIÓN</div>

        <Link to="/client/me" className={`nav-link ${isActive("/client/me") ? "active" : ""}`}>
          <img className="nav-icon-img" src={configuracionIcon} alt="" aria-hidden="true" />
          <span>Configuración</span>
        </Link>

        <a href="#" className="nav-link">
          <img className="nav-icon-img" src={notificacionIcon} alt="" aria-hidden="true" />
          <span>Notificaciones</span>
        </a>

      </nav>

      <button
        className="auth-submit logout"
        type="button"
        onClick={logout}
        disabled={isSubmitting}
      >
        <img className="logout-icon-img" src={cerrarSesionIcon} alt="" aria-hidden="true" />
        {isSubmitting ? "Cerrando sesión..." : "Cerrar sesión"}
      </button>
    </aside>
  );
};

export default ClientSideBar;
