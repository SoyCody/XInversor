// Todos los montos —el capital que el cliente aporta (`monto`), los
// intereses, el total y el monto de retiro— se procesan y se pagan en
// bitcoin, así que se muestran en BTC.

// BTC: siempre 2 decimales (los montos ya vienen redondeados a esa
// precisión en toda la UI, aunque el backend guarde hasta 8).
const btcFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Los montos llegan del backend como string: Prisma serializa Decimal así.
const toNumber = (value) =>
  typeof value === "number" ? value : Number(value);

export const formatBtc = (value) => {
  const num = toNumber(value);
  return Number.isFinite(num) ? `${btcFormatter.format(num)} BTC` : "—";
};
