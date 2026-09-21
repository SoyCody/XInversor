import { useState } from "react";
import eyeIcon from "../../assets/eye.png";
import closedEyeIcon from "../../assets/closedEye.png";

// Muestra (sin editar) un dato del cliente para que el admin lo consulte
// -- wallet, correo, etc: mismos estilos que la fila de WalletCard
// (cfg-wallet-row / cfg-wallet-input / cfg-eye), pero de solo lectura,
// visible por defecto (a diferencia de WalletCard, acá no hay nada que
// ocultarle al propio dueño) y con "Copiar" (como ReferralLinkCard) en
// vez de "Guardar". `maskable` agrega el botón de ojo para
// ocultar/mostrar (pensado para la wallet); datos que no tiene sentido
// ocultar, como el correo, lo omiten. El encabezado (título + subtítulo)
// lo pone quien lo usa, para calzar con el resto de la página en la que
// aparece.
const CopyableField = ({ value, maskable = false, placeholder = "Sin datos registrados" }) => {
  const [visible, setVisible] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
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
        disabled={!value}
      >
        {copied ? "Copiado ✓" : "Copiar"}
      </button>

      <div className="cfg-wallet-input">
        <input
          type={maskable && !visible ? "password" : "text"}
          value={value ?? ""}
          readOnly
          placeholder={placeholder}
        />
        {maskable && (
          <button
            type="button"
            className="cfg-eye"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Ocultar" : "Mostrar"}
          >
            <img src={visible ? closedEyeIcon : eyeIcon} alt="" />
          </button>
        )}
      </div>
    </div>
  );
};

export default CopyableField;
