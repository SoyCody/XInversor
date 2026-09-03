import { useState } from "react";
import { obtenerAuditorias } from "../../../services/auditApi.js";
import { useFetch } from "../../../hooks/useFetch";
import AdminSideBar from "../../SideBar/AdminSideBar.jsx";
import Header from "../../Header/Header.jsx";
import Pagination from "../../Pagination/Pagination.jsx";
import { useNavigate } from "react-router-dom";
import "../../../App.css";
import "./Auditorias.css";

const Auditorias = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useFetch(
    () => obtenerAuditorias(page),
    [page]
  );
  const navigate = useNavigate();

  const auditorias = data?.auditorias ?? [];
  const totalAuditorias = data?.totalAuditorias ?? 0;

  return (
    <div className="app">
      <AdminSideBar />

      <main className="main">
        <Header />

        <div className="content">
          <div className="page-heading">
            <div>
              <h1>Auditorías</h1>
              <p>Historial de acciones realizadas en la plataforma</p>
            </div>
          </div>

          {error && <p className="dashboard-error">{error}</p>}

          {isLoading ? (
            <p>Cargando auditorías...</p>
          ) : (
            <>
              <div className="clientes-summary">
                <span className="clientes-total">
                  Total de registros: <strong>{totalAuditorias}</strong>
                </span>
              </div>

              {auditorias.length === 0 ? (
                <p>No hay auditorías registradas.</p>
              ) : (
                <div className="clientes-table-wrapper">
                  <table className="clientes-table">
                    <thead>
                      <tr>
                        <th>Usuario</th>
                        <th>Rol</th>
                        <th>Acción</th>
                        <th>Tabla</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditorias.map((auditoria) => (
                        <tr key={auditoria.id}>
                          <td>{auditoria.nombre}</td>
                          <td>{auditoria.rol}</td>
                          <td>{auditoria.accion}</td>
                          <td>{auditoria.tabla}</td>
                          <td>
                            <button
                              className="edit-profile-btn"
                              onClick={() => navigate(`/admin/auditorias/${auditoria.id}`)}
                            >
                              Ver detalles
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

          {!isLoading && (
            <Pagination
              page={data?.page ?? 1}
              totalPages={data?.totalPages ?? 1}
              onChange={setPage}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Auditorias;
