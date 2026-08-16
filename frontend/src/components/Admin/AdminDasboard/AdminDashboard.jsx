import AdminSideBar from "../../SideBar/AdminSideBar.jsx";
import Header from "../../Header/Header";
import RecentUsersTable from "./RecentUsersTable.jsx";
import { useFetch } from "../../../hooks/useFetch";
import { getAdminDashboard } from "../../../services/adminApi";

const AdminDashboard = () => {
  const { data, isLoading, error } = useFetch(getAdminDashboard);

  return (
    <div className="app">
      <AdminSideBar />
      <main className="main">
        <Header />
        <div className="content">
          <div className="page-heading">
            <div>
              <h1>Panel de administración</h1>
              <p>Resumen general</p>
            </div>
          </div>

          {error && <p className="dashboard-error">{error}</p>}

          <section className="metrics">
            <article className="metric-card">
              <div className="metric-top">
                <div>
                  <span className="metric-label">USUARIOS TOTALES</span>
                  <strong>{isLoading ? "—" : data?.totalUsers ?? 0}</strong>
                </div>
                <span className="metric-symbol blue">↗</span>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-top">
                <div>
                  <span className="metric-label">ADMINISTRADORES</span>
                  <strong>{isLoading ? "—" : data?.totalAdmins ?? 0}</strong>
                </div>
                <span className="metric-symbol purple">↗</span>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-top">
                <div>
                  <span className="metric-label">CLIENTES</span>
                  <strong>{isLoading ? "—" : data?.totalClients ?? 0}</strong>
                </div>
                <span className="metric-symbol green">↗</span>
              </div>
            </article>
          </section>

          <RecentUsersTable users={data?.recentUsers} isLoading={isLoading} />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;