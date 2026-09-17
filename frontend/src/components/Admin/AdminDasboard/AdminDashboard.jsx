import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import AdminSideBar from "../../SideBar/AdminSideBar.jsx";
import Header from "../../Header/Header";
import { useFetch } from "../../../hooks/useFetch";
import { getAdminDashboard } from "../../../services/adminApi";
import { formatBtc } from "../../../utils/format.js";
import "../../../App.css";
import "../../Client/ClientDashboard/InvestmentOverview.css";
import "../../Client/ClientInversiones/InvestmentRetirosCharts.css";
import "../admin-shared.css";

// Mismo teal que usa el resto de gráficos de la app (ver
// InvestmentRetirosCharts.jsx) en vez de una paleta nueva para el panel
// de administración.
const COLOR_LINEA = "#14b8a6"; // --accent-teal

const tooltipStyle = {
  fontFamily: "var(--font)",
  fontSize: 12,
  borderRadius: 8,
  border: "1px solid var(--input-border)",
};

const formatFecha = (isoString) => {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("es-EC", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const AdminDashboard = () => {
  const { data, isLoading, error } = useFetch(getAdminDashboard);

  return (
    <div className="app">
      <AdminSideBar />
      <main className="main">
        <Header />
        <div className="content">
          <div className="page-heading">
            <div>
              <h1>Panel de administración</h1>
              <p>Resumen actualizado de usuarios e inversiones</p>
            </div>
          </div>

          {error && <p className="dashboard-error">{error}</p>}

          <section className="section-band stat-cards admin-section-gap">
            <div className="stat-card">
              <span className="stat-card-label">Clientes</span>
              <span className="stat-card-value">
                {isLoading ? "—" : data?.totalClients ?? 0}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-card-label">Inversiones en progreso</span>
              <span className="stat-card-value">
                {isLoading ? "—" : data?.enProgreso ?? 0}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-card-label">Capital invertido</span>
              <span className="stat-card-value">
                {isLoading ? "—" : formatBtc(data?.capitalInvertido ?? 0)}
              </span>
            </div>
          </section>

          <div className="retiros-charts">
            <div className="retiros-chart-block">
              <div className="page-heading">
                <div>
                  <h1>Clientes registrados por mes</h1>
                  <p>Aceleración o desaceleración de la captación</p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={data?.clientesPorMes ?? []}
                  margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--input-border)" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "var(--muted)" }} />
                  <YAxis tick={{ fontSize: 12, fill: "var(--muted)" }} width={32} allowDecimals={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [value, "Clientes"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="clientes"
                    name="Clientes"
                    stroke={COLOR_LINEA}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    isAnimationActive={true}
                    animationDuration={600}
                    animationEasing="ease-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="retiros-chart-block">
              <div className="page-heading">
                <div>
                  <h1>Últimos clientes registrados</h1>
                  <p>Los 5 registros más recientes</p>
                </div>
              </div>

              {isLoading ? (
                <p>Cargando...</p>
              ) : !data?.ultimosClientes?.length ? (
                <p>Todavía no hay clientes registrados.</p>
              ) : (
                <div className="detail-list">
                  {data.ultimosClientes.map((cliente) => (
                    <div className="detail-row" key={cliente.id}>
                      <span className="detail-label">
                        {cliente.firstName} {cliente.lastName}
                      </span>
                      <span className="detail-value">{formatFecha(cliente.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <section className="section-band stat-cards admin-section-gap">
            <div className="stat-card">
              <span className="stat-card-label">Retiros pendientes</span>
              <span className="stat-card-value">
                {isLoading ? "—" : data?.retirosPendientes ?? 0}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-card-label">Promedio clientes por inversión</span>
              <span className="stat-card-value">
                {isLoading ? "—" : (data?.promedioInversionesPorCliente ?? 0).toFixed(1)}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-card-label">Media clientes por inversión</span>
              <span className="stat-card-value">
                {isLoading ? "—" : (data?.medianaInversionesPorCliente ?? 0).toFixed(1)}
              </span>
            </div>
          </section>

          <div className="page-heading page-heading--section">
            <div>
              <h1>Últimos retiros aprobados</h1>
              <p>Las 5 solicitudes de retiro resueltas más recientes</p>
            </div>
          </div>
          <section className="section-band">
            {isLoading ? (
              <p>Cargando...</p>
            ) : !data?.ultimosRetiros?.length ? (
              <p>Todavía no hay retiros aprobados.</p>
            ) : (
              <div className="detail-list">
                {data.ultimosRetiros.map((retiro) => (
                  <div className="detail-row" key={retiro.id}>
                    <span className="detail-label">{formatBtc(retiro.monto)}</span>
                    <span className="detail-value">{formatFecha(retiro.resueltaEn)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
