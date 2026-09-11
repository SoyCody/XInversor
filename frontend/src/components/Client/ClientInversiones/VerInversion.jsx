import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { verInversion } from "../../../services/investmentApi.js";
import { useFetch } from "../../../hooks/useFetch";
import { formatUsd, formatBtc } from "../../../utils/format.js";
import ClientSideBar from "../../SideBar/ClientSideBar.jsx";
import Header from "../../Header/Header.jsx";
import NuevaSolicitudForm from "../ClientSolicitudes/NuevaSolicitud.jsx";
import "../../../App.css";
import "../../DataTable/DataTable.css";
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
          <button
            type="button"
            className="btn btn--muted btn--back"
            onClick={() => navigate(-1)}
          >
            ← Volver
          </button>

          <div className="page-heading">
            <div>
              <h1>Detalle de la inversión</h1>
              <p>Información completa de la inversión seleccionada</p>
            </div>
          </div>

          {error && <p className="dashboard-error">{error}</p>}
          {successMsg && <p className="form-success">{successMsg}</p>}

          {isLoading ? (
            <p>Cargando inversión...</p>
          ) : !inversion ? (
            <p>No se encontró información de esta inversión.</p>
          ) : (
            <>
              <section className="section-band detail-list">
                <div className="detail-row">
                  <span className="detail-label">Monto invertido (USD)</span>
                  <span className="detail-value">{formatUsd(inversion.monto)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Intereses generados (BTC)</span>
                  <span className="detail-value">{formatBtc(inversion.intereses)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Total a retirar (BTC)</span>
                  <span className="detail-value">{formatBtc(inversion.total)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Días transcurridos</span>
                  <span className="detail-value">{inversion.dias}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Estado</span>
                  <span className="detail-value">
                    {ESTADO_INVERSION[inversion.estado] ?? inversion.estado}
                  </span>
                </div>
                {inversion.estado === "PENDIENTE" && (
                  <div className="detail-row">
                    <span className="detail-label">Días para habilitar retiros</span>
                    <span className="detail-value">{inversion.diasParaHabilitar}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-label">Creada</span>
                  <span className="detail-value">{formatDateTime(inversion.createdAt)}</span>
                </div>
              </section>

              {inversion.puedeSolicitarRetiro && !isSolicitando && (
                <div className="section-band form-actions section-actions">
                  <button
                    type="button"
                    className="btn btn--primary"
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
                <div className="section-band inversion-solicitud-form">
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

              <section className="section-band inversion-bloque">
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
                  <div className="data-table-wrap">
                    <table className="data-table">
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
      </main>
    </div>
  );
};

export default VerInversion;
