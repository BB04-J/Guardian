import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export const api = axios.create({
  baseURL: BASE,
  withCredentials: true,
});

// Attach JWT from localStorage as fallback
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("guardian_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("guardian_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (email: string, password: string) =>
  api.post("/auth/login", { email, password });

export const verifyAuth = () => api.get("/auth/verify");

export const logout = () => api.post("/auth/logout");

// ── Incidents ─────────────────────────────────────────────────────────────────
export const getIncidents = (params?: Record<string, string | number>) =>
  api.get("/incidents", { params });

export const getIncident = (id: string) => api.get(`/incidents/${id}`);

export const exportIncidents = (params?: Record<string, string>) =>
  api.get("/incidents/export", { params, responseType: "blob" });

// ── Stats ─────────────────────────────────────────────────────────────────────
export const getStats = () => api.get("/stats/summary");

export const getTimeline = (hours = 24) =>
  api.get("/stats/timeline", { params: { hours } });

// ── Users ─────────────────────────────────────────────────────────────────────
export const getUsers = () => api.get("/users");

export const getUser = (id: string) => api.get(`/users/${id}`);

export const getUserIncidents = (id: string) =>
  api.get(`/users/${id}/incidents`);

// ── Policies ──────────────────────────────────────────────────────────────────
export const getPolicies = () => api.get("/policies");

export const updatePolicy = (id: string, data: Record<string, unknown>) =>
  api.patch(`/policies/${id}`, data);

export const createPolicy = (data: Record<string, unknown>) =>
  api.post("/policies", data);

export const deletePolicy = (id: string) => api.delete(`/policies/${id}`);
