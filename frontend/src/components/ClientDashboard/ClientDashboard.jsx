import SideBar from "../SideBar/SideBar";
import Header from "../Header/Header";
import ReferralLinkCard from "./ReferralLinkCard.jsx";
import { useFetch } from "../../hooks/useFetch";
import { getClientDashboard } from "../../services/clientApi.js";

const ClientDashboard = () => {
  const { data, isLoading, error } = useFetch(getClientDashboard);

  return (
    <div className="app">
      <SideBar />

      <main className="main">
        <Header />

        <div className="content">
          <div className="page-heading">
            <div>
              <h1>Inicio</h1>
              <p>Resumen de tu cuenta</p>
            </div>

            <button className="date-picker" type="button">
              <span className="calendar-icon" aria-hidden="true" />
              9 de Agosto, 2026
              <span className="chevron" aria-hidden="true" />
            </button>
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