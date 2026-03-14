"use client";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useLiveStore } from "@/store";
import { useAuthStore } from "@/store";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000/ws/events";
const MAX_RETRIES = 8;

export function useWebSocket() {
  const ws        = useRef<WebSocket | null>(null);
  const retries   = useRef(0);
  const timer     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const token     = useAuthStore((s) => s.token);
  const { setConnected, prependIncident, setStats } = useLiveStore();

  useEffect(() => {
    if (!token) return;

    function connect() {
      const socket = new WebSocket(`${WS_URL}?token=${token}`);
      ws.current = socket;

      socket.onopen = () => {
        retries.current = 0;
        setConnected(true);
      };

      socket.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "new_incident") {
            prependIncident(msg.data);
            if (msg.data.risk_level === "critical") {
              toast.error(`Critical: ${msg.data.ai_platform} — ${msg.data.threat_types?.[0] ?? "threat detected"}`, {
                duration: 6000,
                icon: "🔴",
              });
            }
          }
          if (msg.type === "stats_update") setStats(msg.data);
        } catch {}
      };

      socket.onclose = () => {
        setConnected(false);
        if (retries.current < MAX_RETRIES) {
          const delay = Math.min(1000 * 2 ** retries.current, 30000);
          retries.current++;
          timer.current = setTimeout(connect, delay);
        }
      };

      socket.onerror = () => socket.close();
    }

    connect();
    return () => {
      if (timer.current) clearTimeout(timer.current);
      ws.current?.close();
    };
  }, [token]);
}
