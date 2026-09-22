import logoGrande from "../../assets/logoGrande.png";
import "../Home/Home.css";
import "./NotFound.css";

// Página comodín para cualquier ruta que no exista (ver App.jsx, "*").
// Reutiliza el lockup de marca del Hero de Home (.hero-brand/.hero-logo/
// .hero-brand-name) en vez de duplicar esos estilos.
const NotFound = () => {
  return (
    <div className="notfound-page">
      <div className="notfound-content">
        <div className="hero-brand">
          <img className="hero-logo" src={logoGrande} alt="FXInversors" />
          <h1 className="hero-brand-name">
            FX<span>INVERSORS</span>
          </h1>
        </div>

        <p className="notfound-code">
          4<span>0</span>4
        </p>
        <p className="notfound-message">
          La página que buscas no se encuentra disponible.
        </p>
      </div>
    </div>
  );
};

export default NotFound;
