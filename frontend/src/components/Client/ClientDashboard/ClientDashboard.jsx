import ClientSideBar from "../../SideBar/ClientSideBar.jsx";
import Header from "../../Header/Header.jsx";
import ReferralLinkCard from "./ReferralLinkCard.jsx";
import { useFetch } from "../../../hooks/useFetch.js";
import { getClientDashboard } from "../../../services/clientApi.js";

const ClientDashboard = () => {
  const { data, isLoading, error } = useFetch(getClientDashboard);

  return (
    <div className="app">
      <ClientSideBar />

      <main className="main">
        <Header />

        <div className="content">
          <div className="page-heading">
            <div>
              <h1>Inicio</h1>
              <p>Resumen de tu cuenta</p>
            </div>
          </div>

          {error && <p className="dashboard-error">{error}</p>}

          <section className="metrics">
            <ReferralLinkCard link={data?.link} isLoading={isLoading} />
          </section>
        </div>
      </main>
    </div>
  );
};

export default ClientDashboard;