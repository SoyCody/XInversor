import { Link, useLocation } from "react-router-dom";
import { useLogout } from "../../hooks/useLogout";

const AdminSideBar = () => {
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

        <Link to="/adminDashboard" className={`nav-link ${isActive("/adminDashboard") ? "active" : ""}`}>
          <span className="nav-icon dashboard-icon"></span>
          <span>Inicio</span>
        </Link>

        <div className="nav-section">GESTIÓN</div>

        <Link to="/admin/inversiones" className={`nav-link ${isActive("/admin/inversiones") ? "active" : ""}`}>
          <span className="nav-icon orders-icon"></span>
          <span>Inversiones</span>
        </Link>

        <Link to="/admin/clientes" className={`nav-link ${isActive("/admin/clientes") ? "active" : ""}`}>
          <span className="nav-icon users-icon"></span>
          <span>Usuarios</span>
        </Link>

        <Link to="/admin/solicitudes" className={`nav-link ${isActive("/admin/solicitudes") ? "active" : ""}`}>
          <span className="nav-icon verification-icon"></span>
          <span>KYC / Verificación</span>
        </Link>

        <div className="nav-section">CONFIGURACIÓN</div>

        <Link to="/admin/me" className={`nav-link ${isActive("/admin/me") ? "active" : ""}`}>
          <span className="nav-icon settings-icon"></span>
          <span>Configuración</span>
        </Link>

        <Link to="/admin/auditorias" className={`nav-link ${isActive("/admin/auditorias") ? "active" : ""}`}>
          <span className="nav-icon audit-icon"></span>
          <span>Auditorías</span>
        </Link>
        <a href="#" className="nav-link">
          <span className="nav-icon reports-icon"></span>
          <span>Reportes</span>
        </a>
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

export default AdminSideBar;