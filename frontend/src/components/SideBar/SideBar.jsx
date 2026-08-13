
const SideBar =()=>{
    return(
        <aside className="sidebar">
            <div className="brand">
            <div className="brand-logo">
                <span></span>
            </div>
            <div className="brand-name">XInversor</div>
            </div>

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
      
    )
}

export default SideBar