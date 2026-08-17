import { getClientes } from "../../../services/adminApi.js";
import { useFetch } from "../../../hooks/useFetch";
import AdminSideBar from "../../SideBar/AdminSideBar.jsx";
import Header from "../../Header/Header.jsx";
import "../../../App.css";
import "./ObtenerClientes.css";

const formatDate = (isoString) => {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("es-EC", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const ObtenerClientes = () => {
  const { data, isLoading, error } = useFetch(getClientes);

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
              <h1>Clientes</h1>
              <p>Listado de todos los clientes registrados</p>
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
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Apellido</th>
                        <th>Correo</th>
                        <th>Registrado</th>
                        <th>Última actualización</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientes.map((cliente) => (
                        <tr key={cliente.id}>
                          <td>{cliente.id}</td>
                          <td>{cliente.firstName}</td>
                          <td>{cliente.lastName}</td>
                          <td>{cliente.email}</td>
                          <td>{formatDate(cliente.createdAt)}</td>
                          <td>{formatDate(cliente.apdatedAt)}</td>
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

export default ObtenerClientes;