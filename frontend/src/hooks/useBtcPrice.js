import { useEffect, useState } from "react";

// Precio de BTC/USD en vivo por WebSocket directo desde el navegador (feeds
// públicos, sin API key ni backend). Es solo informativo.
//
// Prueba los proveedores en orden; si uno no conecta o se cae, salta al
// siguiente y, tras recorrerlos todos, espera un poco y vuelve a empezar
// (Binance bloquea algunas regiones, por eso el respaldo en Coinbase).
// `parse` recibe el mensaje ya parseado y devuelve { price, changePct } o
// null si no es un tick de precio.
const PROVIDERS = [
  {
    name: "Binance",
    url: "wss://stream.binance.com:9443/ws/btcusdt@ticker",
    parse: (msg) =>
      msg.e === "24hrTicker"
        ? { price: Number(msg.c), changePct: Number(msg.P) }
        : null,
  },
  {
    name: "Coinbase",
    url: "wss://ws-feed.exchange.coinbase.com",
    subscribe: {
      type: "subscribe",
      product_ids: ["BTC-USD"],
      channels: ["ticker"],
    },
    parse: (msg) => {
      if (msg.type !== "ticker" || !msg.price) return null;
      const price = Number(msg.price);
      const open = Number(msg.open_24h);
      return { price, changePct: open > 0 ? ((price - open) / open) * 100 : 0 };
    },
  },
];

const HISTORY_SIZE = 60; // puntos del mini gráfico (~1 por segundo)
const RETRY_DELAY_MS = 3000;

const initialState = {
  price: null,
  changePct: null,
  direction: 0, // 1 subió, -1 bajó respecto al tick anterior, 0 igual
  history: [],
  status: "connecting", // "connecting" | "live" | "offline"
  source: null,
};

export function useBtcPrice() {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    let disposed = false;
    let socket = null;
    let retryTimer = null;
    let providerIndex = 0;

    const connect = () => {
      const provider = PROVIDERS[providerIndex];
      let receivedTick = false;
      socket = new WebSocket(provider.url);

      socket.onopen = () => {
        if (provider.subscribe) socket.send(JSON.stringify(provider.subscribe));
      };

      socket.onmessage = (event) => {
        let tick;
        try {
          tick = provider.parse(JSON.parse(event.data));
        } catch {
          return;
        }
        if (!tick || !Number.isFinite(tick.price)) return;
        receivedTick = true;

        setState((prev) => ({
          price: tick.price,
          changePct: tick.changePct,
          direction:
            prev.price === null || tick.price === prev.price
              ? prev.direction
              : tick.price > prev.price
                ? 1
                : -1,
          history: [...prev.history, { price: tick.price }].slice(-HISTORY_SIZE),
          status: "live",
          source: provider.name,
        }));
      };

      // onerror siempre va seguido de onclose, así que la reconexión vive
      // solo en onclose.
      socket.onclose = () => {
        if (disposed) return;
        setState((prev) => ({ ...prev, status: "offline" }));
        // Si este proveedor sí llegó a transmitir, se reintenta con él;
        // si nunca conectó, se pasa al siguiente.
        if (!receivedTick) providerIndex = (providerIndex + 1) % PROVIDERS.length;
        retryTimer = setTimeout(connect, RETRY_DELAY_MS);
      };
    };

    connect();

    return () => {
      disposed = true;
      clearTimeout(retryTimer);
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
    };
  }, []);

  return state;
}
