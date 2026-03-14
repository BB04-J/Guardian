export type RiskLevel = "critical" | "high" | "medium" | "low" | "safe";
export type ActionType = "blocked" | "warned" | "allowed" | "sanitized";
export type AIPlatform = "chatgpt" | "claude" | "gemini" | "copilot" | "mistral" | "groq" | "other";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "security" | "employee";
  department: string;
  risk_score: number;
  created_at: string;
}

export interface Incident {
  id: string;
  timestamp: string;
  user_id: string | null;
  department: string | null;
  ai_platform: AIPlatform;
  risk_level: RiskLevel;
  action: ActionType;
  threat_types: string[];
  prompt_preview: string | null;
  response_preview: string | null;
  sanitized: boolean;
  device_id: string | null;
}

export interface Policy {
  id: string;
  name: string;
  type: "builtin" | "custom" | "platform_allow" | "rate_limit";
  pattern: string | null;
  threshold: ActionType;
  enabled: boolean;
  created_at: string;
}

export interface DashboardStats {
  totalToday: number;
  criticalToday: number;
  activeUsers: number;
  platformsDetected: string[];
  topThreats: { type: string; count: number }[];
}

export interface TimelineData {
  labels: string[];
  critical: number[];
  high: number[];
  medium: number[];
  low: number[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
}
