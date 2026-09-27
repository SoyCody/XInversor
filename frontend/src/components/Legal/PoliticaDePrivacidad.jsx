import LegalPage from "./LegalPage.jsx";
import LegalDocument from "./LegalDocument.jsx";
import raw from "../../assets/docs/PoliticaDePrivacidad.txt?raw";

const PoliticaDePrivacidad = () => (
  <LegalPage title="Política de Privacidad">
    <LegalDocument raw={raw} />
  </LegalPage>
);

export default PoliticaDePrivacidad;
