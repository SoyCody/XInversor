import "./InvestmentStatusProgress.css";

// Igual a DIAS_PARA_HABILITAR en backend/src/services/investment.service.js.
// Solo se usa para pintar la barra; el número real (`diasParaHabilitar`)
// siempre viene calculado del backend.
const DIAS_PARA_HABILITAR = 15;

// Solo se renderiza mientras la inversión está EN_ESPERA (el período de
// bloqueo de 15 días que arranca cuando el admin aprueba el paquete): un
// mensaje + una barra de avance. Pasado ese período (EN_PROGRESO /
// RETIRADO) VerInversion muestra en su lugar InvestmentRetirosCharts, con
// los gráficos de retiros e intereses.
const InvestmentStatusProgress = ({ dias, diasParaHabilitar }) => {
  const pct = Math.min(100, (dias / DIAS_PARA_HABILITAR) * 100);

  return (
    <div className="unlock-progress">
      <p className="unlock-progress-text">
        Día <strong>{dias}</strong> de {DIAS_PARA_HABILITAR}
        {diasParaHabilitar > 0 ? (
          <> · faltan <strong>{diasParaHabilitar}</strong> días para poder solicitar un retiro</>
        ) : (
          " · ya puedes solicitar un retiro"
        )}
      </p>
      <div className="unlock-progress-bar">
        <span className="unlock-progress-fill is-pendiente" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export default InvestmentStatusProgress;
