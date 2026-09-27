import "./LegalLinks.css";

// Par de enlaces a los documentos legales, deliberadamente discreto
// (texto pequeño, color apagado): se usa en Configuración (ambos
// perfiles) y en el paso final del registro. Se abren en pestaña nueva
// para no interrumpir el modal de registro ni sacar al cliente de
// Configuración.
const LegalLinks = ({ className = "" }) => (
  <p className={`legal-links ${className}`}>
    <a href="/legal/terminos-y-condiciones" target="_blank" rel="noopener noreferrer">
      Términos y condiciones
    </a>
    <span aria-hidden="true">·</span>
    <a href="/legal/politica-de-privacidad" target="_blank" rel="noopener noreferrer">
      Política de privacidad
    </a>
  </p>
);

export default LegalLinks;
