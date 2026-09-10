import "./AccountDetails.css";

const formatDate = (isoString) => {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("es-EC", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const ESTADOS = { ACTIVO: "Activa", BORRADO: "Eliminada" };

// Lista label/valor de los datos de la cuenta. Compartida por la
// configuración del cliente y la del administrador.
const AccountDetails = ({ user, isLoading }) => {
  const rows = [
    { label: "Nombres", value: user?.firstName },
    { label: "Apellidos", value: user?.lastName },
    { label: "Estado", value: ESTADOS[user?.state] ?? user?.state },
    { label: "Correo", value: user?.email },
    { label: "Actualizado", value: formatDate(user?.apdatedAt) },
  ];

  return (
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
  );
};

export default AccountDetails;
