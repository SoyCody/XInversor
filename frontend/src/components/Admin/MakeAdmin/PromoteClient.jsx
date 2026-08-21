import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { verCliente, promoteToAdmin } from "../../../services/adminApi.js";
import { useFetch } from "../../../hooks/useFetch";
import AdminSideBar from "../../SideBar/AdminSideBar.jsx";
import Header from "../../Header/Header.jsx";
import ConfirmAdministracion from "./ConfirmAdministracion.jsx";
import "../../../App.css";
import "./MakeAdmin.css";

const PromoteClient = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useFetch(() => verCliente(id), [id]);
  const [isPromoting, setIsPromoting] = useState(false);
  const [promoteError, setPromoteError] = useState(null);

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
            <>
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
              </section>

              <ConfirmAdministracion
                isPromoting={isPromoting}
                onCancel={() => navigate("/admin/solicitudes")}
                onConfirm={handleConfirm}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default PromoteClient;
