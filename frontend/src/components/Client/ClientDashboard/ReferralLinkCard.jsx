import { useState } from "react";
import "./ReferralLinkCard.css";

// Enlace de referido: label + botón "Copiar" en la misma fila, y el
// enlace debajo en un cuadro con el estilo de los inputs de la app.
const ReferralLinkCard = ({ link, isLoading }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API bloqueada (permisos, contexto no seguro, etc.)
      // No es un error del usuario, así que no mostramos nada agresivo.
    }
  };

  return (
    <section className="section-band referral-card">
      <div className="referral-card-header">
        <span className="referral-card-label">Tu enlace de referido</span>
        <button
          type="button"
          className="btn btn--primary"
          onClick={handleCopy}
          disabled={isLoading || !link}
        >
          {copied ? "Copiado ✓" : "Copiar"}
        </button>
      </div>

      <div className="referral-card-link" title={link || ""}>
        {isLoading ? "Cargando enlace..." : link || "Sin enlace asignado"}
      </div>
    </section>
  );
};

export default ReferralLinkCard;
