import { obtenerClientes } from "../../../services/adminApi.js";
import { useFetch } from "../../../hooks/useFetch";
import AdminSideBar from "../../SideBar/AdminSideBar.jsx";
import Header from "../../Header/Header.jsx";
import { useNavigate } from "react-router-dom";
import "../../../App.css";
import "./MakeAdmin.css";

const MakeAdmin = () => {
  const { data, isLoading, error } = useFetch(obtenerClientes);
  const navigate = useNavigate();

  const clientes = data?.clientes ?? [];
  const totalClientes = data?.totalClientes ?? 0;

  return (
    <div className="app">
      <AdminSideBar />

      <main className="main">
        <Header />

        <div className="content">
          <div className="page-heading">
            <div>
              <h1>Solicitudes</h1>
              <p>Envía una solicitud de administración a un cliente disponible</p>
            </div>
          </div>

          {error && <p className="dashboard-error">{error}</p>}

          {isLoading ? (
            <p>Cargando clientes...</p>
          ) : (
            <>
              <div className="clientes-summary">
                <span className="clientes-total">
                  Total de clientes: <strong>{totalClientes}</strong>
                </span>
              </div>

              {clientes.length === 0 ? (
                <p>No hay clientes registrados.</p>
              ) : (
                <div className="clientes-table-wrapper">
                  <table className="clientes-table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Apellido</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientes.map((cliente) => (
                        <tr key={cliente.id}>
                          <td>{cliente.firstName}</td>
                          <td>{cliente.lastName}</td>
                          <td>
                            <button
                              className="edit-profile-btn"
                              onClick={() => navigate(`/admin/promote/${cliente.id}`)}
                            >
                              Asignar administración
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default MakeAdmin;