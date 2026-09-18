import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { listInversiones } from "../../../services/investmentApi.js";
import { useFetch } from "../../../hooks/useFetch";
import { formatBtc } from "../../../utils/format.js";
import AdminSideBar from "../../SideBar/AdminSideBar.jsx";
import Header from "../../Header/Header.jsx";
import Pagination from "../../Pagination/Pagination.jsx";
import SuccessBanner from "../../SuccessBanner/SuccessBanner.jsx";
import PorcentajeInteresCard from "./PorcentajeInteresCard.jsx";
import "../../../App.css";
import "../../DataTable/DataTable.css";
import "../../Client/ClientDashboard/InvestmentOverview.css";
import "../../Client/ClientInversiones/InvestmentRetirosCharts.css";
import "../admin-shared.css";

const FILTROS = [
  { value: "ALL", label: "Todas", titulo: "Inversiones", descripcion: "Listado de todas las inversiones" },
  { value: "PENDIENTE", label: "Pendientes", titulo: "Inversiones pendientes", descripcion: "Paquetes a la espera de que un admin los revise" },
  { value: "EN_ESPERA", label: "En espera", titulo: "Inversiones en espera", descripcion: "Aprobadas, en el período de bloqueo de 15 días" },
  { value: "EN_PROGRESO", label: "En progreso", titulo: "Inversiones en progreso", descripcion: "Habilitadas para solicitar retiros" },
  { value: "RECHAZADO", label: "Rechazadas", titulo: "Inversiones rechazadas", descripcion: "Paquetes que un admin rechazó" },
  { value: "RETIRADO", label: "Retiradas", titulo: "Inversiones retiradas", descripcion: "Inversiones que el cliente ya retiró" },
];

const ESTADO_LABEL = {
  PENDIENTE: "Pendiente",
  EN_ESPERA: "En espera",
  EN_PROGRESO: "En progreso",
  RECHAZADO: "Rechazada",
  RETIRADO: "Retirada",
};

// Mismo teal que el resto de gráficos de la app (ver
// InvestmentRetirosCharts.jsx) en vez de una paleta nueva para el panel
// de administración.
const COLOR_LINEA = "#14b8a6"; // --accent-teal

const tooltipStyle = {
  fontFamily: "var(--font)",
  fontSize: 12,
  borderRadius: 8,
  border: "1px solid var(--input-border)",
};

// Los montos son BTC; en el eje alcanza con enteros para que no se
// recorten los números grandes.
const formatEjeMonto = (value) => value.toLocaleString("en-US");

const ObtenerInversiones = () => {
  const navigate = useNavigate();
  const [tipo, setTipo] = useState("ALL");
  const [busqueda, setBusqueda] = useState("");
  const [page, setPage] = useState(1);
  const [successMsg, setSuccessMsg] = useState(null);

  // Al cambiar el filtro o la página el hook vuelve a pedir la lista (de 20 en 20).
  const { data, isLoading, error } = useFetch(
    () => listInversiones(tipo, page),
    [tipo, page]
  );

  const cambiarTipo = (value) => {
    setTipo(value);
    setPage(1);
  };

  const filtroActual = FILTROS.find((f) => f.value === tipo) ?? FILTROS[0];
  const inversionesFiltradas = useMemo(() => {
    const inversiones = data?.inversiones ?? [];
    const q = busqueda.trim().toLowerCase();
    if (!q) return inversiones;
    return inversiones.filter((i) => i.cliente.toLowerCase().includes(q));
  }, [data, busqueda]);

  return (
    <div className="app">
      <AdminSideBar />

      <main className="main">
        <Header />

        <SuccessBanner message={successMsg} onClose={() => setSuccessMsg(null)} />

        <div className="content">
          <div className="page-heading">
            <div>
              <h1>{filtroActual.titulo}</h1>
              <p>{filtroActual.descripcion}</p>
            </div>
          </div>

          {error && <p className="dashboard-error">{error}</p>}

          <section className="section-band stat-cards admin-section-gap">
            <div className="stat-card">
              <span className="stat-card-label">Total</span>
              <span className="stat-card-value">
                {isLoading ? "—" : data?.totalInversiones ?? 0}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-card-label">Total ganancias</span>
              <span className="stat-card-value">
                {isLoading ? "—" : formatBtc(data?.totalIntereses ?? 0)}
              </span>
            </div>
          </section>

          <div className="retiros-charts">
            <div className="retiros-chart-block">
              <div className="page-heading">
                <div>
                  <h1>Capital invertido a través del tiempo</h1>
                  <p>Suma del monto invertido por mes</p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={data?.capitalPorMes ?? []}
                  margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--input-border)" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "var(--muted)" }} />
                  <YAxis
                    tick={{ fontSize: 12, fill: "var(--muted)" }}
                    width={48}
                    tickFormatter={formatEjeMonto}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [`${formatEjeMonto(value)} BTC`, "Capital invertido"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="monto"
                    name="Capital invertido"
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
                  <h1>Inversiones por mes</h1>
                  <p>Cantidad de inversiones creadas por mes</p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={data?.inversionesPorMes ?? []}
                  margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--input-border)" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "var(--muted)" }} />
                  <YAxis tick={{ fontSize: 12, fill: "var(--muted)" }} width={32} allowDecimals={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [value, "Inversiones"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="cantidad"
                    name="Inversiones"
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
          </div>

          <section className="section-band stat-cards admin-section-gap">
            <div className="stat-card">
              <span className="stat-card-label">Inversiones pendientes</span>
              <span className="stat-card-value">
                {isLoading ? "—" : data?.pendientes ?? 0}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-card-label">Inversiones en espera</span>
              <span className="stat-card-value">
                {isLoading ? "—" : data?.enEspera ?? 0}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-card-label">Inversiones en progreso</span>
              <span className="stat-card-value">
                {isLoading ? "—" : data?.enProgreso ?? 0}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-card-label">Inversiones rechazadas</span>
              <span className="stat-card-value">
                {isLoading ? "—" : data?.rechazadas ?? 0}
              </span>
            </div>
          </section>

          {/* Filtro y búsqueda van pegados al total y a la tabla que
              afectan, no arriba junto al título. */}
          <div className="clientes-summary admin-section-gap">
            <span className="clientes-total">
              Total: <strong>{data?.total ?? inversionesFiltradas.length}</strong>
            </span>

            <div className="clientes-controls">
              <label className="data-filtro">
                <span>Ver:</span>
                <select value={tipo} onChange={(e) => cambiarTipo(e.target.value)}>
                  {FILTROS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="search">
                <span className="search-icon" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Buscar por nombre del cliente..."
                  aria-label="Buscar por nombre del cliente"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <p>Cargando inversiones...</p>
          ) : inversionesFiltradas.length === 0 ? (
            <p>
              {busqueda.trim()
                ? "Ninguna inversión coincide con la búsqueda."
                : "No hay inversiones para este filtro."}
            </p>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Ganancias (BTC)</th>
                    <th>Estado</th>
                    <th className="data-table-actions" />
                  </tr>
                </thead>
                <tbody>
                  {inversionesFiltradas.map((inversion) => (
                    <tr key={inversion.id}>
                      <td>{inversion.cliente}</td>
                      <td>{formatBtc(inversion.intereses)}</td>
                      <td>{ESTADO_LABEL[inversion.estado] ?? inversion.estado}</td>
                      <td className="data-table-actions">
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          onClick={() => navigate(`/admin/inversiones/${inversion.id}`)}
                        >
                          Detalles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && (
            <Pagination
              page={data?.page ?? 1}
              totalPages={data?.totalPages ?? 1}
              onChange={setPage}
            />
          )}

          <div className="page-heading admin-section-gap">
            <div>
              <h1>Retiros pendientes</h1>
              <p>Solicitudes de retiro sin resolver</p>
            </div>
          </div>

          {isLoading ? (
            <p>Cargando retiros pendientes...</p>
          ) : (data?.solicitudesPendientes?.length ?? 0) === 0 ? (
            <p>No hay retiros pendientes.</p>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Ganancias (BTC)</th>
                    <th>Solicitado (BTC)</th>
                    <th className="data-table-actions" />
                  </tr>
                </thead>
                <tbody>
                  {data.solicitudesPendientes.map((solicitud) => (
                    <tr key={solicitud.id}>
                      <td>{solicitud.cliente}</td>
                      <td>{formatBtc(solicitud.intereses)}</td>
                      <td>{formatBtc(solicitud.montoRetiro)}</td>
                      <td className="data-table-actions">
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          onClick={() => navigate(`/admin/inversiones/${solicitud.inversionId}`)}
                        >
                          Detalles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <PorcentajeInteresCard onSuccess={setSuccessMsg} />
        </div>
      </main>
    </div>
  );
};

export default ObtenerInversiones;
