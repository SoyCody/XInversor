import { getMeClient } from "../../../services/clientApi";
import { useFetch } from "../../../hooks/useFetch";
import ClientSideBar from "../../SideBar/ClientSideBar.jsx";
import Header from "../../Header/Header.jsx";
import AccountDetails from "./AccountDetails";
import "./ClientGetMe.css";

const formatDate = (isoString) => {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("es-EC", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const ClientGetMe = () => {
  const { data: user, isLoading, error } = useFetch(getMeClient);

  return (
    <div className="app">
      <ClientSideBar />

      <main className="main">
        <Header />

        <div className="content">
          <div className="page-heading">
            <div>
              <h1>Mi perfil</h1>
              <p>Información de tu cuenta</p>
            </div>
          </div>
          {error && <p className="dashboard-error">{error}</p>}
          <section className="profile-card">
            <AccountDetails user={user} isLoading={isLoading} />
            <div className="profile-meta">
              <span
                className={`role-badge role-badge--${(
                  user?.role ?? "client"
                ).toLowerCase()}`}
              >
                {isLoading
                  ? "—"
                  : user?.role === "ADMIN"
                    ? "Administrador"
                    : "Cliente"}
              </span>
              <span className="profile-since">
                Miembro desde {isLoading ? "—" : formatDate(user?.createdAt)}
              </span>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default ClientGetMe;