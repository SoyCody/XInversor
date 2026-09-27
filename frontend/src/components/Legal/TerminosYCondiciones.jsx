import LegalPage from "./LegalPage.jsx";
import LegalDocument from "./LegalDocument.jsx";
import raw from "../../assets/docs/TerminosYCondiciones.txt?raw";

const TerminosYCondiciones = () => (
  <LegalPage title="Términos y Condiciones">
    <LegalDocument raw={raw} />
  </LegalPage>
);

export default TerminosYCondiciones;
