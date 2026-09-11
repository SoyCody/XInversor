import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import "./InvestmentBreakdownChart.css";

// Mismos colores que la leyenda/barra de InvestmentOverview.css
// (--accent-teal, --accent-amber) + --purple (ya usado en el panel de
// admin) para "Retiradas". Recharts pinta el `fill` como atributo SVG, no
// como estilo CSS, así que un var(--accent-teal) ahí no siempre resuelve
// entre navegadores -- se repiten los valores en hexadecimal a propósito.
const ESTADOS = [
  { key: "enProgreso", label: "En progreso", color: "#14b8a6" },
  { key: "pendientes", label: "Pendientes", color: "#f5a623" },
  { key: "retiradas", label: "Retiradas", color: "#7354e8" },
];

// Distribución de las inversiones del cliente por estado: complementa a
// la barra de cupo (que solo mira activas vs. disponibles) mostrando la
// proporción real entre las tres, retiradas incluidas.
const InvestmentBreakdownChart = ({ enProgreso, pendientes, retiradas, isLoading }) => {
  const total = enProgreso + pendientes + retiradas;

  const data = ESTADOS.map(({ key, label, color }) => ({
    name: label,
    value: { enProgreso, pendientes, retiradas }[key],
    color,
  })).filter((d) => d.value > 0);

  return (
    <div className="investment-chart">
      <span className="investment-chart-title">Distribución por estado</span>

      {isLoading ? (
        <p className="investment-chart-empty">Cargando...</p>
      ) : total === 0 ? (
        <p className="investment-chart-empty">Todavía no tienes inversiones.</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={52}
              outerRadius={80}
              paddingAngle={data.length > 1 ? 3 : 0}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${value} inversión(es)`, name]}
              contentStyle={{
                fontFamily: "var(--font)",
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid var(--input-border)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default InvestmentBreakdownChart;
