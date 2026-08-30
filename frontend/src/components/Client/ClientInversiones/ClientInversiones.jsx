import { useMemo, useState } from "react";
import "../../../App.css";
import "../ClientGetMe/ClientGetMe.css";
import "../../Admin/ObtenerClientes/ObtenerClientes.css";
import ClientSideBar from "../../SideBar/ClientSideBar.jsx";
import Header from "../../Header/Header.jsx";
import NuevaInversionForm from "./NuevaInversionForm.jsx";
import { misInversiones } from "../../../services/investmentApi.js";
import { useFetch } from "../../../hooks/useFetch";

const FILTROS = [
  { value: "ALL", label: "Todas", titulo: "Mis inversiones", descripcion: "Todas tus inversiones" },
  { value: "EN_PROGRESO", label: "En progreso", titulo: "Inversiones en progreso", descripcion: "Las que siguen activas" },
  { value: "ACEPTADO", label: "Aceptadas", titulo: "Inversiones aceptadas", descripcion: "Aprobadas por un administrador" },
  { value: "RECHAZADO", label: "Rechazadas", titulo: "Inversiones rechazadas", descripcion: "Las que no fueron aprobadas" },
  { value: "RETIRADO", label: "Retiradas", titulo: "Inversiones retiradas", descripcion: "Las que ya retiraste" },
];

const ESTADO_LABEL = {
  EN_PROGRESO: "En progreso",
  ACEPTADO: "Aceptada",
  RECHAZADO: "Rechazada",
  RETIRADO: "Retirada",
};

const formatMoney = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return `$${num.toFixed(2)}`;
};

const ClientInversiones = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [tipo, setTipo] = useState("ALL");
  const [reloadKey, setReloadKey] = useState(0);

  // Se vuelve a pedir la lista al cambiar el filtro o tras crear una inversión.
  const { data, isLoading, error } = useFetch(
    () => misInversiones(tipo),
    [tipo, reloadKey]
  );

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
                  <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
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
                setReloadKey((k) => k + 1);
              }}
            />
          ) : isLoading ? (
            <p>Cargando inversiones...</p>
          ) : (
            <>
              <div className="clientes-summary">
                <span className="clientes-total">
                  Total: <strong>{inversiones.length}</strong>
                </span>
              </div>

              {inversiones.length === 0 ? (
                <p>No tienes inversiones para este filtro.</p>
              ) : (
                <div className="clientes-table-wrapper">
                  <table className="clientes-table">
                    <thead>
                      <tr>
                        <th>Monto</th>
                        <th>Días</th>
                        <th>Intereses generados</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inversiones.map((inversion) => (
                        <tr key={inversion.id}>
                          <td>{formatMoney(inversion.monto)}</td>
                          <td>{inversion.dias}</td>
                          <td>{formatMoney(inversion.intereses)}</td>
                          <td>{ESTADO_LABEL[inversion.estado] ?? inversion.estado}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ClientInversiones;
