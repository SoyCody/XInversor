import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { verInversion } from "../../../services/investmentApi.js";
import { useFetch } from "../../../hooks/useFetch";
import { formatUsd, formatBtc } from "../../../utils/format.js";
import ClientSideBar from "../../SideBar/ClientSideBar.jsx";
import Header from "../../Header/Header.jsx";
import NuevaSolicitudForm from "../ClientSolicitudes/NuevaSolicitud.jsx";
import "../../../App.css";
import "../../Admin/VerCliente/VerCliente.css";
import "./VerInversion.css";

const formatDateTime = (isoString) => {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleString("es-EC", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ESTADO_INVERSION = {
  PENDIENTE: "Pendiente",
  EN_PROGRESO: "En progreso",
  RETIRADO: "Retirada",
};

const ESTADO_SOLICITUD = {
  PENDIENTE: "Pendiente",
  ACEPTADA: "Aceptada",
  RECHAZADA: "Rechazada",
};

const VerInversion = () => {
  const { inversionId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useFetch(
    () => verInversion(inversionId),
    [inversionId]
  );

  const [isSolicitando, setIsSolicitando] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const inversion = data?.inversion;

  return (
    <div className="app">
      <ClientSideBar />

      <main className="main">
        <Header />

        <div className="content">
          <button type="button" className="back-btn" onClick={() => navigate(-1)}>
            ← Volver
          </button>

          <div className="page-heading">
            <div>
              <h1>Detalle de la inversión</h1>
              <p>Información completa de la inversión seleccionada</p>
            </div>
          </div>

          <div className="vercliente-center">
            {error && <p className="dashboard-error">{error}</p>}
            {successMsg && <p className="edit-avatar-success">{successMsg}</p>}

            {isLoading ? (
              <p>Cargando inversión...</p>
            ) : !inversion ? (
              <p>No se encontró información de esta inversión.</p>
            ) : (
              <>
                <section className="cliente-detalle-card">
                  <div className="cliente-detalle-row">
                    <span className="cliente-detalle-label">Monto invertido (USD)</span>
                    <span className="cliente-detalle-value">{formatUsd(inversion.monto)}</span>
                  </div>
                  <div className="cliente-detalle-row">
                    <span className="cliente-detalle-label">Intereses generados (BTC)</span>
                    <span className="cliente-detalle-value">{formatBtc(inversion.intereses)}</span>
                  </div>
                  <div className="cliente-detalle-row">
                    <span className="cliente-detalle-label">Total a retirar (BTC)</span>
                    <span className="cliente-detalle-value">{formatBtc(inversion.total)}</span>
                  </div>
                  <div className="cliente-detalle-row">
                    <span className="cliente-detalle-label">Días transcurridos</span>
                    <span className="cliente-detalle-value">{inversion.dias}</span>
                  </div>
                  <div className="cliente-detalle-row">
                    <span className="cliente-detalle-label">Estado</span>
                    <span className="cliente-detalle-value">
                      {ESTADO_INVERSION[inversion.estado] ?? inversion.estado}
                    </span>
                  </div>
                  {inversion.estado === "PENDIENTE" && (
                    <div className="cliente-detalle-row">
                      <span className="cliente-detalle-label">Días para habilitar retiros</span>
                      <span className="cliente-detalle-value">{inversion.diasParaHabilitar}</span>
                    </div>
                  )}
                  <div className="cliente-detalle-row">
                    <span className="cliente-detalle-label">Creada</span>
                    <span className="cliente-detalle-value">{formatDateTime(inversion.createdAt)}</span>
                  </div>
                </section>

                {inversion.puedeSolicitarRetiro && !isSolicitando && (
                  <div className="vercliente-actions">
                    <button
                      type="button"
                      className="edit-profile-btn"
                      onClick={() => {
                        setSuccessMsg(null);
                        setIsSolicitando(true);
                      }}
                    >
                      Solicitar retiro
                    </button>
                  </div>
                )}

                {isSolicitando && (
                  <div className="inversion-solicitud-form">
                    <NuevaSolicitudForm
                      inversionId={inversion.id}
                      disponible={formatBtc(inversion.total)}
                      onCancel={() => setIsSolicitando(false)}
                      onSuccess={() => {
                        setIsSolicitando(false);
                        setSuccessMsg("Solicitud de retiro enviada. Un administrador la revisará.");
                        refetch();
                      }}
                    />
                  </div>
                )}

                <section className="inversion-bloque">
                  <h2>Historial de estados</h2>
                  <ul className="inversion-historial">
                    {inversion.historialEstados.map((h, i) => (
                      <li key={i}>
                        <span>{ESTADO_INVERSION[h.estado] ?? h.estado}</span>
                        <span className="inversion-historial-fecha">{formatDateTime(h.fecha)}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="inversion-bloque">
                  <h2>Solicitudes de retiro</h2>
                  {inversion.solicitudes.length === 0 ? (
                    <p>Esta inversión no tiene solicitudes de retiro.</p>
                  ) : (
                    <div className="clientes-table-wrapper">
                      <table className="clientes-table">
                        <thead>
                          <tr>
                            <th>Monto (BTC)</th>
                            <th>Estado</th>
                            <th>Solicitada</th>
                            <th>Resuelta</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inversion.solicitudes.map((s) => (
                            <tr key={s.id}>
                              <td>{formatBtc(s.montoRetiro)}</td>
                              <td>{ESTADO_SOLICITUD[s.estado] ?? s.estado}</td>
                              <td>{formatDateTime(s.createdAt)}</td>
                              <td>{formatDateTime(s.resueltaEn)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default VerInversion;
