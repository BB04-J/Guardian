import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { RiskLevel, AIPlatform } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string; dot: string; border: string }> = {
  critical: { label: "Critical", color: "text-red-400", bg: "bg-red-950/60", dot: "bg-red-500", border: "border-red-800/60" },
  high: { label: "High", color: "text-orange-400", bg: "bg-orange-950/60", dot: "bg-orange-500", border: "border-orange-800/60" },
  medium: { label: "Medium", color: "text-yellow-400", bg: "bg-yellow-950/60", dot: "bg-yellow-400", border: "border-yellow-800/60" },
  low: { label: "Low", color: "text-green-400", bg: "bg-green-950/60", dot: "bg-green-500", border: "border-green-800/60" },
  safe: { label: "Safe", color: "text-blue-400", bg: "bg-blue-950/60", dot: "bg-blue-500", border: "border-blue-800/60" },
};

export const ACTION_CONFIG: Record<string, { label: string; color: string }> = {
  blocked: { label: "Blocked", color: "text-red-400" },
  warned: { label: "Warned", color: "text-yellow-400" },
  allowed: { label: "Allowed", color: "text-green-400" },
  sanitized: { label: "Sanitized", color: "text-cyan-400" },
};

export const PLATFORM_LABELS: Record<AIPlatform, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  copilot: "Copilot",
  mistral: "Mistral",
  groq: "Groq",
  other: "Other",
};

// Monogram-style platform initials for icon display
export const PLATFORM_INITIALS: Record<AIPlatform, string> = {
  chatgpt: "GP",
  claude: "CL",
  gemini: "GM",
  copilot: "CP",
  mistral: "MS",
  groq: "GQ",
  other: "AI",
};

export const PLATFORM_COLORS: Record<AIPlatform, string> = {
  chatgpt: "bg-emerald-900/80 text-emerald-300 border-emerald-700/50",
  claude: "bg-orange-900/80 text-orange-300 border-orange-700/50",
  gemini: "bg-blue-900/80 text-blue-300 border-blue-700/50",
  copilot: "bg-indigo-900/80 text-indigo-300 border-indigo-700/50",
  mistral: "bg-purple-900/80 text-purple-300 border-purple-700/50",
  groq: "bg-rose-900/80 text-rose-300 border-rose-700/50",
  other: "bg-slate-800/80 text-slate-300 border-slate-600/50",
};

export function riskBarColor(score: number): string {
  if (score >= 80) return "bg-red-500";
  if (score >= 60) return "bg-orange-500";
  if (score >= 40) return "bg-yellow-500";
  return "bg-green-500";
}

export function formatTs(ts: string): string {
  return new Date(ts).toLocaleString("en-IN", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

export function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
