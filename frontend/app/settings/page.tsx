"use client";
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/store";
import toast from "react-hot-toast";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-border/60">
        <p className="text-[10px] font-mono text-slate-500 tracking-widest">{title}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Toggle({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-mono text-slate-300">{label}</p>
        {sub && <p className="text-[10px] font-mono text-slate-600 mt-0.5">{sub}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${checked ? "bg-cyan-500/40 border border-cyan-500/60" : "bg-slate-800 border border-border/60"}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${checked ? "left-5 bg-cyan-400" : "left-0.5 bg-slate-600"}`} />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [copied, setCopied]         = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [slackAlerts, setSlackAlerts] = useState(false);

  const PROXY_KEY = process.env.NEXT_PUBLIC_PROXY_DISPLAY_KEY ?? "••••••••••••••••••••••••••••••••";

  function copyKey() {
    navigator.clipboard.writeText(PROXY_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("API key copied");
  }

  const isAdmin = user?.role === "admin";

  return (
    <DashboardLayout title="Settings" subtitle="System configuration">
      <div className="max-w-2xl space-y-4">

        {/* Proxy API key */}
        <Section title="PROXY ENGINE API KEY">
          <p className="text-xs font-mono text-slate-500 mb-3">
            Used by the Proxy Engine (PRD 3) to authenticate with this backend. Set as <code className="text-cyan-400">PROXY_SECRET_KEY</code> in both <code className="text-cyan-400">.env</code> files.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-900/60 border border-border/60 rounded px-3 py-2 font-mono text-xs text-slate-500 truncate">
              {isAdmin ? PROXY_KEY : "•".repeat(32)}
            </div>
            {isAdmin && (
              <button
                onClick={copyKey}
                className="px-3 py-2 text-[11px] font-mono border border-border/60 text-slate-500 rounded hover:border-cyan-500/40 hover:text-cyan-400 transition-colors tracking-widest flex-shrink-0"
              >
                {copied ? "COPIED" : "COPY"}
              </button>
            )}
          </div>
          {!isAdmin && <p className="text-[10px] font-mono text-slate-700 mt-2">Admin access required to view the key.</p>}
        </Section>

        {/* Notifications */}
        <Section title="NOTIFICATIONS">
          <div className="divide-y divide-border/40">
            <Toggle label="Email alerts" sub="Receive incident reports by email" checked={emailAlerts} onChange={setEmailAlerts} />
            <Toggle label="Critical only" sub="Only alert on critical risk incidents" checked={criticalOnly} onChange={setCriticalOnly} />
            <Toggle label="Slack integration" sub="Post alerts to Slack channel" checked={slackAlerts} onChange={setSlackAlerts} />
          </div>
          <button
            onClick={() => toast.success("Notification settings saved")}
            className="mt-4 px-4 py-2 text-[11px] font-mono bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 rounded hover:bg-cyan-500/20 transition-colors tracking-widest"
          >
            SAVE PREFERENCES
          </button>
        </Section>

        {/* Team */}
        {isAdmin && (
          <Section title="TEAM ACCOUNTS">
            <p className="text-xs font-mono text-slate-500 mb-3">Manage operator accounts from the Users page. Admin accounts have full access to all configuration, API keys, and team management.</p>
            <div className="flex gap-3">
              <a href="/users" className="px-4 py-2 text-[11px] font-mono border border-border/60 text-slate-500 rounded hover:border-cyan-500/40 hover:text-cyan-400 transition-colors tracking-widest">
                MANAGE USERS →
              </a>
            </div>
          </Section>
        )}

        {/* Connection info */}
        <Section title="CONNECTION INFO">
          <div className="space-y-2">
            {[
              { label: "Backend API",   value: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api" },
              { label: "WebSocket",     value: process.env.NEXT_PUBLIC_WS_URL  ?? "ws://localhost:4000/ws/events" },
              { label: "Current User",  value: `${user?.name} (${user?.role})` },
              { label: "Department",    value: user?.department ?? "—" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-1.5 border-b border-border/30 last:border-0">
                <span className="text-[10px] font-mono text-slate-600 tracking-widest">{label.toUpperCase()}</span>
                <span className="text-[11px] font-mono text-slate-400">{value}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </DashboardLayout>
  );
}
