import { Link } from "react-router-dom";
import logo from "../../assets/logoGrande.png";
import "./LegalPage.css";

// Página pública e independiente (sin sidebar/topbar de la app) para
// leer un documento legal completo: se abre en pestaña nueva desde
// Configuración y desde el registro, así que debe funcionar sola, con
// sesión iniciada o no.
const LegalPage = ({ title, updated, children }) => {
  return (
    <div className="legal-page">
      <header className="legal-page-header">
        <Link to="/" className="legal-page-brand">
          <img src={logo} alt="FXInversors" />
        </Link>
      </header>

      <main className="legal-page-body">
        <div className="legal-page-card">
          <h1>{title}</h1>
          {updated && <p className="legal-page-updated">Última actualización: {updated}</p>}
          {children}
        </div>
      </main>
    </div>
  );
};

export default LegalPage;
