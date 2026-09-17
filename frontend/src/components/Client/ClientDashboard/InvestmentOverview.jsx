import { formatBtc } from "../../../utils/format.js";
import "./InvestmentOverview.css";

// Resumen de inversiones del cliente: capital invertido, total acumulado,
// y el cupo de inversiones activas (en progreso / pendientes /
// disponibles) como barra de progreso. Lo usan el inicio ("Inicio") y
// "Mis inversiones" (con `showBreakdown` este último también muestra el
// conteo por estado, incluidas las retiradas).
//
// La barra solo pinta los segmentos "en progreso" y "pendientes" con un
// ancho en % sobre `limiteActivas`; lo que sobra queda como el fondo gris
// del contenedor, que ES el segmento "disponibles" — evita tener que
// calcular y redondear un tercer ancho que siempre debería cerrar en 100%.
const InvestmentOverview = ({
  totalInvertido,
  totalAcumulado,
  enProgreso,
  pendientes,
  retiradas = 0,
  limiteActivas,
  isLoading,
  showBreakdown = false,
}) => {
  const activas = enProgreso + pendientes;
  const cupo = limiteActivas > 0 ? limiteActivas : 1;
  const pctProgreso = (enProgreso / cupo) * 100;
  const pctPendientes = (pendientes / cupo) * 100;

  return (
    <section className="section-band investment-overview">
      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-card-label">Capital invertido</span>
          <span className="stat-card-value">
            {isLoading ? "—" : formatBtc(totalInvertido)}
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Total acumulado</span>
          <span className="stat-card-value">
            {isLoading ? "—" : formatBtc(totalAcumulado)}
          </span>
        </div>
      </div>

      {showBreakdown && (
        <div className="stat-cards stat-cards--breakdown">
          <div className="stat-card stat-card--sm">
            <span className="stat-card-label">Pendientes</span>
            <span className="stat-card-value">{isLoading ? "—" : pendientes}</span>
          </div>
          <div className="stat-card stat-card--sm">
            <span className="stat-card-label">En progreso</span>
            <span className="stat-card-value">{isLoading ? "—" : enProgreso}</span>
          </div>
          <div className="stat-card stat-card--sm">
            <span className="stat-card-label">Retiradas</span>
            <span className="stat-card-value">{isLoading ? "—" : retiradas}</span>
          </div>
        </div>
      )}

      <p className="investment-overview-total">
        Total de inversiones activas: <strong>{activas}/{limiteActivas}</strong>
      </p>

      <div className="investment-overview-legend">
        <span className="legend-item">
          <i className="legend-dot is-progreso" aria-hidden="true" />
          En progreso
        </span>
        <span className="legend-item">
          <i className="legend-dot is-pendientes" aria-hidden="true" />
          Pendientes
        </span>
        <span className="legend-item">
          <i className="legend-dot is-disponibles" aria-hidden="true" />
          Disponibles
        </span>
      </div>

      <div
        className="investment-overview-bar"
        role="img"
        aria-label={`${enProgreso} inversiones en progreso, ${pendientes} pendientes de ${limiteActivas} cupos en total`}
      >
        {enProgreso > 0 && (
          <span
            className="investment-overview-segment is-progreso"
            style={{ width: `${pctProgreso}%` }}
          />
        )}
        {pendientes > 0 && (
          <span
            className="investment-overview-segment is-pendientes"
            style={{ width: `${pctPendientes}%` }}
          />
        )}
      </div>
    </section>
  );
};

export default InvestmentOverview;
