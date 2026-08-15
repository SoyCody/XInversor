import { useFetch } from "../../hooks/useFetch";
import { getAdminDashboard } from "../../services/adminApi";
import SideBar from "../SideBar/SideBar";
import Header from "../Header/Header";

const AdminDashboard = () => {
  const { data, isLoading, error } = useFetch(getAdminDashboard);

  return (
    <div className="app">
      <SideBar />
      <main className="main">
        <Header />
        <div className="content">
          {error && <p className="dashboard-error">{error}</p>}
          <strong>{isLoading ? "—" : data?.totalUsers}</strong>
          {/* ...totalAdmins, totalClients, recentUsers */}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;