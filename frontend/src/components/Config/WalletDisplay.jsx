import { useState } from "react";
import eyeIcon from "../../assets/eye.png";
import closedEyeIcon from "../../assets/closedEye.png";

// Muestra (sin editar) la wallet de un cliente para que el admin la
// consulte: mismos estilos que la fila de WalletCard (cfg-wallet-row /
// cfg-wallet-input / cfg-eye), pero de solo lectura, visible por defecto
// (a diferencia de WalletCard, acá no hay nada que ocultarle al propio
// dueño) y con "Copiar" (como ReferralLinkCard) en vez de "Guardar". El
// encabezado (título + subtítulo) lo pone quien lo usa, para calzar con
// el resto de la página en la que aparece.
const WalletDisplay = ({ wallet }) => {
  const [visible, setVisible] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!wallet) return;
    try {
      await navigator.clipboard.writeText(wallet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API bloqueada (permisos, contexto no seguro, etc.): no
      // es un error del usuario, no mostramos nada agresivo.
    }
  };

  return (
    <div className="cfg-wallet-row">
      <button
        type="button"
        className="btn btn--primary"
        onClick={handleCopy}
        disabled={!wallet}
      >
        {copied ? "Copiado ✓" : "Copiar"}
      </button>

      <div className="cfg-wallet-input">
        <input
          type={visible ? "text" : "password"}
          value={wallet ?? ""}
          readOnly
          placeholder="Sin billetera registrada"
        />
        <button
          type="button"
          className="cfg-eye"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar billetera" : "Mostrar billetera"}
        >
          <img src={visible ? closedEyeIcon : eyeIcon} alt="" />
        </button>
      </div>
    </div>
  );
};

export default WalletDisplay;
