import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../../App.css";
import "../../DataTable/DataTable.css";
import ClientSideBar from "../../SideBar/ClientSideBar.jsx";
import Header from "../../Header/Header.jsx";
import Pagination from "../../Pagination/Pagination.jsx";
import NuevaInversionModal from "./NuevaInversionModal.jsx";
import InvestmentOverview from "../ClientDashboard/InvestmentOverview.jsx";
import { misInversiones, resumenInversiones } from "../../../services/investmentApi.js";
import { useFetch } from "../../../hooks/useFetch";
import { formatBtc } from "../../../utils/format.js";

const FILTROS = [
  { value: "ALL", label: "Todas" },
  { value: "PENDIENTE", label: "Pendientes" },
  { value: "EN_PROGRESO", label: "En progreso" },
  { value: "RETIRADO", label: "Retiradas" },
];

const ESTADO_LABEL = {
  PENDIENTE: "Pendiente",
  EN_PROGRESO: "En progreso",
  RETIRADO: "Retirada",
};

const ClientInversiones = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [tipo, setTipo] = useState("ALL");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const navigate = useNavigate();

  // El resumen (tarjetas, barra, gráfico) no depende del filtro/página,
  // solo se vuelve a pedir cuando cambia algo real (una inversión nueva).
  const { data: resumen, isLoading: isResumenLoading } = useFetch(
    resumenInversiones,
    [reloadKey]
  );

  // La tabla sí se vuelve a pedir (de 15 en 15) al cambiar el filtro, la
  // página o tras crear una inversión.
  const { data, isLoading, error } = useFetch(
    () => misInversiones(tipo, page),
    [tipo, page, reloadKey]
  );

  const cambiarTipo = (value) => {
    setTipo(value);
    setPage(1);
  };

  const inversiones = useMemo(() => data?.inversiones ?? [], [data]);

  // El backend rechaza crear una inversión si ya hay `limiteActivas`
  // activas (PENDIENTE o EN_PROGRESO); aquí se refleja deshabilitando
  // el botón para no dejar intentarlo.
  const activas = (resumen?.enProgreso ?? 0) + (resumen?.pendientes ?? 0);
  const limiteActivas = resumen?.limiteActivas ?? 5;
  const limiteAlcanzado = !isResumenLoading && activas >= limiteActivas;

  return (
    <div className="app">
      <ClientSideBar />

      <main className="main">
        <Header />

        <div className="content">
          <div className="page-heading">
            <div>
              <h1>Mis Inversiones</h1>
              <p>Detalle general de todas tus inversiones</p>
            </div>
          </div>

          {error && <p className="dashboard-error">{error}</p>}
          {successMsg && <p className="form-success">{successMsg}</p>}
          {!isCreating && limiteAlcanzado && (
            <p className="dashboard-error">
              Llegaste al máximo de {limiteActivas} inversiones activas. Debes
              esperar a que se retire alguna para crear una nueva.
            </p>
          )}

          {isCreating && (
            <NuevaInversionModal
              onClose={() => setIsCreating(false)}
              onSuccess={() => {
                setIsCreating(false);
                setSuccessMsg("Inversión creada correctamente");
                setPage(1);
                setReloadKey((k) => k + 1);
              }}
            />
          )}

          <InvestmentOverview
            totalInvertido={resumen?.totalInvertido ?? 0}
            totalAcumulado={resumen?.totalAcumulado ?? 0}
            enProgreso={resumen?.enProgreso ?? 0}
            pendientes={resumen?.pendientes ?? 0}
            retiradas={resumen?.retiradas ?? 0}
            limiteActivas={limiteActivas}
            isLoading={isResumenLoading}
            showBreakdown
          />

          <div className="section-band list-toolbar">
            <div className="list-toolbar-left">
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

              <span className="clientes-total">
                Total: <strong>{data?.total ?? inversiones.length}</strong> inversiones
              </span>
            </div>

            <button
              className="btn btn--primary"
              disabled={limiteAlcanzado}
              title={
                limiteAlcanzado
                  ? `Ya tienes ${limiteActivas} inversiones activas, el máximo permitido`
                  : undefined
              }
              onClick={() => {
                setSuccessMsg(null);
                setIsCreating(true);
              }}
            >
              Nueva inversión
            </button>
          </div>

          {isLoading ? (
            <p>Cargando inversiones...</p>
          ) : inversiones.length === 0 ? (
            <p>No tienes inversiones para este filtro.</p>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Días</th>
                    <th>Total (BTC)</th>
                    <th>Intereses (BTC)</th>
                    <th>Estado</th>
                    <th className="data-table-actions" />
                  </tr>
                </thead>
                <tbody>
                  {inversiones.map((inversion) => (
                    <tr key={inversion.id}>
                      <td>{inversion.dias}</td>
                      <td>{formatBtc(inversion.total)}</td>
                      <td>{formatBtc(inversion.intereses)}</td>
                      <td>{ESTADO_LABEL[inversion.estado] ?? inversion.estado}</td>
                      <td className="data-table-actions">
                        <button
                          className="btn btn--primary btn--sm"
                          onClick={() => navigate(`/client/inversiones/${inversion.id}`)}
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
        </div>
      </main>
    </div>
  );
};

export default ClientInversiones;
