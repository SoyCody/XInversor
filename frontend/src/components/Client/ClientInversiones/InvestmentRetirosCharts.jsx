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

// Mismo redondeo a 2 decimales que formatBtc en el resto de la app.
const formatEje = (value) => value.toFixed(2);

const tooltipStyle = {
  fontFamily: "var(--font)",
  fontSize: 12,
  borderRadius: 8,
  border: "1px solid var(--input-border)",
};

// Un retiro sale siempre 100% de los intereses generados (el capital
// invertido nunca se retira -- ver investment.service.js#approve): no
// hay una "parte de interés" distinta del monto pedido que calcular, el
// monto de la solicitud YA ES el interés retirado.
// `mostrarResumen` en false oculta el segundo gráfico (barras de
// intereses/retirado/disponible): lo usa el detalle de administrador,
// que solo necesita "Retiros en tiempo".
const InvestmentRetirosCharts = ({ solicitudes, intereses, total, estado, mostrarResumen = true }) => {
  const totalNum = Number(total);
  const interesesNum = Number(intereses);

  // Solo las solicitudes ACEPTADAS representan un retiro real: mientras
  // esté PENDIENTE (o si termina RECHAZADA) el dinero nunca se movió, así
  // que mostrarla acá daría a entender que el retiro ya se hizo cuando en
  // realidad un administrador todavía no lo aprueba. La fecha del punto
  // es cuándo se resolvió (resueltaEn), no cuándo se pidió.
  const porRetiro = solicitudes
    .filter((s) => s.estado === "ACEPTADA")
    .sort((a, b) => new Date(a.resueltaEn) - new Date(b.resueltaEn))
    .map((s) => ({
      fecha: formatFechaCorta(s.resueltaEn),
      estado: s.estado,
      monto: Number(s.montoRetiro),
    }));

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
            <p>Monto retirado en cada solicitud</p>
          </div>
        </div>

        {porRetiro.length === 0 ? (
          <p className="retiros-chart-empty">
            {estado === "RETIRADO"
              ? "Esta inversión fue retirada sin registrar solicitudes individuales."
              : "Todavía no se ha aprobado ningún retiro para esta inversión."}
          </p>
        ) : (
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
                name="Monto retirado"
                stroke={COLOR_TOTAL}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
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
