import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  verInversionAdmin,
  aprobarSolicitud,
  rechazarSolicitud,
} from "../../../services/investmentApi.js";
import { useFetch } from "../../../hooks/useFetch";
import { formatUsd, formatBtc } from "../../../utils/format.js";
import AdminSideBar from "../../SideBar/AdminSideBar.jsx";
import Header from "../../Header/Header.jsx";
import SuccessBanner from "../../SuccessBanner/SuccessBanner.jsx";
import ConfirmActionModal from "../../Config/ConfirmActionModal.jsx";
import GestionarSolicitudModal from "./GestionarSolicitudModal.jsx";
import InvestmentStatusProgress from "../../Client/ClientInversiones/InvestmentStatusProgress.jsx";
import InvestmentRetirosCharts from "../../Client/ClientInversiones/InvestmentRetirosCharts.jsx";
import "../../../App.css";
import "../../DataTable/DataTable.css";
import "../../Client/ClientInversiones/VerInversion.css";

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
  EN_PROGRESO: "En progreso",
  RETIRADO: "Retirada",
};

// Solo para el título de arriba ("Inversión ..."): a diferencia de
// ESTADO_INVERSION (que se usa tal cual en el historial), acá RETIRADO
// se lee "en retirada" para que las tres variantes queden parejas.
const TITULO_ESTADO = {
  PENDIENTE: "pendiente",
  EN_PROGRESO: "en progreso",
  RETIRADO: "en retirada",
};

const ESTADO_SOLICITUD = {
  PENDIENTE: "Pendiente",
  ACEPTADA: "Aceptada",
  RECHAZADA: "Rechazada",
};

// Detalle de una inversión para el administrador: mismos componentes que
// "Ver mi inversión" del cliente (ver VerInversion.jsx), pero sobre
// cualquier inversión (no solo las propias), sin las acciones de
// cliente (solicitar retiro) y con "Gestionar" en la tabla de
// solicitudes en vez de eso -- todavía no funcional, solo aparece en
// las solicitudes pendientes.
const VerInversionAdmin = () => {
  const { inversionId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useFetch(
    () => verInversionAdmin(inversionId),
    [inversionId]
  );

  const inversion = data?.inversion;

  // Gestionar una solicitud pendiente es un flujo de dos pasos: primero
  // elegir aprobar/rechazar (GestionarSolicitudModal) y, solo si se elige
  // aprobar, un segundo modal de confirmación (marca la inversión como
  // retirada y no se puede deshacer). Rechazar se aplica directo desde
  // el primer modal.
  const [gestionando, setGestionando] = useState(null); // { id, monto } | null
  const [confirmandoAprobar, setConfirmandoAprobar] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manageError, setManageError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const abrirGestionar = (solicitud) => {
    setManageError(null);
    setConfirmandoAprobar(false);
    setGestionando({ id: solicitud.id, monto: formatBtc(solicitud.montoRetiro) });
  };

  const cerrarGestionar = () => {
    if (isProcessing) return;
    setGestionando(null);
    setConfirmandoAprobar(false);
    setManageError(null);
  };

  const handleRechazar = async () => {
    setIsProcessing(true);
    setManageError(null);
    try {
      await rechazarSolicitud(gestionando.id);
      setGestionando(null);
      setConfirmandoAprobar(false);
      setSuccessMsg("Solicitud de retiro rechazada");
      refetch();
    } catch (err) {
      setManageError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmarAprobar = async () => {
    setIsProcessing(true);
    setManageError(null);
    try {
      await aprobarSolicitud(gestionando.id);
      setGestionando(null);
      setConfirmandoAprobar(false);
      setSuccessMsg("Solicitud de retiro aprobada");
      refetch();
    } catch (err) {
      setManageError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="app">
      <AdminSideBar />

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
              <h1>Detalles de inversión</h1>
              <p>Datos de la inversión y retiros</p>
            </div>
          </div>

          {error && <p className="dashboard-error">{error}</p>}

          {isLoading ? (
            <p>Cargando inversión...</p>
          ) : !inversion ? (
            <p>No se encontró información de esta inversión.</p>
          ) : (
            <>
              <section className="section-band inversion-resumen">
                <h2 className="inversion-resumen-estado">
                  Inversión {TITULO_ESTADO[inversion.estado] ?? inversion.estado.toLowerCase()}
                </h2>

                <div className="detail-list">
                  <div className="detail-row">
                    <span className="detail-label">Monto invertido (USD)</span>
                    <span className="detail-value">{formatUsd(inversion.monto)}</span>
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

                {inversion.estado === "PENDIENTE" && (
                  <InvestmentStatusProgress
                    dias={inversion.dias}
                    diasParaHabilitar={inversion.diasParaHabilitar}
                  />
                )}
              </section>

              {inversion.estado !== "PENDIENTE" && (
                <InvestmentRetirosCharts
                  solicitudes={inversion.solicitudes}
                  intereses={inversion.intereses}
                  total={inversion.total}
                  estado={inversion.estado}
                  mostrarResumen={false}
                />
              )}

              {inversion.estado !== "PENDIENTE" && (
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
                            <th className="data-table-actions" />
                          </tr>
                        </thead>
                        <tbody>
                          {inversion.solicitudes.map((s) => (
                            <tr key={s.id}>
                              <td>{formatBtc(s.montoRetiro)}</td>
                              <td>{ESTADO_SOLICITUD[s.estado] ?? s.estado}</td>
                              <td>{formatDateTime(s.createdAt)}</td>
                              <td>{formatDateTime(s.resueltaEn)}</td>
                              <td className="data-table-actions">
                                {s.estado === "PENDIENTE" && (
                                  <button
                                    type="button"
                                    className="btn btn--primary btn--sm"
                                    onClick={() => abrirGestionar(s)}
                                  >
                                    Gestionar
                                  </button>
                                )}
                              </td>
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
                  <p>Registro del ciclo de vida de la inversión</p>
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

          {gestionando && !confirmandoAprobar && (
            <GestionarSolicitudModal
              monto={gestionando.monto}
              isBusy={isProcessing}
              error={manageError}
              onClose={cerrarGestionar}
              onReject={handleRechazar}
              onApprove={() => {
                setManageError(null);
                setConfirmandoAprobar(true);
              }}
            />
          )}

          {gestionando && confirmandoAprobar && (
            <ConfirmActionModal
              title="Aprobar solicitud de retiro"
              subtitle="Confirmación de aprobación"
              message={`¿Estás seguro de aprobar el retiro de ${gestionando.monto}? La solicitud quedará marcada como retirada y esta acción no se puede deshacer.`}
              confirmingLabel="Aprobando..."
              isBusy={isProcessing}
              error={manageError}
              onClose={cerrarGestionar}
              onConfirm={handleConfirmarAprobar}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default VerInversionAdmin;
