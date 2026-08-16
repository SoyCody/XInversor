import { useState } from "react";
import "./ReferralLinkCard.css";

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
    <article className="referral-card">
      <div className="referral-card-header">
        <span className="referral-card-label">TU ENLACE DE REFERIDO</span>
        <span className="referral-card-symbol" aria-hidden="true">↗</span>
      </div>

      <p className="referral-card-hint">
        Compártelo para invitar nuevos usuarios a XInversor.
      </p>

      <div className="referral-card-row">
        <code className="referral-card-link" title={link || ""}>
          {isLoading ? "Cargando enlace..." : link || "Sin enlace asignado"}
        </code>

        <button
          type="button"
          className="referral-card-copy"
          onClick={handleCopy}
          disabled={isLoading || !link}
        >
          {copied ? "Copiado ✓" : "Copiar"}
        </button>
      </div>
    </article>
  );
};

export default ReferralLinkCard;