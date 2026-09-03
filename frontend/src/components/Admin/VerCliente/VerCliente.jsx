import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { verCliente, blockClient } from "../../../services/adminApi.js";
import { getAvatarUrl } from "../../../services/authApi.js";
import { useFetch } from "../../../hooks/useFetch";
import { formatBtc } from "../../../utils/format.js";
import AdminSideBar from "../../SideBar/AdminSideBar.jsx";
import Header from "../../Header/Header.jsx";
import Pagination from "../../Pagination/Pagination.jsx";
import ConfirmDeleteModal from "../../Auth/ConfirmDeleteModal";
import "../../../App.css";
import "./VerCliente.css";

const FILTROS_INVERSION = [
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

const ROLES = { CLIENT: "Cliente", ADMIN: "Administrador" };
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
          <button type="button" className="vc-back" onClick={() => navigate(-1)}>
            ← Volver
          </button>

          <div className="vc-heading">
            <h1>Detalles del cliente</h1>
            <p>Información completa de la cuenta</p>
          </div>

          {error && <p className="vc-alert">{error}</p>}
          {blockError && <p className="vc-alert">{blockError}</p>}

          {isLoading ? (
            <p className="vc-muted">Cargando cliente...</p>
          ) : !cliente ? (
            <p className="vc-muted">No se encontró información de este usuario.</p>
          ) : (
            <div className="vc-body">
              <h2 className="vc-nombre">
                {cliente.firstName} {cliente.lastName}
              </h2>

              <div className="vc-perfil">
                <dl className="vc-datos">
                  <div className="vc-dato">
                    <dt>Correo</dt>
                    <dd>{cliente.email}</dd>
                  </div>
                  <div className="vc-dato">
                    <dt>Rol</dt>
                    <dd>{ROLES[cliente.role] ?? cliente.role}</dd>
                  </div>
                  <div className="vc-dato">
                    <dt>Estado</dt>
                    <dd>{ESTADOS_CUENTA[cliente.state] ?? cliente.state}</dd>
                  </div>
                  <div className="vc-dato">
                    <dt>Registrado</dt>
                    <dd>{formatDate(cliente.createdAt)}</dd>
                  </div>
                  <div className="vc-dato">
                    <dt>Actualizado</dt>
                    <dd>{formatDate(cliente.apdatedAt)}</dd>
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

              <section className="vc-inversiones">
                <h3>Inversiones</h3>

                <label className="vc-inv-filtro">
                  Ver:
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

                {inversiones.length === 0 ? (
                  <p className="vc-muted">
                    Este cliente no tiene inversiones para este filtro.
                  </p>
                ) : (
                  <div className="vc-tabla-wrap">
                    <table className="vc-tabla">
                      <thead>
                        <tr>
                          <th>Dias</th>
                          <th>Total (BTC)</th>
                          <th>Intereses (BTC)</th>
                          <th>Estado</th>
                          <th aria-label="Acciones" />
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
                            <td>
                              <button
                                type="button"
                                className="vc-detalles-btn"
                                title="Próximamente"
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
              </section>

              {puedeBloquear && (
                <div className="vc-acciones">
                  <button
                    type="button"
                    className="vc-bloquear-btn"
                    onClick={() => setIsBlockModalOpen(true)}
                  >
                    {isBlocked ? "Desbloquear" : "Bloquear"}
                  </button>
                </div>
              )}
            </div>
          )}

          {isBlockModalOpen && (
            <ConfirmDeleteModal
              isDeleting={isBlocking}
              title={
                isBlocked ? "¿Desbloquear a este cliente?" : "¿Bloquear a este cliente?"
              }
              message={
                isBlocked
                  ? "El cliente volverá a tener acceso normal a su cuenta."
                  : "El cliente no podrá operar mientras esté bloqueado. Podrás revertirlo cuando quieras."
              }
              confirmLabel={
                isBlocked ? "Sí, desbloquear cliente" : "Sí, bloquear cliente"
              }
              confirmingLabel="Procesando..."
              onCancel={() => setIsBlockModalOpen(false)}
              onConfirm={handleToggleBlock}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default VerCliente;
