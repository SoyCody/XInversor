import { formatBtc } from "./format.js";

// Arma el mensaje legible de una notificación según su tipo. Centralizado
// acá porque lo usan tanto el desplegable del header como las dos
// pantallas de "Notificaciones" (cliente y admin).
export const describirNotificacion = (n) => {
  switch (n.tipo) {
    case "PAQUETE_APROBADO":
      return `Tu paquete de ${formatBtc(n.monto)} fue aprobado`;
    case "PAQUETE_RECHAZADO":
      return `Tu paquete de ${formatBtc(n.monto)} fue rechazado`;
    case "RETIRO_APROBADO":
      return `Tu solicitud de retiro de ${formatBtc(n.montoRetiro)} fue aprobada`;
    case "RETIRO_RECHAZADO":
      return `Tu solicitud de retiro de ${formatBtc(n.montoRetiro)} fue rechazada`;
    case "PAQUETE_NUEVO":
      return `${n.cliente} creó un nuevo paquete de ${formatBtc(n.monto)}`;
    case "RETIRO_NUEVO":
      return `${n.cliente} solicitó un retiro de ${formatBtc(n.montoRetiro)}`;
    default:
      return "Notificación";
  }
};

// Color por tipo: aprobado/nuevo en los mismos tonos que ya usa el resto
// de la app (config-modal__success, notification-count), rechazado en el
// mismo rojo que config-modal__error.
export const colorNotificacion = (tipo) => {
  if (tipo === "PAQUETE_RECHAZADO" || tipo === "RETIRO_RECHAZADO") return "is-rechazada";
  if (tipo === "PAQUETE_NUEVO" || tipo === "RETIRO_NUEVO") return "is-nueva";
  return "is-aprobada";
};

export const formatFechaNotificacion = (isoString) => {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleString("es-EC", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
