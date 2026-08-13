const Header = () => {
  return (
    <header className="topbar">
      <button className="mobile-menu" type="button">☰</button>

      <div className="search">
        <span className="search-icon" aria-hidden="true" />
        <input type="text" placeholder="Buscar..." aria-label="Buscar" />
      </div>

      <div className="top-actions">
        <button className="notification-button" type="button" aria-label="Notificaciones">
          <span className="bell-icon" aria-hidden="true" />
          <span className="notification-count">3</span>
        </button>

        <div className="admin-profile">
          <div className="admin-avatar">AD</div>
          <div>
            <strong>Admin</strong>
            <span>Superusuario</span>
          </div>
          <span className="chevron" aria-hidden="true" />
        </div>
      </div>
    </header>
  );
};

export default Header;