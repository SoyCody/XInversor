import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { verCliente, blockClient } from "../../../services/adminApi.js";
import { getAvatarUrl } from "../../../services/authApi.js";
import { useFetch } from "../../../hooks/useFetch";
import { formatBtc } from "../../../utils/format.js";
import AdminSideBar from "../../SideBar/AdminSideBar.jsx";
import Header from "../../Header/Header.jsx";
import Pagination from "../../Pagination/Pagination.jsx";
import ConfirmActionModal from "../../Config/ConfirmActionModal.jsx";
import WalletDisplay from "../../Config/WalletDisplay.jsx";
import "../../../App.css";
import "../../DataTable/DataTable.css";
import "../../Config/config.css";
import "./VerCliente.css";

const FILTROS_INVERSION = [
  { value: "ALL", label: "Todas" },
  { value: "PENDIENTE", label: "Pendientes" },
  { value: "EN_ESPERA", label: "En espera" },
  { value: "EN_PROGRESO", label: "En progreso" },
  { value: "RECHAZADO", label: "Rechazadas" },
  { value: "RETIRADO", label: "Retiradas" },
];

const ESTADO_LABEL = {
  PENDIENTE: "Pendiente",
  EN_ESPERA: "En espera",
  EN_PROGRESO: "En progreso",
  RECHAZADO: "Rechazada",
  RETIRADO: "Retirada",
};

const ESTADOS_CUENTA = { ACTIVO: "Activa", BORRADO: "Eliminada" };

const formatDate = (isoString) => {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("es-EC", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const VerCliente = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tipo, setTipo] = useState("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useFetch(
    () => verCliente(id, tipo, page),
    [id, tipo, page]
  );

  const cliente = data?.cliente;
  const inversionesData = data?.inversiones;
  const inversiones = inversionesData?.inversiones ?? [];

  const isBlocked = Boolean(cliente?.blocked);
  // El bloqueo solo aplica a clientes con la cuenta activa.
  const puedeBloquear = cliente?.role === "CLIENT" && cliente?.state === "ACTIVO";

  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockError, setBlockError] = useState(null);
  const [avatarFallback, setAvatarFallback] = useState(false);

  const cambiarTipo = (value) => {
    setTipo(value);
    setPage(1);
  };

  // Un admin no elimina clientes: solo alterna su bloqueo (backend
  // hace toggle sobre Client.blocked). Tras la acción se refresca el
  // detalle para reflejar el nuevo estado.
  const handleToggleBlock = async () => {
    setIsBlocking(true);
    setBlockError(null);
    try {
      await blockClient(id);
      setIsBlockModalOpen(false);
      setIsBlocking(false);
      refetch();
    } catch (err) {
      setBlockError(err.message);
      setIsBlocking(false);
    }
  };

  return (
    <div className="app">
      <AdminSideBar />

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
              <h1>Detalles del cliente</h1>
              <p>Información completa de la cuenta</p>
            </div>
          </div>

          {error && <p className="dashboard-error">{error}</p>}

          {isLoading ? (
            <p>Cargando cliente...</p>
          ) : !cliente ? (
            <p>No se encontró información de este usuario.</p>
          ) : (
            <>
              {/* Zona B: identidad + datos + foto */}
              <div className="section-band vc-perfil-band">
                <h2 className="vc-nombre">
                  {cliente.firstName} {cliente.lastName}
                </h2>

                <div className="vc-perfil">
                  <dl className="vc-datos detail-list">
                    <div className="detail-row">
                      <dt className="detail-label">Correo</dt>
                      <dd className="detail-value">{cliente.email}</dd>
                    </div>
                    <div className="detail-row">
                      <dt className="detail-label">Estado</dt>
                      <dd className="detail-value">
                        {ESTADOS_CUENTA[cliente.state] ?? cliente.state}
                      </dd>
                    </div>
                    <div className="detail-row">
                      <dt className="detail-label">Registrado</dt>
                      <dd className="detail-value">{formatDate(cliente.createdAt)}</dd>
                    </div>
                    <div className="detail-row">
                      <dt className="detail-label">Actualizado</dt>
                      <dd className="detail-value">{formatDate(cliente.apdatedAt)}</dd>
                    </div>
                  </dl>

                  <div className="vc-foto">
                    {avatarFallback ? (
                      <div className="vc-foto-ph" />
                    ) : (
                      <img
                        src={getAvatarUrl(id, cliente.avatarUpdatedAt)}
                        alt={`Foto de ${cliente.firstName} ${cliente.lastName}`}
                        onError={() => setAvatarFallback(true)}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Solo los CLIENT tienen wallet (vive en el perfil Client);
                  un admin puro nunca la tiene. */}
              {cliente.role === "CLIENT" && (
                <div className="section-band">
                  <div className="page-heading">
                    <div>
                      <h2>Billetera</h2>
                      <p>Identificador de la billetera de bitcoins</p>
                    </div>
                  </div>
                  <WalletDisplay wallet={cliente.wallet} />
                </div>
              )}

              {/* Zona A: título de sección + tabla, a ancho completo */}
              <div className="page-heading vc-inv-heading">
                <div>
                  <h2>Inversiones</h2>
                </div>
                <label className="data-filtro">
                  <span>Ver:</span>
                  <select
                    value={tipo}
                    onChange={(e) => cambiarTipo(e.target.value)}
                  >
                    {FILTROS_INVERSION.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {inversiones.length === 0 ? (
                <p>Este cliente no tiene inversiones para este filtro.</p>
              ) : (
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Dias</th>
                        <th>Total (BTC)</th>
                        <th>Ganancias (BTC)</th>
                        <th>Estado</th>
                        <th className="data-table-actions" aria-label="Acciones" />
                      </tr>
                    </thead>
                    <tbody>
                      {inversiones.map((inversion) => (
                        <tr key={inversion.id}>
                          <td>{inversion.dias}</td>
                          <td>{formatBtc(inversion.total)}</td>
                          <td>{formatBtc(inversion.intereses)}</td>
                          <td>
                            {ESTADO_LABEL[inversion.estado] ?? inversion.estado}
                          </td>
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

              <Pagination
                page={inversionesData?.page ?? 1}
                totalPages={inversionesData?.totalPages ?? 1}
                onChange={setPage}
              />

              {puedeBloquear && (
                <div className="section-band form-actions section-actions">
                  <button
                    type="button"
                    className="btn btn--muted"
                    onClick={() => setIsBlockModalOpen(true)}
                  >
                    {isBlocked ? "Desbloquear" : "Bloquear"}
                  </button>
                </div>
              )}
            </>
          )}

          {isBlockModalOpen && (
            <ConfirmActionModal
              title={isBlocked ? "Desbloquear cliente" : "Bloquear cliente"}
              subtitle={
                isBlocked
                  ? "Confirmación de desbloqueo"
                  : "Confirmación de bloqueo"
              }
              message={
                isBlocked
                  ? "El cliente volverá a tener acceso normal a su cuenta."
                  : "El cliente no podrá operar mientras esté bloqueado. Podrás revertirlo cuando quieras."
              }
              confirmingLabel="Procesando..."
              isBusy={isBlocking}
              error={blockError}
              onClose={() => {
                setIsBlockModalOpen(false);
                setBlockError(null);
              }}
              onConfirm={handleToggleBlock}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default VerCliente;
