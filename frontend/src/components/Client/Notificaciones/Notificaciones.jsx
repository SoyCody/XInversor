import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getClientNotifications } from "../../../services/notificationApi.js";
import { getCurrentUser } from "../../../services/authApi.js";
import { useFetch } from "../../../hooks/useFetch";
import { describirNotificacion, formatFechaNotificacion, colorNotificacion } from "../../../utils/notificaciones.js";
import { markAllSeen } from "../../../utils/notificationsSeen.js";
import ClientSideBar from "../../SideBar/ClientSideBar.jsx";
import Header from "../../Header/Header.jsx";
import Pagination from "../../Pagination/Pagination.jsx";
import "../../../App.css";
import "../../DataTable/DataTable.css";

// Historial de decisiones sobre las inversiones del cliente: paquetes y
// retiros que un admin ya aprobó o rechazó. A diferencia del admin, acá
// no hay "Ver auditoría" (esa vista es solo de administración) -- cada
// fila lleva únicamente a la inversión mencionada.
const Notificaciones = () => {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const { data, isLoading, error } = useFetch(
    () => getClientNotifications(page),
    [page]
  );
  const notificaciones = data?.notificaciones ?? [];

  // Entrar acá también cuenta como "verlas" (no solo abrir el desplegable
  // del header): si no, el ícono seguiría marcando pendientes aunque el
  // cliente ya las haya revisado todas en esta pantalla.
  const { data: user } = useFetch(getCurrentUser);
  useEffect(() => {
    if (user?.id) markAllSeen(user.id);
  }, [user?.id]);

  return (
    <div className="app">
      <ClientSideBar />

      <main className="main">
        <Header />

        <div className="content">
          <div className="page-heading">
            <div>
              <h1>Notificaciones</h1>
              <p>Aprobaciones y rechazos de tus paquetes y retiros</p>
            </div>
          </div>

          {error && <p className="dashboard-error">{error}</p>}

          {isLoading ? (
            <p>Cargando notificaciones...</p>
          ) : notificaciones.length === 0 ? (
            <p>No tienes notificaciones.</p>
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
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          onClick={() => navigate(`/client/inversiones/${n.inversionId}`)}
                        >
                          Detalles
                        </button>
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
