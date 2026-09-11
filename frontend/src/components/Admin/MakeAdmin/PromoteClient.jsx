import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { verCliente, promoteToAdmin } from "../../../services/adminApi.js";
import { useFetch } from "../../../hooks/useFetch";
import AdminSideBar from "../../SideBar/AdminSideBar.jsx";
import Header from "../../Header/Header.jsx";
import ConfirmActionModal from "../../Config/ConfirmActionModal.jsx";
import "../../../App.css";

const PromoteClient = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useFetch(() => verCliente(id), [id]);
  const [isPromoting, setIsPromoting] = useState(false);
  const [promoteError, setPromoteError] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const cliente = data?.cliente;

  const handleConfirm = async () => {
    setIsPromoting(true);
    setPromoteError(null);
    try {
      await promoteToAdmin(id);
      navigate("/admin/clientes", { replace: true });
    } catch (err) {
      setPromoteError(err.message);
      setIsPromoting(false);
    }
  };

  return (
    <div className="app">
      <AdminSideBar />

      <main className="main">
        <Header />

        <div className="content">
          <div className="page-heading">
            <div>
              <h1>Asignar administración</h1>
              <p>Confirma el ascenso de este cliente a administrador</p>
            </div>
          </div>

          {error && <p className="dashboard-error">{error}</p>}
          {promoteError && <p className="dashboard-error">{promoteError}</p>}

          {isLoading ? (
            <p>Cargando cliente...</p>
          ) : !cliente ? (
            <p>No se encontró información de este cliente.</p>
          ) : (
            <div className="section-band">
              <div className="detail-list">
                <div className="detail-row">
                  <span className="detail-label">Nombre</span>
                  <span className="detail-value">{cliente.firstName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Apellido</span>
                  <span className="detail-value">{cliente.lastName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Correo</span>
                  <span className="detail-value">{cliente.email}</span>
                </div>
              </div>

              <div className="form-actions section-actions">
                <button
                  type="button"
                  className="btn btn--muted"
                  onClick={() => navigate("/admin/solicitudes")}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => setIsConfirmOpen(true)}
                >
                  Asignar administración
                </button>
              </div>
            </div>
          )}

          {isConfirmOpen && (
            <ConfirmActionModal
              title="Otorgar permisos de administración"
              subtitle="Confirmación de ascenso"
              message="Esta acción es permanente y no se puede deshacer. Este nuevo administrador también podrá supervisar la plataforma."
              confirmLabel="Sí, asignar esta cuenta"
              confirmingLabel="Procesando..."
              isBusy={isPromoting}
              error={promoteError}
              onClose={() => setIsConfirmOpen(false)}
              onConfirm={handleConfirm}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default PromoteClient;
