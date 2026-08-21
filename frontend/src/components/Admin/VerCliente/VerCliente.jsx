import { useParams, useNavigate } from "react-router-dom";
import { verCliente } from "../../../services/adminApi.js";
import { useFetch } from "../../../hooks/useFetch";
import AdminSideBar from "../../SideBar/AdminSideBar.jsx";
import Header from "../../Header/Header.jsx";
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
  const { data, isLoading, error } = useFetch(() => verCliente(id), [id]);

  const cliente = data?.cliente;

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

            {isLoading ? (
              <p>Cargando cliente...</p>
            ) : !cliente ? (
              <p>No se encontró información de este cliente.</p>
            ) : (
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
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default VerCliente;