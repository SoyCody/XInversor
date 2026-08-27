import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { verCliente, blockClient } from "../../../services/adminApi.js";
import { getAvatarUrl } from "../../../services/authApi.js";
import { useFetch } from "../../../hooks/useFetch";
import AdminSideBar from "../../SideBar/AdminSideBar.jsx";
import Header from "../../Header/Header.jsx";
import ConfirmDeleteModal from "../../Auth/ConfirmDeleteModal";
import "../../../App.css";
import "./VerCliente.css";

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
  const { data, isLoading, error, refetch } = useFetch(() => verCliente(id), [id]);

  const cliente = data?.cliente;
  const isBlocked = Boolean(cliente?.blocked);

  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockError, setBlockError] = useState(null);

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
          <button type="button" className="back-btn" onClick={() => navigate(-1)}>
            ← Volver
          </button>
          
            <div className="page-heading">
              <div>
                <h1>Detalle del cliente</h1>
                <p>Información completa de la cuenta</p>
              </div>
            </div>
          <div className="vercliente-center">
            {error && <p className="dashboard-error">{error}</p>}
            {blockError && <p className="dashboard-error">{blockError}</p>}

            {isLoading ? (
              <p>Cargando cliente...</p>
            ) : !cliente ? (
              <p>No se encontró información de este cliente.</p>
            ) : (
              <>
                <div className="cliente-avatar-wrapper">
                  <img
                    className="cliente-avatar-large"
                    src={getAvatarUrl(id, cliente.avatarUpdatedAt)}
                    alt="Foto de perfil del cliente"
                  />
                </div>
                <section className="cliente-detalle-card">
                  <div className="cliente-detalle-row">
                    <span className="cliente-detalle-label">Nombre</span>
                    <span className="cliente-detalle-value">{cliente.firstName}</span>
                  </div>
                  <div className="cliente-detalle-row">
                    <span className="cliente-detalle-label">Apellido</span>
                    <span className="cliente-detalle-value">{cliente.lastName}</span>
                  </div>
                  <div className="cliente-detalle-row">
                    <span className="cliente-detalle-label">Correo</span>
                    <span className="cliente-detalle-value">{cliente.email}</span>
                  </div>
                  <div className="cliente-detalle-row">
                    <span className="cliente-detalle-label">Registrado</span>
                    <span className="cliente-detalle-value">{formatDate(cliente.createdAt)}</span>
                  </div>
                  <div className="cliente-detalle-row">
                    <span className="cliente-detalle-label">Última actualización</span>
                    <span className="cliente-detalle-value">{formatDate(cliente.apdatedAt)}</span>
                  </div>
                </section>

                <div className="vercliente-actions">
                  <button
                    type="button"
                    className={isBlocked ? "unblock-client-btn" : "block-client-btn"}
                    onClick={() => setIsBlockModalOpen(true)}
                  >
                    {isBlocked ? "Desbloquear cliente" : "Bloquear cliente"}
                  </button>
                </div>
              </>
            )}
          </div>

          {isBlockModalOpen && (
            <ConfirmDeleteModal
              isDeleting={isBlocking}
              title={isBlocked ? "¿Desbloquear a este cliente?" : "¿Bloquear a este cliente?"}
              message={
                isBlocked
                  ? "El cliente volverá a tener acceso normal a su cuenta."
                  : "El cliente no podrá operar mientras esté bloqueado. Podrás revertirlo cuando quieras."
              }
              confirmLabel={isBlocked ? "Sí, desbloquear cliente" : "Sí, bloquear cliente"}
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