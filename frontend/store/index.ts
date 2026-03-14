import { create } from "zustand";
import { Incident, User, DashboardStats } from "@/types";

// ── Auth store ────────────────────────────────────────────────────────────────
interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== "undefined" ? localStorage.getItem("guardian_token") : null,
  setAuth: (user, token) => {
    localStorage.setItem("guardian_token", token);
    set({ user, token });
  },
  clearAuth: () => {
    localStorage.removeItem("guardian_token");
    set({ user: null, token: null });
  },
}));

// ── Live incidents store (WebSocket feed) ─────────────────────────────────────
interface LiveState {
  incidents: Incident[];
  stats: DashboardStats | null;
  connected: boolean;
  setConnected: (v: boolean) => void;
  setStats: (s: DashboardStats) => void;
  prependIncident: (inc: Incident) => void;
  setInitialIncidents: (incs: Incident[]) => void;
}

export const useLiveStore = create<LiveState>((set) => ({
  incidents: [],
  stats: null,
  connected: false,
  setConnected: (connected) => set({ connected }),
  setStats: (stats) => set({ stats }),
  prependIncident: (inc) =>
    set((s) => ({ incidents: [inc, ...s.incidents].slice(0, 100) })),
  setInitialIncidents: (incidents) => set({ incidents }),
}));
