import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFetch } from "../../hooks/useFetch";
import { getCurrentUser, getAvatarUrl } from "../../services/authApi";

const ROLE_LABELS = {
  ADMIN: "Administrador",
  CLIENT: "Cliente",
};

// Cada rol tiene su propio menú general de configuración.
const SETTINGS_PATHS = {
  ADMIN: "/admin/me",
  CLIENT: "/client/me",
};

const Header = () => {
  const { data: user, isLoading } = useFetch(getCurrentUser);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const profileRef = useRef(null);

  const roleLabel = user?.role
    ? ROLE_LABELS[user.role] ?? user.role
    : "";

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

  const goToSettings = () => {
    setIsMenuOpen(false);
    navigate(SETTINGS_PATHS[user?.role] ?? "/client/me");
  };

  return (
    <header className="topbar">

      <div className="top-actions">
        <button className="notification-button" type="button" aria-label="Notificaciones">
          <span className="bell-icon" aria-hidden="true" />
          <span className="notification-count">3</span>
        </button>

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
                <span className="nav-icon settings-icon" aria-hidden="true" />
                <span>Configuración</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
