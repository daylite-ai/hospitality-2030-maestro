import { useEffect, useRef, useState } from "react";
import type { TraceEvent } from "@maestro/protocol";

const WS_URL = (() => {
  const loc = typeof window !== "undefined" ? window.location : undefined;
  const proto = loc?.protocol === "https:" ? "wss" : "ws";
  const host = "localhost:4000"; // orchestrator
  return `${proto}://${host}/ws`;
})();

/**
 * Single-shot WebSocket connection to the orchestrator trace stream.
 *
 * Per May-2026 hackathon advice: no reconnect, no replay buffer. Connect
 * once on mount; don't refresh on stage.
 */
export function useTraceStream() {
  const [events, setEvents] = useState<TraceEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data) as TraceEvent;
        setEvents((prev) => [...prev, event]);
      } catch {
        // ignore
      }
    };
    return () => ws.close();
  }, []);

  const reset = () => setEvents([]);
  return { events, connected, reset };
}
