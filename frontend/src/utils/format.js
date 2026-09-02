// El único valor en dólares es el capital que el cliente aporta a la
// inversión (`monto`). Todo lo demás —intereses, total, monto de retiro—
// se procesa y se paga en bitcoin, así que se muestra en BTC.

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

// BTC: hasta 8 decimales (1 satoshi); mínimo 2 para que no quede "1 BTC".
const btcFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 8,
});

// Los montos llegan del backend como string: Prisma serializa Decimal así.
const toNumber = (value) =>
  typeof value === "number" ? value : Number(value);

export const formatUsd = (value) => {
  const num = toNumber(value);
  return Number.isFinite(num) ? usdFormatter.format(num) : "—";
};

export const formatBtc = (value) => {
  const num = toNumber(value);
  return Number.isFinite(num) ? `${btcFormatter.format(num)} BTC` : "—";
};
