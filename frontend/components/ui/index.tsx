import clsx from "clsx";
import { RiskLevel, AIPlatform } from "@/types";
import { RISK_CONFIG, ACTION_CONFIG, PLATFORM_INITIALS, PLATFORM_COLORS, PLATFORM_LABELS } from "@/lib/utils";

// ── RiskBadge ─────────────────────────────────────────────────────────────────
export function RiskBadge({ level }: { level: RiskLevel }) {
  const cfg = RISK_CONFIG[level];
  return (
    <span className={clsx("inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border", cfg.bg, cfg.color, cfg.border)}>
      <span className={clsx("w-1.5 h-1.5 rounded-full", cfg.dot)} />
      {cfg.label.toUpperCase()}
    </span>
  );
}

// ── ActionBadge ───────────────────────────────────────────────────────────────
export function ActionBadge({ action }: { action: string }) {
  const cfg = ACTION_CONFIG[action] ?? { label: action, color: "text-slate-400" };
  return (
    <span className={clsx("text-[11px] font-mono", cfg.color)}>
      {cfg.label.toUpperCase()}
    </span>
  );
}

// ── PlatformIcon ──────────────────────────────────────────────────────────────
export function PlatformIcon({ platform, size = "sm" }: { platform: AIPlatform; size?: "sm" | "md" }) {
  return (
    <span className={clsx(
      "inline-flex items-center justify-center font-mono font-semibold border rounded",
      PLATFORM_COLORS[platform] ?? PLATFORM_COLORS.other,
      size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1"
    )}>
      {PLATFORM_LABELS[platform] ?? platform}
    </span>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "cyan" | "red" | "orange" | "green";
  pulse?: boolean;
}

const ACCENT_COLORS = {
  cyan:   "border-cyan-500/30 text-cyan-400",
  red:    "border-red-500/30 text-red-400",
  orange: "border-orange-500/30 text-orange-400",
  green:  "border-green-500/30 text-green-400",
};

export function StatCard({ label, value, sub, accent = "cyan", pulse = false }: StatCardProps) {
  return (
    <div className={clsx("glass rounded-lg p-4 border-l-2 relative overflow-hidden scanlines", ACCENT_COLORS[accent])}>
      <p className="text-[10px] font-mono text-slate-500 tracking-widest mb-1">{label.toUpperCase()}</p>
      <div className="flex items-end gap-2">
        <span className={clsx("text-2xl font-mono font-bold", ACCENT_COLORS[accent].split(" ")[1], pulse && "animate-pulse-slow")}>
          {value}
        </span>
        {sub && <span className="text-[11px] font-mono text-slate-600 mb-0.5">{sub}</span>}
      </div>
    </div>
  );
}

// ── ThreatTag ─────────────────────────────────────────────────────────────────
export function ThreatTag({ type }: { type: string }) {
  return (
    <span className="inline-block px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700 rounded tracking-wider">
      {type.replace(/_/g, " ").toUpperCase()}
    </span>
  );
}
