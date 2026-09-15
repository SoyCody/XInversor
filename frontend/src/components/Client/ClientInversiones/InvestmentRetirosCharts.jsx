import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatBtc } from "../../../utils/format.js";
import "../../../App.css";
import "../ClientDashboard/InvestmentOverview.css";
import "./InvestmentRetirosCharts.css";

// Mismos tres colores que la leyenda de InvestmentOverview (.legend-dot
// is-progreso / is-pendientes / is-disponibles), en hexadecimal porque
// Recharts pinta fill/stroke como atributo SVG y ahí un var(--accent-teal)
// no siempre resuelve entre navegadores. Reutilizarlos acá (en vez de
// inventar una paleta nueva, como el --purple que tenía antes "Total
// retirado") es lo que permite reusar también el widget de leyenda.
const COLOR_TOTAL = "#14b8a6"; // is-progreso / --accent-teal
const COLOR_INTERES = "#f5a623"; // is-pendientes / --accent-amber
const COLOR_DISPONIBLE = "#9aa3af"; // is-disponibles / --btn-muted

const ESTADO_SOLICITUD = {
  PENDIENTE: "Pendiente",
  ACEPTADA: "Aceptada",
  RECHAZADA: "Rechazada",
};

const formatFechaCorta = (isoString) =>
  new Date(isoString).toLocaleDateString("es-EC", { day: "numeric", month: "short" });

// Los montos son BTC con hasta 8 decimales; en el eje alcanza con 4 para
// que el número quepa sin recortarse.
const formatEje = (value) => value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");

const tooltipStyle = {
  fontFamily: "var(--font)",
  fontSize: 12,
  borderRadius: 8,
  border: "1px solid var(--input-border)",
};

// El interés (10%) se fija al crear la inversión, no se genera retiro a
// retiro; lo que se puede mostrar con honestidad es qué parte de cada
// monto solicitado corresponde a interés, en proporción a cuánto
// representa `intereses` sobre el `total` de la inversión.
// `mostrarResumen` en false oculta el segundo gráfico (barras de
// intereses/retirado/disponible): lo usa el detalle de administrador,
// que solo necesita "Retiros en tiempo".
const InvestmentRetirosCharts = ({ solicitudes, intereses, total, estado, mostrarResumen = true }) => {
  const totalNum = Number(total);
  const interesesNum = Number(intereses);
  const proporcionInteres = totalNum > 0 ? interesesNum / totalNum : 0;

  const porRetiro = [...solicitudes]
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((s) => {
      const monto = Number(s.montoRetiro);
      return {
        fecha: formatFechaCorta(s.createdAt),
        estado: s.estado,
        monto,
        interes: monto * proporcionInteres,
      };
    });

  const retirado = solicitudes
    .filter((s) => s.estado === "ACEPTADA")
    .reduce((acc, s) => acc + Number(s.montoRetiro), 0);
  const disponible = Math.max(0, totalNum - retirado);

  const resumen = [
    { name: "Intereses generados", value: interesesNum, color: COLOR_INTERES },
    { name: "Total retirado", value: retirado, color: COLOR_TOTAL },
    { name: "Disponible", value: disponible, color: COLOR_DISPONIBLE },
  ];

  return (
    <div className="retiros-charts">
      <div className="retiros-chart-block">
        <div className="page-heading">
          <div>
            <h1>Retiros en tiempo</h1>
            <p>Monto total de cada retiro y su parte de interés</p>
          </div>
        </div>

        {porRetiro.length === 0 ? (
          <p className="retiros-chart-empty">
            {estado === "RETIRADO"
              ? "Esta inversión fue retirada sin registrar solicitudes individuales."
              : "Todavía no se han solicitado retiros para esta inversión."}
          </p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={porRetiro} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--input-border)" />
                <XAxis dataKey="fecha" tick={{ fontSize: 12, fill: "var(--muted)" }} />
                <YAxis tick={{ fontSize: 12, fill: "var(--muted)" }} width={64} tickFormatter={formatEje} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => [formatBtc(value), name]}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload
                      ? `${payload[0].payload.fecha} · ${ESTADO_SOLICITUD[payload[0].payload.estado] ?? ""}`
                      : ""
                  }
                />
                <Line
                  type="monotone"
                  dataKey="monto"
                  name="Total"
                  stroke={COLOR_TOTAL}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="interes"
                  name="Intereses"
                  stroke={COLOR_INTERES}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Mismo widget de leyenda que InvestmentOverview (Mis
                inversiones), en vez del <Legend> de Recharts, para no
                mantener dos estilos de leyenda distintos en la app. */}
            <div className="investment-overview-legend">
              <span className="legend-item">
                <i className="legend-dot is-progreso" aria-hidden="true" />
                Total
              </span>
              <span className="legend-item">
                <i className="legend-dot is-pendientes" aria-hidden="true" />
                Intereses
              </span>
            </div>
          </>
        )}
      </div>

      {mostrarResumen && (
        <div className="retiros-chart-block">
          <div className="page-heading">
            <div>
              <h1>Resumen de la inversión (BTC)</h1>
              <p>Intereses, retirado y disponible sobre el total</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={resumen}
              layout="vertical"
              margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--input-border)" />
              <XAxis type="number" tick={{ fontSize: 12, fill: "var(--muted)" }} tickFormatter={formatEje} />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={{ fontSize: 11, fill: "var(--text)" }}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatBtc(value)} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {resumen.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default InvestmentRetirosCharts;
