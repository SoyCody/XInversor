import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminNotifications } from "../../../services/notificationApi.js";
import { getCurrentUser } from "../../../services/authApi.js";
import { useFetch } from "../../../hooks/useFetch";
import { describirNotificacion, formatFechaNotificacion, colorNotificacion } from "../../../utils/notificaciones.js";
import { markAllSeen } from "../../../utils/notificationsSeen.js";
import AdminSideBar from "../../SideBar/AdminSideBar.jsx";
import Header from "../../Header/Header.jsx";
import Pagination from "../../Pagination/Pagination.jsx";
import "../../../App.css";
import "../../DataTable/DataTable.css";

// Paquetes y retiros nuevos, a la espera de revisión: a diferencia de las
// notificaciones del cliente (un historial de decisiones ya tomadas),
// estas reflejan el estado ACTUAL -- en cuanto el admin aprueba o
// rechaza, la fila deja de "estar por revisar" y desaparece de acá. Cada
// una lleva a la inversión mencionada ("Detalles") y, cuando existe, a la
// auditoría que registró su creación ("Ver auditoría").
const Notificaciones = () => {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const { data, isLoading, error } = useFetch(
    () => getAdminNotifications(page),
    [page]
  );
  const notificaciones = data?.notificaciones ?? [];

  // Entrar acá también cuenta como "verlas" (no solo abrir el desplegable
  // del header): si no, el ícono seguiría marcando pendientes aunque el
  // admin ya las haya revisado todas en esta pantalla.
  const { data: user } = useFetch(getCurrentUser);
  useEffect(() => {
    if (user?.id) markAllSeen(user.id);
  }, [user?.id]);

  return (
    <div className="app">
      <AdminSideBar />

      <main className="main">
        <Header />

        <div className="content">
          <div className="page-heading">
            <div>
              <h1>Notificaciones</h1>
              <p>Paquetes y retiros nuevos, a la espera de revisión</p>
            </div>
          </div>

          {error && <p className="dashboard-error">{error}</p>}

          {isLoading ? (
            <p>Cargando notificaciones...</p>
          ) : notificaciones.length === 0 ? (
            <p>No hay nada por revisar.</p>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Notificación</th>
                    <th className="data-table-actions" />
                  </tr>
                </thead>
                <tbody>
                  {notificaciones.map((n) => (
                    <tr key={n.id}>
                      <td>{formatFechaNotificacion(n.fecha)}</td>
                      <td>
                        <span
                          className={`notification-dot ${colorNotificacion(n.tipo)}`}
                          aria-hidden="true"
                        />
                        {describirNotificacion(n)}
                      </td>
                      <td className="data-table-actions">
                        <div className="data-table-actions-group">
                          <button
                            type="button"
                            className="btn btn--primary btn--sm"
                            onClick={() => navigate(`/admin/inversiones/${n.inversionId}`)}
                          >
                            Detalles
                          </button>
                          {n.auditoriaId && (
                            <button
                              type="button"
                              className="btn btn--muted btn--sm"
                              onClick={() => navigate(`/admin/auditorias/${n.auditoriaId}`)}
                            >
                              Ver auditoría
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

export default Notificaciones;
