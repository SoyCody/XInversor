import { Link, useLocation } from "react-router-dom";
import { useLogout } from "../../hooks/useLogout";
import { useFetch } from "../../hooks/useFetch";
import { getHighestInvestment } from "../../services/clientApi.js";
import "./SideBar.css";
import logo from "../../assets/logo.png";
import inicioIcon from "../../assets/inicio.png";
import inversionesIcon from "../../assets/inversiones.png";
import configuracionIcon from "../../assets/configuracion.png";
import notificacionIcon from "../../assets/notificacion.png";
import cerrarSesionIcon from "../../assets/cerrarSesion.png";
import fx500 from "../../assets/packages/fx-500.png";
import fx1000 from "../../assets/packages/fx-1000.png";
import fx2000 from "../../assets/packages/fx-2000.png";
import fx3000 from "../../assets/packages/fx-3000.png";
import fx5000 from "../../assets/packages/fx-5000.png";
import fx7000 from "../../assets/packages/fx-7000.png";
import fx10000 from "../../assets/packages/fx-10000.png";
import fx15000 from "../../assets/packages/fx-15000.png";
import fx20000 from "../../assets/packages/fx-20000.png";

const ICONOS_PAQUETE = [
  { monto: 500, icon: fx500 },
  { monto: 1000, icon: fx1000 },
  { monto: 2000, icon: fx2000 },
  { monto: 3000, icon: fx3000 },
  { monto: 5000, icon: fx5000 },
  { monto: 7000, icon: fx7000 },
  { monto: 10000, icon: fx10000 },
  { monto: 15000, icon: fx15000 },
  { monto: 20000, icon: fx20000 }
];

const iconoParaMonto = (monto) => {
  const num = Number(monto);
  return ICONOS_PAQUETE.reduce((mejor, actual) =>
    Math.abs(actual.monto - num) < Math.abs(mejor.monto - num) ? actual : mejor
  ).icon;
};

const ClientSideBar = () => {
  const { logout, isSubmitting } = useLogout();
  const location = useLocation();
  // Acceso directo a la inversión con mayor monto: no hay nada que
  // recargar tras crear/aprobar una inversión desde acá (el sidebar se
  // vuelve a montar en cada navegación), así que alcanza con pedirlo una
  // vez al montar.
  const { data: highest } = useFetch(getHighestInvestment, []);

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="sidebar">
      <div className="brand">
        <img className="brand-logo-img" src={logo} alt="FXInversors" />
        <div className="brand-name">FXINVERSORS</div>
      </div>

      {highest && (
        <Link
          to={`/client/inversiones/${highest.id}`}
          className="sidebar-highest-investment"
          title="Ver detalles de tu inversión más alta"
        >
          <img src={iconoParaMonto(highest.monto)} alt="Tu inversión más alta" />
        </Link>
      )}

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

        <Link to="/client/notificaciones" className={`nav-link ${isActive("/client/notificaciones") ? "active" : ""}`}>
          <img className="nav-icon-img" src={notificacionIcon} alt="" aria-hidden="true" />
          <span>Notificaciones</span>
        </Link>

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
