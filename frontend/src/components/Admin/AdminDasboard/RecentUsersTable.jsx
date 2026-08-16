import "./RecentUsersTable.css";

const formatDate = (isoString) => {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("es-EC", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const RecentUsersTable = ({ users, isLoading }) => {
  return (
    <article className="metric-card">
        <section className="recent-users">
        <div className="recent-users-header">
            <h2>Usuarios recientes</h2>
            <p>Últimas cuentas creadas en la plataforma</p>
        </div>

        <div className="recent-users-table">
            <div className="recent-users-row recent-users-row--head">
            <span>Nombre</span>
            <span>Correo</span>
            <span>Rol</span>
            <span>Registrado</span>
            </div>

            {isLoading && (
            <div className="recent-users-empty">Cargando usuarios...</div>
            )}

            {!isLoading && (!users || users.length === 0) && (
            <div className="recent-users-empty">
                Todavía no hay usuarios registrados.
            </div>
            )}

            {!isLoading &&
            users?.map((user) => (
                <div className="recent-users-row" key={user.id}>
                <span className="recent-users-name">
                    {user.firstName} {user.lastName}
                </span>
                <span className="recent-users-email">{user.email}</span>
                <span>
                    <span
                    className={`role-badge role-badge--${user.role.toLowerCase()}`}
                    >
                    {user.role === "ADMIN" ? "Administrador" : "Cliente"}
                    </span>
                </span>
                <span className="recent-users-date">
                    {formatDate(user.createdAt)}
                </span>
                </div>
            ))}
        </div>
        </section>
    </article>
  );
};

export default RecentUsersTable;