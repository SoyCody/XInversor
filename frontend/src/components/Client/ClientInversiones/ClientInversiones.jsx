import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../../App.css";
import "../ClientGetMe/ClientGetMe.css";
import "../../Admin/ObtenerClientes/ObtenerClientes.css";
import ClientSideBar from "../../SideBar/ClientSideBar.jsx";
import Header from "../../Header/Header.jsx";
import Pagination from "../../Pagination/Pagination.jsx";
import NuevaInversionForm from "./NuevaInversionForm.jsx";
import { misInversiones } from "../../../services/investmentApi.js";
import { useFetch } from "../../../hooks/useFetch";
import { formatUsd, formatBtc } from "../../../utils/format.js";

const FILTROS = [
  { value: "ALL", label: "Todas", titulo: "Mis inversiones", descripcion: "Todas tus inversiones" },
  { value: "PENDIENTE", label: "Pendientes", titulo: "Inversiones pendientes", descripcion: "En el período de bloqueo de 15 días" },
  { value: "EN_PROGRESO", label: "En progreso", titulo: "Inversiones en progreso", descripcion: "Habilitadas para solicitar retiros" },
  { value: "RETIRADO", label: "Retiradas", titulo: "Inversiones retiradas", descripcion: "Las que ya retiraste" },
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

  // Se vuelve a pedir la lista (de 20 en 20) al cambiar el filtro, la
  // página o tras crear una inversión.
  const { data, isLoading, error } = useFetch(
    () => misInversiones(tipo, page),
    [tipo, page, reloadKey]
  );

  const cambiarTipo = (value) => {
    setTipo(value);
    setPage(1);
  };

  const filtroActual = FILTROS.find((f) => f.value === tipo) ?? FILTROS[0];
  const inversiones = useMemo(() => data?.inversiones ?? [], [data]);

  return (
    <div className="app">
      <ClientSideBar />

      <main className="main">
        <Header />

        <div className="content">
          <div className="page-heading">
            <div>
              <h1>{filtroActual.titulo}</h1>
              <p>{filtroActual.descripcion}</p>
            </div>

            {!isCreating && (
              <div className="clientes-controls">
                <label className="clientes-filtro">
                  <span>Ver:</span>
                  <select value={tipo} onChange={(e) => cambiarTipo(e.target.value)}>
                    {FILTROS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  className="edit-profile-btn"
                  onClick={() => {
                    setSuccessMsg(null);
                    setIsCreating(true);
                  }}
                >
                  Nueva Inversión
                </button>
              </div>
            )}
          </div>

          {successMsg && <p className="edit-avatar-success">{successMsg}</p>}
          {error && <p className="dashboard-error">{error}</p>}

          {isCreating ? (
            <NuevaInversionForm
              onCancel={() => setIsCreating(false)}
              onSuccess={() => {
                setIsCreating(false);
                setSuccessMsg("Inversión creada correctamente");
                setPage(1);
                setReloadKey((k) => k + 1);
              }}
            />
          ) : isLoading ? (
            <p>Cargando inversiones...</p>
          ) : (
            <>
              <div className="clientes-summary">
                <span className="clientes-total">
                  Total: <strong>{data?.total ?? inversiones.length}</strong>
                </span>
              </div>

              {inversiones.length === 0 ? (
                <p>No tienes inversiones para este filtro.</p>
              ) : (
                <div className="clientes-table-wrapper">
                  <table className="clientes-table">
                    <thead>
                      <tr>
                        <th>Monto (USD)</th>
                        <th>Días</th>
                        <th>Intereses (BTC)</th>
                        <th>Estado</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {inversiones.map((inversion) => (
                        <tr key={inversion.id}>
                          <td>{formatUsd(inversion.monto)}</td>
                          <td>{inversion.dias}</td>
                          <td>{formatBtc(inversion.intereses)}</td>
                          <td>{ESTADO_LABEL[inversion.estado] ?? inversion.estado}</td>
                          <td>
                            <button
                              className="edit-profile-btn"
                              onClick={() => navigate(`/client/inversiones/${inversion.id}`)}
                            >
                              Ver detalles
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {!isCreating && !isLoading && (
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
