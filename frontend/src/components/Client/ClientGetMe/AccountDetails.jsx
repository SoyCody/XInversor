import "./AccountDetails.css";

const formatDateTime = (isoString) => {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleString("es-EC", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AccountDetails = ({ user, isLoading }) => {
  // Todo lo que describe a la cuenta como tal. Fuera quedan
  // user.id, client.id y client.userId: son llaves de la BD,
  // no "características" del usuario.
  const rows = [
    { label: "Nombres", value: user?.firstName },
    { label: "Apellidos", value: user?.lastName },
    { label: "Correo electrónico", value: user?.email },
    { label: "Última actualización", value: formatDateTime(user?.apdatedAt) },
  ];

  return (
    <section className="account-details">
      <div className="account-details-header">
        <h2>Detalles de la cuenta</h2>
      </div>

      <div className="account-details-list">
        {rows.map((row) => (
          <div className="account-details-row" key={row.label}>
            <span className="account-details-label">{row.label}</span>
            <span className="account-details-value">
              {isLoading ? "—" : row.value || "—"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AccountDetails;