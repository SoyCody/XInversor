import { useParams, useNavigate } from "react-router-dom";
import { verAuditoria } from "../../../services/auditApi.js";
import { useFetch } from "../../../hooks/useFetch";
import AdminSideBar from "../../SideBar/AdminSideBar.jsx";
import Header from "../../Header/Header.jsx";
import "../../../App.css";

const formatDate = (isoString) => {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("es-EC", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const VerAuditoria = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useFetch(() => verAuditoria(id), [id]);

  const auditoria = data?.auditoria;

  return (
    <div className="app">
      <AdminSideBar />

      <main className="main">
        <Header />

        <div className="content">
          <button type="button" className="btn btn--muted btn--back" onClick={() => navigate(-1)}>
            ← Volver
          </button>

          <div className="page-heading">
            <div>
              <h1>Detalle de la auditoría</h1>
              <p>Información completa del registro</p>
            </div>
          </div>

          {error && <p className="dashboard-error">{error}</p>}

          {isLoading ? (
            <p>Cargando auditoría...</p>
          ) : !auditoria ? (
            <p>No se encontró información de esta auditoría.</p>
          ) : (
            <section className="section-band detail-list">
              <div className="detail-row">
                <span className="detail-label">Usuario</span>
                <span className="detail-value">{auditoria.nombre}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Rol</span>
                <span className="detail-value">{auditoria.rol}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Correo</span>
                <span className="detail-value">{auditoria.correo}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Acción</span>
                <span className="detail-value">{auditoria.accion}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Tabla afectada</span>
                <span className="detail-value">{auditoria.tabla}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Registro afectado (ID)</span>
                <span className="detail-value">{auditoria.targetId}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Fecha</span>
                <span className="detail-value">{formatDate(auditoria.createdAt)}</span>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default VerAuditoria;
