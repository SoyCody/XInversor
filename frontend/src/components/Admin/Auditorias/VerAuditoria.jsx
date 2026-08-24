import { useParams, useNavigate } from "react-router-dom";
import { verAuditoria } from "../../../services/auditApi.js";
import { useFetch } from "../../../hooks/useFetch";
import AdminSideBar from "../../SideBar/AdminSideBar.jsx";
import Header from "../../Header/Header.jsx";
import "../../../App.css";
import "./Auditorias.css";

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
          <button type="button" className="back-btn" onClick={() => navigate(-1)}>
            ← Volver
          </button>

          <div className="page-heading">
            <div>
              <h1>Detalle de la auditoría</h1>
              <p>Información completa del registro</p>
            </div>
          </div>

          <div className="detalle-center">
            {error && <p className="dashboard-error">{error}</p>}

            {isLoading ? (
              <p>Cargando auditoría...</p>
            ) : !auditoria ? (
              <p>No se encontró información de esta auditoría.</p>
            ) : (
              <section className="cliente-detalle-card">
                <div className="cliente-detalle-row">
                  <span className="cliente-detalle-label">Usuario</span>
                  <span className="cliente-detalle-value">{auditoria.nombre}</span>
                </div>
                <div className="cliente-detalle-row">
                  <span className="cliente-detalle-label">Rol</span>
                  <span className="cliente-detalle-value">{auditoria.rol}</span>
                </div>
                <div className="cliente-detalle-row">
                  <span className="cliente-detalle-label">Correo</span>
                  <span className="cliente-detalle-value">{auditoria.correo}</span>
                </div>
                <div className="cliente-detalle-row">
                  <span className="cliente-detalle-label">Acción</span>
                  <span className="cliente-detalle-value">{auditoria.accion}</span>
                </div>
                <div className="cliente-detalle-row">
                  <span className="cliente-detalle-label">Tabla afectada</span>
                  <span className="cliente-detalle-value">{auditoria.tabla}</span>
                </div>
                <div className="cliente-detalle-row">
                  <span className="cliente-detalle-label">Registro afectado (ID)</span>
                  <span className="cliente-detalle-value">{auditoria.targetId}</span>
                </div>
                <div className="cliente-detalle-row">
                  <span className="cliente-detalle-label">Fecha</span>
                  <span className="cliente-detalle-value">{formatDate(auditoria.createdAt)}</span>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default VerAuditoria;
