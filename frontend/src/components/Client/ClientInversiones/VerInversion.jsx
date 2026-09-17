import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { verInversion } from "../../../services/investmentApi.js";
import { useFetch } from "../../../hooks/useFetch";
import { formatBtc } from "../../../utils/format.js";
import ClientSideBar from "../../SideBar/ClientSideBar.jsx";
import Header from "../../Header/Header.jsx";
import NuevaSolicitudModal from "../ClientSolicitudes/NuevaSolicitudModal.jsx";
import BlockedActionModal from "../../Config/BlockedActionModal.jsx";
import SuccessBanner from "../../SuccessBanner/SuccessBanner.jsx";
import InvestmentStatusProgress from "./InvestmentStatusProgress.jsx";
import InvestmentRetirosCharts from "./InvestmentRetirosCharts.jsx";
import { isBlockedError } from "../../../utils/blockedError.js";
import "../../../App.css";
import "../../DataTable/DataTable.css";
import "./VerInversion.css";

const formatDate = (isoString) => {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("es-EC", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

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
  EN_ESPERA: "En espera",
  EN_PROGRESO: "En progreso",
  RECHAZADO: "Rechazada",
  RETIRADO: "Retirada",
};

// Solo para el título de arriba ("Inversión ..."): a diferencia de
// ESTADO_INVERSION (que se usa tal cual en el historial), acá RETIRADO
// se lee "en retirada" para que las variantes queden parejas.
const TITULO_ESTADO = {
  PENDIENTE: "pendiente",
  EN_ESPERA: "en espera",
  EN_PROGRESO: "en progreso",
  RECHAZADO: "rechazada",
  RETIRADO: "en retirada",
};

// Solo EN_PROGRESO y RETIRADO tienen actividad de retiros que mostrar:
// PENDIENTE (esperando revisión del admin), EN_ESPERA (en el período de
// bloqueo) y RECHAZADO (terminal) nunca tuvieron ni pueden tener
// solicitudes de retiro.
const tieneActividadDeRetiros = (estado) => estado === "EN_PROGRESO" || estado === "RETIRADO";

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
  const [blockedModalDismissed, setBlockedModalDismissed] = useState(false);

  const inversion = data?.inversion;
  const isBlocked = isBlockedError(error);
  const showBlockedModal = isBlocked && !blockedModalDismissed;

  return (
    <div className="app">
      <ClientSideBar />

      <main className="main">
        <Header />

        <SuccessBanner message={successMsg} onClose={() => setSuccessMsg(null)} />

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

          {error && !isBlocked && <p className="dashboard-error">{error}</p>}

          {showBlockedModal && (
            <BlockedActionModal
              message="Tu cuenta está bloqueada: no puedes ver el detalle de esta inversión ni solicitar retiros mientras el bloqueo esté activo."
              onClose={() => {
                setBlockedModalDismissed(true);
                navigate(-1);
              }}
            />
          )}

          {isLoading ? (
            <p>Cargando inversión...</p>
          ) : !inversion ? (
            <p>No se encontró información de esta inversión.</p>
          ) : (
            <>
              {/* Zona B (como InvestmentOverview en "Mis inversiones"):
                  banda centrada y angosta para el título de estado + los
                  detalles, que van "más adentro" que los encabezados,
                  tablas y gráficos de abajo. */}
              <section className="section-band inversion-resumen">
                <h2 className="inversion-resumen-estado">
                  Inversión {TITULO_ESTADO[inversion.estado] ?? inversion.estado.toLowerCase()}
                </h2>

                <div className="detail-list">
                  <div className="detail-row">
                    <span className="detail-label">Monto invertido (BTC)</span>
                    <span className="detail-value">{formatBtc(inversion.monto)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Intereses generados (BTC)</span>
                    <span className="detail-value">{formatBtc(inversion.intereses)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Total acumulado (BTC)</span>
                    <span className="detail-value">{formatBtc(inversion.total)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Creada</span>
                    <span className="detail-value">{formatDate(inversion.createdAt)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Actualizado</span>
                    <span className="detail-value">
                      {formatDate(inversion.historialEstados[0]?.fecha ?? inversion.createdAt)}
                    </span>
                  </div>
                </div>

                {inversion.estado === "EN_ESPERA" && (
                  <InvestmentStatusProgress
                    dias={inversion.dias}
                    diasParaHabilitar={inversion.diasParaHabilitar}
                  />
                )}
              </section>

              {inversion.puedeSolicitarRetiro && (
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

              {/* Zona A (como el título y la tabla de "Mis inversiones"):
                  ancho completo de .content -- los gráficos van grandes,
                  no metidos en la banda angosta de arriba. */}
              {tieneActividadDeRetiros(inversion.estado) && (
                <InvestmentRetirosCharts
                  solicitudes={inversion.solicitudes}
                  intereses={inversion.intereses}
                  total={inversion.total}
                  estado={inversion.estado}
                />
              )}

              {isSolicitando && (
                <NuevaSolicitudModal
                  inversionId={inversion.id}
                  disponible={formatBtc(inversion.intereses)}
                  onClose={() => setIsSolicitando(false)}
                  onSuccess={() => {
                    setIsSolicitando(false);
                    setSuccessMsg("Solicitud de retiro enviada. Un administrador la revisará.");
                    refetch();
                  }}
                />
              )}

              {/* Solo EN_PROGRESO/RETIRADO pueden tener solicitudes de
                  retiro (el backend las rechaza en cualquier otro
                  estado), así que no tiene sentido mostrar esta sección
                  para después decir "no tiene solicitudes". */}
              {tieneActividadDeRetiros(inversion.estado) && (
                <>
                  <div className="page-heading page-heading--section">
                    <div>
                      <h1>Solicitudes de retiro</h1>
                      <p>Detalles de cada retiro</p>
                    </div>
                  </div>
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
                </>
              )}

              <div className="page-heading page-heading--section">
                <div>
                  <h1>Historial de estados</h1>
                  <p>Registro del ciclo de vida de tu inversión</p>
                </div>
              </div>
              <section className="section-band">
                <div className="detail-list">
                  {inversion.historialEstados.map((h, i) => (
                    <div className="detail-row" key={i}>
                      <span className="detail-label">{ESTADO_INVERSION[h.estado] ?? h.estado}</span>
                      <span className="detail-value">{formatDateTime(h.fecha)}</span>
                    </div>
                  ))}
                </div>
              </section>
              </>
            )}
        </div>
      </main>
    </div>
  );
};

export default VerInversion;
