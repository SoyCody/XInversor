import { useState } from "react";
import ClientSideBar from "../../SideBar/ClientSideBar.jsx";
import Header from "../../Header/Header.jsx";
import ReferralLinkCard from "./ReferralLinkCard.jsx";
import InvestmentOverview from "./InvestmentOverview.jsx";
import WelcomeWalletModal from "./WelcomeWalletModal.jsx";
import BlockedAccountModal from "./BlockedAccountModal.jsx";
import { useFetch } from "../../../hooks/useFetch.js";
import { getClientDashboard } from "../../../services/clientApi.js";

const ClientDashboard = () => {
  const { data, isLoading, error } = useFetch(getClientDashboard);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const [blockedDismissed, setBlockedDismissed] = useState(false);

  const isBlocked = !isLoading && data?.blocked === true;

  // Se muestra mientras el cliente no tenga wallet registrada (sin ella no
  // puede invertir); "Luego" solo la oculta para esta visita, no la apaga
  // para siempre. No tiene sentido pedirle registrar la wallet si además
  // está bloqueado, así que en ese caso se prioriza el aviso de bloqueo.
  const showWelcome =
    !isLoading && data?.tieneWallet === false && !welcomeDismissed && !isBlocked;
  const showBlocked = isBlocked && !blockedDismissed;

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

          <ReferralLinkCard link={data?.link} isLoading={isLoading} />

          <InvestmentOverview
            totalInvertido={data?.totalInvertido ?? 0}
            totalAcumulado={data?.totalAcumulado ?? 0}
            enProgreso={data?.enProgreso ?? 0}
            pendientes={data?.pendientes ?? 0}
            limiteActivas={data?.limiteActivas ?? 5}
            isLoading={isLoading}
          />
        </div>

        {showBlocked && (
          <BlockedAccountModal onClose={() => setBlockedDismissed(true)} />
        )}

        {showWelcome && (
          <WelcomeWalletModal onClose={() => setWelcomeDismissed(true)} />
        )}
      </main>
    </div>
  );
};

export default ClientDashboard;
