import { Link, useLocation } from "react-router-dom";
import { useLogout } from "../../hooks/useLogout";
import "./SideBar.css";
import logo from "../../assets/logo.png";
import inicioIcon from "../../assets/inicio.png";
import inversionesIcon from "../../assets/inversiones.png";
import usuariosIcon from "../../assets/usuarios.png";
import verificacionIcon from "../../assets/verificacion.png";
import configuracionIcon from "../../assets/configuracion.png";
import auditoriaIcon from "../../assets/auditoria.png";
import notificacionIcon from "../../assets/notificacion.png";
import cerrarSesionIcon from "../../assets/cerrarSesion.png";

const AdminSideBar = () => {
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

        <Link to="/adminDashboard" className={`nav-link ${isActive("/adminDashboard") ? "active" : ""}`}>
          <img className="nav-icon-img" src={inicioIcon} alt="" aria-hidden="true" />
          <span>Inicio</span>
        </Link>

        <div className="nav-section">GESTIÓN</div>

        <Link to="/admin/inversiones" className={`nav-link ${isActive("/admin/inversiones") ? "active" : ""}`}>
          <img className="nav-icon-img" src={inversionesIcon} alt="" aria-hidden="true" />
          <span>Inversiones</span>
        </Link>

        <Link to="/admin/clientes" className={`nav-link ${isActive("/admin/clientes") ? "active" : ""}`}>
          <img className="nav-icon-img" src={usuariosIcon} alt="" aria-hidden="true" />
          <span>Usuarios</span>
        </Link>

        <Link to="/admin/solicitudes" className={`nav-link ${isActive("/admin/solicitudes") ? "active" : ""}`}>
          <img className="nav-icon-img" src={verificacionIcon} alt="" aria-hidden="true" />
          <span>KYC / Verificación</span>
        </Link>

        <div className="nav-section">CONFIGURACIÓN</div>

        <Link to="/admin/me" className={`nav-link ${isActive("/admin/me") ? "active" : ""}`}>
          <img className="nav-icon-img" src={configuracionIcon} alt="" aria-hidden="true" />
          <span>Configuración</span>
        </Link>

        <Link to="/admin/auditorias" className={`nav-link ${isActive("/admin/auditorias") ? "active" : ""}`}>
          <img className="nav-icon-img" src={auditoriaIcon} alt="" aria-hidden="true" />
          <span>Auditorías</span>
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

export default AdminSideBar;
