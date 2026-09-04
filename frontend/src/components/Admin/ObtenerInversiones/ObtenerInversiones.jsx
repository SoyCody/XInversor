import { useMemo, useState } from "react";
import { listInversiones } from "../../../services/investmentApi.js";
import { useFetch } from "../../../hooks/useFetch";
import { formatUsd, formatBtc } from "../../../utils/format.js";
import AdminSideBar from "../../SideBar/AdminSideBar.jsx";
import Header from "../../Header/Header.jsx";
import Pagination from "../../Pagination/Pagination.jsx";
import "../../../App.css";
import "../../DataTable/DataTable.css";
import "../ObtenerClientes/ObtenerClientes.css";

const FILTROS = [
  { value: "ALL", label: "Todas", titulo: "Inversiones", descripcion: "Listado de todas las inversiones" },
  { value: "PENDIENTE", label: "Pendientes", titulo: "Inversiones pendientes", descripcion: "En el período de bloqueo de 15 días" },
  { value: "EN_PROGRESO", label: "En progreso", titulo: "Inversiones en progreso", descripcion: "Habilitadas para solicitar retiros" },
  { value: "RETIRADO", label: "Retiradas", titulo: "Inversiones retiradas", descripcion: "Inversiones que el cliente ya retiró" },
];

const ESTADO_LABEL = {
  PENDIENTE: "Pendiente",
  EN_PROGRESO: "En progreso",
  RETIRADO: "Retirada",
};

const ObtenerInversiones = () => {
  const [tipo, setTipo] = useState("ALL");
  const [busqueda, setBusqueda] = useState("");
  const [page, setPage] = useState(1);

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

        <div className="content">
          <div className="page-heading">
            <div>
              <h1>{filtroActual.titulo}</h1>
              <p>{filtroActual.descripcion}</p>
            </div>

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

          {error && <p className="dashboard-error">{error}</p>}

          {isLoading ? (
            <p>Cargando inversiones...</p>
          ) : (
            <>
              <div className="clientes-summary">
                <span className="clientes-total">
                  Total: <strong>{data?.total ?? inversionesFiltradas.length}</strong>
                </span>
              </div>

              {inversionesFiltradas.length === 0 ? (
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
                        <th>Monto (USD)</th>
                        <th>Días</th>
                        <th>Intereses (BTC)</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inversionesFiltradas.map((inversion) => (
                        <tr key={inversion.id}>
                          <td>{inversion.cliente}</td>
                          <td>{formatUsd(inversion.monto)}</td>
                          <td>{inversion.dias}</td>
                          <td>{formatBtc(inversion.intereses)}</td>
                          <td>{ESTADO_LABEL[inversion.estado] ?? inversion.estado}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {!isLoading && (
            <Pagination
              page={data?.page ?? 1}
              totalPages={data?.totalPages ?? 1}
              onChange={setPage}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default ObtenerInversiones;
