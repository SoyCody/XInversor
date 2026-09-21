import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFetch } from "../../hooks/useFetch";
import { getCurrentUser, getAvatarUrl } from "../../services/authApi";
import { getRecentClientNotifications, getRecentAdminNotifications } from "../../services/notificationApi.js";
import { describirNotificacion, formatFechaNotificacion, colorNotificacion } from "../../utils/notificaciones.js";
import { countUnseen, markAllSeen } from "../../utils/notificationsSeen.js";
import { getTheme, setTheme } from "../../utils/theme.js";
import "./Header.css";
import "../Config/ConfigModal.css";
import configuracionIcon from "../../assets/configuracion.png";
import notificacionIcon from "../../assets/notificacion.png";
import contrasteIcon from "../../assets/contraste.png";

const ROLE_LABELS = {
  ADMIN: "Administrador",
  CLIENT: "Cliente",
};

// Cada rol tiene su propio menú general de configuración y su propia
// pantalla de notificaciones.
const SETTINGS_PATHS = {
  ADMIN: "/admin/me",
  CLIENT: "/client/me",
};

const NOTIFICATIONS_PATHS = {
  ADMIN: "/admin/notificaciones",
  CLIENT: "/client/notificaciones",
};

const Header = () => {
  const { data: user, isLoading } = useFetch(getCurrentUser);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [theme, setThemeState] = useState(getTheme);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setThemeState(next);
  };

  const roleLabel = user?.role
    ? ROLE_LABELS[user.role] ?? user.role
    : "";

  // Las 5 más recientes, para el desplegable de la campana. No se pide
  // hasta que se sepa el rol (recién ahí se sabe a qué endpoint pegarle);
  // mientras tanto devuelve null en vez de arrancar con el endpoint
  // equivocado y reintentar.
  const { data: notifData } = useFetch(
    () => {
      if (!user?.role) return Promise.resolve(null);
      return user.role === "ADMIN"
        ? getRecentAdminNotifications()
        : getRecentClientNotifications();
    },
    [user?.role]
  );
  const notificaciones = notifData?.notificaciones ?? [];

  // El badge muestra cuántas de las recientes todavía no se vieron, no
  // el total: si ya se abrió el desplegable (o se entró a la pantalla
  // completa) y no hay notificaciones nuevas desde entonces, no debe
  // seguir mostrando número. Se recalcula en cada render (no hace falta
  // estado propio): markAllSeen ya deja esto en 0 al re-renderizar tras
  // abrir el desplegable.
  const unseenCount = user?.id ? countUnseen(notificaciones, user.id) : 0;

  // Cierra el menú al hacer click fuera de él.
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  // Mismo patrón de cierre-al-click-afuera que el menú de perfil, pero
  // para el desplegable de notificaciones.
  useEffect(() => {
    if (!isNotifOpen) return;

    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isNotifOpen]);

  const goToSettings = () => {
    setIsMenuOpen(false);
    navigate(SETTINGS_PATHS[user?.role] ?? "/client/me");
  };

  // Clickear cualquier notificación del desplegable lleva al apartado
  // completo de "Notificaciones" (no a la inversión puntual -- eso lo
  // hace el botón "Detalles" de esa pantalla).
  const goToNotifications = () => {
    setIsNotifOpen(false);
    navigate(NOTIFICATIONS_PATHS[user?.role] ?? "/client/notificaciones");
  };

  // Al ABRIR el desplegable (no al cerrarlo) se marcan como vistas: es lo
  // que hace que el número desaparezca del ícono en vez de quedarse ahí
  // para siempre aunque ya se hayan revisado. El cambio de estado de
  // abajo ya fuerza el re-render que recalcula unseenCount en 0.
  const toggleNotifications = () => {
    setIsNotifOpen((open) => {
      const next = !open;
      if (next && user?.id) markAllSeen(user.id);
      return next;
    });
  };

  return (
    <header className="topbar">

      <div className="top-actions">
        <div className="notification-wrap" ref={notifRef}>
          <button
            className="notification-button"
            type="button"
            aria-label="Notificaciones"
            onClick={toggleNotifications}
            aria-haspopup="true"
            aria-expanded={isNotifOpen}
          >
            <img className="notification-icon-img" src={notificacionIcon} alt="" aria-hidden="true" />
            {unseenCount > 0 && (
              <span className="notification-count">{unseenCount}</span>
            )}
          </button>

          {isNotifOpen && (
            <div className="notification-menu" role="menu">
              <div className="config-modal__header notification-menu-header">
                <h2>Notificaciones</h2>
              </div>

              <div className="notification-menu-body">
                {notificaciones.length === 0 ? (
                  <p className="notification-menu-empty">No tienes notificaciones nuevas.</p>
                ) : (
                  notificaciones.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      className="notification-menu-item"
                      role="menuitem"
                      onClick={goToNotifications}
                    >
                      <span
                        className={`notification-dot ${colorNotificacion(n.tipo)}`}
                        aria-hidden="true"
                      />
                      <span className="notification-menu-item-text">
                        <span className="notification-menu-item-title">
                          {describirNotificacion(n)}
                        </span>
                        <span className="notification-menu-item-date">
                          {formatFechaNotificacion(n.fecha)}
                        </span>
                      </span>
                    </button>
                  ))
                )}
              </div>

              <button
                type="button"
                className="notification-menu-viewall"
                onClick={goToNotifications}
              >
                Ver todas
              </button>
            </div>
          )}
        </div>

        <div className="admin-profile" ref={profileRef}>
          <button
            type="button"
            className="admin-profile-trigger"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-haspopup="true"
            aria-expanded={isMenuOpen}
          >
            <div className="admin-avatar">
              {user?.id && (
                <img
                  src={getAvatarUrl(user.id, user.avatarUpdatedAt)}
                  alt="Foto de perfil"
                />
              )}
            </div>
            <div>
              <strong>{isLoading ? "…" : user?.firstName ?? "—"}</strong>
              <span>{isLoading ? "" : roleLabel}</span>
            </div>
            <span className="chevron" aria-hidden="true" />
          </button>

          {isMenuOpen && (
            <div className="admin-profile-menu" role="menu">
              <button
                type="button"
                className="admin-profile-menu-item"
                role="menuitem"
                onClick={goToSettings}
              >
                <img className="menu-icon-img" src={configuracionIcon} alt="" aria-hidden="true" />
                <span>Configuración</span>
              </button>
              <button
                type="button"
                className="admin-profile-menu-item"
                role="menuitem"
                onClick={toggleTheme}
              >
                <img className="menu-icon-img" src={contrasteIcon} alt="" aria-hidden="true" />
                <span>{theme === "dark" ? "Modo claro" : "Modo oscuro"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
