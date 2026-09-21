import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  verInversionAdmin,
  aprobarSolicitud,
  rechazarSolicitud,
  retirarInversion,
  aprobarPaquete,
  rechazarPaquete,
} from "../../../services/investmentApi.js";
import { useFetch } from "../../../hooks/useFetch";
import { formatBtc } from "../../../utils/format.js";
import AdminSideBar from "../../SideBar/AdminSideBar.jsx";
import Header from "../../Header/Header.jsx";
import SuccessBanner from "../../SuccessBanner/SuccessBanner.jsx";
import ConfirmActionModal from "../../Config/ConfirmActionModal.jsx";
import GestionarSolicitudModal from "./GestionarSolicitudModal.jsx";
import InvestmentStatusProgress from "../../Client/ClientInversiones/InvestmentStatusProgress.jsx";
import InvestmentRetirosCharts from "../../Client/ClientInversiones/InvestmentRetirosCharts.jsx";
import CopyableField from "../../Config/CopyableField.jsx";
import "../../../App.css";
import "../../DataTable/DataTable.css";
import "../../Client/ClientInversiones/VerInversion.css";
import "../../Config/config.css";

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

const ESTADO_SOLICITUD = {
  PENDIENTE: "Pendiente",
  ACEPTADA: "Aceptada",
  RECHAZADA: "Rechazada",
};

// Solo EN_PROGRESO y RETIRADO tienen actividad de retiros que mostrar:
// PENDIENTE (esperando revisión del admin), EN_ESPERA (en el período de
// bloqueo) y RECHAZADO (terminal) nunca tuvieron ni pueden tener
// solicitudes de retiro.
const tieneActividadDeRetiros = (estado) => estado === "EN_PROGRESO" || estado === "RETIRADO";

// Detalle de una inversión para el administrador: mismos componentes que
// "Ver mi inversión" del cliente (ver VerInversion.jsx), pero sobre
// cualquier inversión (no solo las propias), sin las acciones de cliente
// (solicitar retiro), con "Gestionar" en la tabla de solicitudes de
// retiro, y con "Gestionar paquete" cuando la inversión todavía está
// PENDIENTE (aprobarla o rechazarla -- la única decisión que le queda al
// admin sobre un paquete recién creado).
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

  // Terminar (retirar) manualmente una inversión EN_PROGRESO: un solo
  // paso de confirmación, mismo modal que bloquear cliente / eliminar
  // cuenta (ConfirmActionModal).
  const [isRetireModalOpen, setIsRetireModalOpen] = useState(false);
  const [isRetiring, setIsRetiring] = useState(false);
  const [retireError, setRetireError] = useState(null);

  // Aprobar/rechazar el paquete PENDIENTE de esta inversión: mismo flujo
  // de dos pasos que gestionar una solicitud de retiro (reutiliza
  // GestionarSolicitudModal + ConfirmActionModal), pero sobre la
  // inversión misma en vez de una fila de la tabla de solicitudes.
  const [gestionandoPaquete, setGestionandoPaquete] = useState(false);
  const [confirmandoAprobarPaquete, setConfirmandoAprobarPaquete] = useState(false);
  const [isProcessingPaquete, setIsProcessingPaquete] = useState(false);
  const [paqueteError, setPaqueteError] = useState(null);

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

  const cerrarRetireModal = () => {
    if (isRetiring) return;
    setIsRetireModalOpen(false);
    setRetireError(null);
  };

  const handleRetire = async () => {
    setIsRetiring(true);
    setRetireError(null);
    try {
      await retirarInversion(inversion.id);
      setIsRetireModalOpen(false);
      setSuccessMsg("Inversión retirada");
      refetch();
    } catch (err) {
      setRetireError(err.message);
    } finally {
      setIsRetiring(false);
    }
  };

  const abrirGestionarPaquete = () => {
    setPaqueteError(null);
    setConfirmandoAprobarPaquete(false);
    setGestionandoPaquete(true);
  };

  const cerrarGestionarPaquete = () => {
    if (isProcessingPaquete) return;
    setGestionandoPaquete(false);
    setConfirmandoAprobarPaquete(false);
    setPaqueteError(null);
  };

  const handleRechazarPaquete = async () => {
    setIsProcessingPaquete(true);
    setPaqueteError(null);
    try {
      await rechazarPaquete(inversion.id);
      setGestionandoPaquete(false);
      setConfirmandoAprobarPaquete(false);
      setSuccessMsg("Paquete rechazado");
      refetch();
    } catch (err) {
      setPaqueteError(err.message);
    } finally {
      setIsProcessingPaquete(false);
    }
  };

  const handleConfirmarAprobarPaquete = async () => {
    setIsProcessingPaquete(true);
    setPaqueteError(null);
    try {
      await aprobarPaquete(inversion.id);
      setGestionandoPaquete(false);
      setConfirmandoAprobarPaquete(false);
      setSuccessMsg("Paquete aprobado");
      refetch();
    } catch (err) {
      setPaqueteError(err.message);
    } finally {
      setIsProcessingPaquete(false);
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
                    <span className="detail-label">Monto invertido (BTC)</span>
                    <span className="detail-value">{formatBtc(inversion.monto)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Ganancias generadas (BTC)</span>
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

              {tieneActividadDeRetiros(inversion.estado) && (
                <InvestmentRetirosCharts
                  solicitudes={inversion.solicitudes}
                  intereses={inversion.intereses}
                  total={inversion.total}
                  estado={inversion.estado}
                  mostrarResumen={false}
                  segundoBloque={
                    inversion.estado === "EN_PROGRESO" ? (
                      <>
                        <div className="page-heading">
                          <div>
                            <h1>Detalles del cliente</h1>
                            <p>Identificador de la billetera de bitcoins</p>
                          </div>
                        </div>
                        <CopyableField
                          value={inversion.walletCliente}
                          maskable
                          placeholder="Sin billetera registrada"
                        />
                        <CopyableField
                          value={inversion.emailCliente}
                          placeholder="Sin correo registrado"
                        />
                      </>
                    ) : null
                  }
                />
              )}

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

              <div className="section-band form-actions section-actions">
                {inversion.estado === "PENDIENTE" && (
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={abrirGestionarPaquete}
                  >
                    Gestionar paquete
                  </button>
                )}

                {inversion.estado === "EN_PROGRESO" && (
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => setIsRetireModalOpen(true)}
                  >
                    Terminar inversión
                  </button>
                )}

                {/* A diferencia de "Gestionar paquete"/"Terminar inversión"
                    (solo tienen sentido en un estado puntual), "Ver
                    cliente" no cambia nada: se puede ver con cualquier
                    tipo de inversión. */}
                <button
                  type="button"
                  className="btn btn--muted"
                  onClick={() => navigate(`/admin/clientes/${inversion.clienteUserId}`)}
                >
                  Ver cliente
                </button>
              </div>
            </>
          )}

          {gestionando && !confirmandoAprobar && (
            <GestionarSolicitudModal
              message={`Solicitud de retiro por ${gestionando.monto}. Elige si la apruebas o la rechazas.`}
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

          {gestionandoPaquete && !confirmandoAprobarPaquete && (
            <GestionarSolicitudModal
              title="Gestionar paquete"
              subtitle="Aprobar o rechazar"
              message={`Paquete por ${formatBtc(inversion.monto)}. Elige si lo apruebas o lo rechazas.`}
              isBusy={isProcessingPaquete}
              error={paqueteError}
              onClose={cerrarGestionarPaquete}
              onReject={handleRechazarPaquete}
              onApprove={() => {
                setPaqueteError(null);
                setConfirmandoAprobarPaquete(true);
              }}
            />
          )}

          {gestionandoPaquete && confirmandoAprobarPaquete && (
            <ConfirmActionModal
              title="Aprobar paquete"
              subtitle="Confirmación de aprobación"
              message={`¿Estás seguro de aprobar este paquete de ${formatBtc(inversion.monto)}? Pasará a "En espera" y arrancará el período de bloqueo de 15 días.`}
              confirmingLabel="Aprobando..."
              isBusy={isProcessingPaquete}
              error={paqueteError}
              onClose={cerrarGestionarPaquete}
              onConfirm={handleConfirmarAprobarPaquete}
            />
          )}

          {isRetireModalOpen && (
            <ConfirmActionModal
              title="Terminar inversión"
              subtitle="Confirmación de retiro"
              message="¿Estás seguro de retirar esta inversión? Una vez retirada no se admitirán más solicitudes de retiro y esta acción no se puede deshacer."
              confirmingLabel="Retirando..."
              isBusy={isRetiring}
              error={retireError}
              onClose={cerrarRetireModal}
              onConfirm={handleRetire}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default VerInversionAdmin;
