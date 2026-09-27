import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";
import { useBtcPrice } from "../../../hooks/useBtcPrice.js";
import "./BtcPriceCard.css";

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const STATUS_LABEL = {
  connecting: "Conectando…",
  live: "En vivo",
  offline: "Reconectando…",
};

// Precio de Bitcoin en vivo (solo informativo). Los datos vienen por
// WebSocket directo desde el exchange; ver hooks/useBtcPrice.js.
const BtcPriceCard = () => {
  const { price, changePct, direction, history, status, source } = useBtcPrice();

  const hasPrice = price !== null;
  const up = (changePct ?? 0) >= 0;
  const trend = up ? "is-up" : "is-down";

  return (
    <section className="section-band btc-card" aria-label="Precio de Bitcoin">
      <div className="btc-card-main">
        <div className="btc-card-head">
          <span className="btc-card-title">Bitcoin (BTC/USD)</span>
          <span className={`btc-card-status is-${status}`}>
            <i aria-hidden="true" />
            {STATUS_LABEL[status]}
          </span>
        </div>

        <div className="btc-card-price-row">
          <span
            key={price}
            className={`btc-card-price ${
              direction === 1 ? "flash-up" : direction === -1 ? "flash-down" : ""
            }`}
          >
            {hasPrice ? usdFormatter.format(price) : "—"}
          </span>
          {hasPrice && (
            <span className={`btc-card-change ${trend}`}>
              {up ? "▲" : "▼"} {Math.abs(changePct).toFixed(2)}%
              <small> 24h</small>
            </span>
          )}
        </div>

        {source && <span className="btc-card-source">Fuente: {source}</span>}
      </div>

      <div className="btc-card-chart" aria-hidden="true">
        {history.length > 1 && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <Line
                type="monotone"
                dataKey="price"
                stroke={up ? "var(--green)" : "var(--red)"}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
};

export default BtcPriceCard;
