"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPolicies, updatePolicy, createPolicy, deletePolicy } from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Policy } from "@/types";
import toast from "react-hot-toast";
import clsx from "clsx";

// ── Constants ─────────────────────────────────────────────────────────────────

const THRESHOLD_COLORS: Record<string, string> = {
  block:    "text-red-400",
  warn:     "text-yellow-400",
  allow:    "text-green-400",
  sanitize: "text-cyan-400",
};

// All AI platforms the proxy can monitor — with display info
const AI_PLATFORMS = [
  { id: "chatgpt",  label: "ChatGPT / OpenAI",     icon: "🤖", desc: "api.openai.com, chat.openai.com" },
  { id: "claude",   label: "Anthropic / Claude",    icon: "🧠", desc: "api.anthropic.com, claude.ai" },
  { id: "gemini",   label: "Google Gemini",         icon: "✨", desc: "generativelanguage.googleapis.com" },
  { id: "copilot",  label: "Microsoft Copilot",     icon: "🪟", desc: "copilot.microsoft.com, Azure OpenAI" },
  { id: "other",    label: "Others (Mistral, Cohere, HF…)", icon: "🔗", desc: "api.mistral.ai, api.cohere.ai, etc." },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function PoliciesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [newName,    setNewName]    = useState("");
  const [newPattern, setNewPattern] = useState("");
  const [newThresh,  setNewThresh]  = useState("warn");

  const { data: policies = [], isLoading } = useQuery({
    queryKey: ["policies"],
    queryFn:  () => getPolicies().then((r) => r.data),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      updatePolicy(id, { enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["policies"] }),
    onError:   () => toast.error("Failed to update policy"),
  });

  const threshMutation = useMutation({
    mutationFn: ({ id, threshold }: { id: string; threshold: string }) =>
      updatePolicy(id, { threshold }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["policies"] }); toast.success("Threshold updated"); },
    onError:   () => toast.error("Failed to update threshold"),
  });

  const createMutation = useMutation({
    mutationFn: () => createPolicy({ name: newName, pattern: newPattern, threshold: newThresh }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["policies"] });
      toast.success("Policy created");
      setShowForm(false); setNewName(""); setNewPattern("");
    },
    onError: () => toast.error("Failed to create policy"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePolicy(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["policies"] }); toast.success("Policy deleted"); },
    onError:   () => toast.error("Cannot delete builtin policies"),
  });

  // Create / remove a platform_allow policy for a given platform id
  const whitelistToggle = useMutation({
    mutationFn: ({ platform, enable }: { platform: string; enable: boolean; policyId?: string }) => {
      if (!enable) return Promise.resolve({ data: null } as any);
      return createPolicy({
        name:      `Trusted Platform: ${platform}`,
        pattern:   platform,
        threshold: "allow",
        type:      "platform_allow",
      });
    },
    onSuccess: (_, vars) => {
      if (!vars.enable && vars.policyId) {
        deletePolicy(vars.policyId).then(() => qc.invalidateQueries({ queryKey: ["policies"] }));
      } else {
        qc.invalidateQueries({ queryKey: ["policies"] });
      }
      toast.success(vars.enable ? "Platform whitelisted ✓" : "Platform removed from whitelist");
    },
    onError: () => toast.error("Failed to update platform whitelist"),
  });

  const builtin     = policies.filter((p: Policy) => p.type === "builtin");
  const custom      = policies.filter((p: Policy) => p.type === "custom");
  const whitelisted = policies.filter((p: Policy) => p.type === "platform_allow");

  const whitelistedIds = new Set(whitelisted.map((p: Policy) => p.pattern));

  const selectClass = "bg-slate-900/60 border border-border/80 rounded px-2 py-1 text-[11px] font-mono text-slate-400 focus:outline-none focus:border-cyan-500/40";

  return (
    <DashboardLayout title="Policies" subtitle="Scan rule management">

      {/* ── Trusted Platform Whitelist ────────────────────────────────────── */}
      <div className="glass rounded-xl overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-border/60 flex items-center gap-3">
          <span className="text-green-400 text-sm">🛡</span>
          <div>
            <p className="text-[10px] font-mono text-slate-400 tracking-widest">TRUSTED PLATFORM WHITELIST</p>
            <p className="text-[10px] font-mono text-slate-600 mt-0.5">
              Whitelisted platforms bypass scanning entirely — use for contracted / approved AI tools
            </p>
          </div>
        </div>
        <div className="divide-y divide-border/20">
          {AI_PLATFORMS.map((p) => {
            const enabled = whitelistedIds.has(p.id);
            const policy  = whitelisted.find((w: Policy) => w.pattern === p.id);
            return (
              <div key={p.id} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-800/20 transition-colors">
                <span className="text-xl w-6 text-center">{p.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={clsx("text-sm font-mono truncate", enabled ? "text-green-300" : "text-slate-300")}>
                    {p.label}
                    {enabled && (
                      <span className="ml-2 text-[9px] font-mono bg-green-500/10 border border-green-500/30 text-green-400 px-1.5 py-0.5 rounded tracking-widest">
                        WHITELISTED
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] font-mono text-slate-600 truncate mt-0.5">{p.desc}</p>
                </div>
                {/* Toggle */}
                <button
                  onClick={() =>
                    whitelistToggle.mutate({ platform: p.id, enable: !enabled, policyId: policy?.id })
                  }
                  className={clsx(
                    "w-10 h-5 rounded-full transition-all duration-300 relative flex-shrink-0",
                    enabled
                      ? "bg-green-500/40 border border-green-500/60"
                      : "bg-slate-800 border border-border/60"
                  )}
                  title={enabled ? "Remove from whitelist" : "Add to whitelist"}
                >
                  <span className={clsx(
                    "absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300",
                    enabled ? "left-5 bg-green-400" : "left-0.5 bg-slate-600"
                  )} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Rate Limit Banner ─────────────────────────────────────────────── */}
      <div className="glass rounded-xl overflow-hidden mb-4 border border-orange-500/20">
        <div className="px-4 py-3 border-b border-border/60 flex items-center gap-3">
          <span className="text-orange-400 text-sm">⏱</span>
          <div>
            <p className="text-[10px] font-mono text-slate-400 tracking-widest">RATE LIMITING</p>
            <p className="text-[10px] font-mono text-slate-600 mt-0.5">
              Configured in the Proxy Engine — blocks IPs that exceed the prompt threshold
            </p>
          </div>
        </div>
        <div className="px-4 py-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          <div className="bg-slate-900/60 rounded-lg p-3 border border-border/40">
            <p className="text-2xl font-mono font-bold text-orange-400">50</p>
            <p className="text-[10px] font-mono text-slate-500 mt-1 tracking-widest">PROMPTS / MINUTE</p>
            <p className="text-[9px] font-mono text-slate-600 mt-1">max per IP before block</p>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-3 border border-border/40">
            <p className="text-2xl font-mono font-bold text-orange-400">429</p>
            <p className="text-[10px] font-mono text-slate-500 mt-1 tracking-widest">HTTP RESPONSE</p>
            <p className="text-[9px] font-mono text-slate-600 mt-1">Too Many Requests</p>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-3 border border-border/40">
            <p className="text-2xl font-mono font-bold text-red-400">📊</p>
            <p className="text-[10px] font-mono text-slate-500 mt-1 tracking-widest">INCIDENT LOGGED</p>
            <p className="text-[9px] font-mono text-slate-600 mt-1">rate_limit_exceeded</p>
          </div>
        </div>
        <div className="px-4 pb-3">
          <p className="text-[10px] font-mono text-slate-600 text-center">
            To change limits, edit <span className="text-orange-400/70">RATE_LIMIT_PROMPTS</span> and{" "}
            <span className="text-orange-400/70">RATE_LIMIT_WINDOW</span> in{" "}
            <span className="text-slate-500">proxy/.env</span> and restart the proxy.
          </p>
        </div>
      </div>

      {/* ── Large File Upload Banner ──────────────────────────────────────── */}
      <div className="glass rounded-xl overflow-hidden mb-4 border border-yellow-500/20">
        <div className="px-4 py-3 border-b border-border/60 flex items-center gap-3">
          <span className="text-yellow-400 text-sm">📁</span>
          <div>
            <p className="text-[10px] font-mono text-slate-400 tracking-widest">LARGE FILE UPLOAD BLOCKING</p>
            <p className="text-[10px] font-mono text-slate-600 mt-0.5">
              Multipart uploads or payloads exceeding the body limit are rejected at the proxy
            </p>
          </div>
        </div>
        <div className="px-4 py-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          <div className="bg-slate-900/60 rounded-lg p-3 border border-border/40">
            <p className="text-2xl font-mono font-bold text-yellow-400">512 KB</p>
            <p className="text-[10px] font-mono text-slate-500 mt-1 tracking-widest">MAX BODY SIZE</p>
            <p className="text-[9px] font-mono text-slate-600 mt-1">default threshold</p>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-3 border border-border/40">
            <p className="text-2xl font-mono font-bold text-yellow-400">413</p>
            <p className="text-[10px] font-mono text-slate-500 mt-1 tracking-widest">HTTP RESPONSE</p>
            <p className="text-[9px] font-mono text-slate-600 mt-1">Payload Too Large</p>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-3 border border-border/40">
            <p className="text-2xl font-mono font-bold text-red-400">📊</p>
            <p className="text-[10px] font-mono text-slate-500 mt-1 tracking-widest">INCIDENT LOGGED</p>
            <p className="text-[9px] font-mono text-slate-600 mt-1">large_file_upload</p>
          </div>
        </div>
        <div className="px-4 pb-3">
          <p className="text-[10px] font-mono text-slate-600 text-center">
            To change the limit, edit <span className="text-yellow-400/70">MAX_BODY_BYTES</span> in{" "}
            <span className="text-slate-500">proxy/.env</span> and restart the proxy.
          </p>
        </div>
      </div>

      {/* ── Custom Rule Form ─────────────────────────────────────────────── */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 text-[11px] font-mono border border-cyan-500/40 text-cyan-400 rounded hover:bg-cyan-500/10 transition-colors tracking-widest"
        >
          {showForm ? "CANCEL" : "+ ADD CUSTOM RULE"}
        </button>
      </div>

      {showForm && (
        <div className="glass rounded-xl p-4 mb-4 animate-fade-in">
          <p className="text-[10px] font-mono text-slate-500 tracking-widest mb-3">NEW CUSTOM RULE</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Rule name" className="bg-slate-900/60 border border-border/80 rounded px-3 py-2 text-sm font-mono text-slate-300 focus:outline-none focus:border-cyan-500/40 placeholder:text-slate-700" />
            <input value={newPattern} onChange={(e) => setNewPattern(e.target.value)} placeholder="Pattern / keyword / regex" className="bg-slate-900/60 border border-border/80 rounded px-3 py-2 text-sm font-mono text-slate-300 focus:outline-none focus:border-cyan-500/40 placeholder:text-slate-700" />
            <div className="flex gap-2">
              <select value={newThresh} onChange={(e) => setNewThresh(e.target.value)} className={clsx(selectClass, "flex-1 py-2")}>
                {["block", "warn", "allow", "sanitize"].map((v) => <option key={v} value={v}>{v.toUpperCase()}</option>)}
              </select>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!newName || createMutation.isPending}
                className="px-4 py-2 text-[11px] font-mono bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 rounded hover:bg-cyan-500/20 transition-colors disabled:opacity-40 tracking-widest"
              >SAVE</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Builtin rules ────────────────────────────────────────────────── */}
      <PolicySection
        title="BUILTIN RULES"
        policies={builtin}
        loading={isLoading}
        onToggle={(id, enabled) => toggleMutation.mutate({ id, enabled })}
        onThreshold={(id, threshold) => threshMutation.mutate({ id, threshold })}
        selectClass={selectClass}
      />

      {/* ── Custom rules ─────────────────────────────────────────────────── */}
      <div className="mt-4">
        <PolicySection
          title="CUSTOM RULES"
          policies={custom}
          loading={isLoading}
          onToggle={(id, enabled) => toggleMutation.mutate({ id, enabled })}
          onThreshold={(id, threshold) => threshMutation.mutate({ id, threshold })}
          onDelete={(id) => deleteMutation.mutate(id)}
          selectClass={selectClass}
        />
      </div>
    </DashboardLayout>
  );
}

// ── Shared section component ──────────────────────────────────────────────────

function PolicySection({ title, policies, loading, onToggle, onThreshold, onDelete, selectClass }: {
  title: string; policies: Policy[]; loading: boolean;
  onToggle: (id: string, enabled: boolean) => void;
  onThreshold: (id: string, threshold: string) => void;
  onDelete?: (id: string) => void;
  selectClass: string;
}) {
  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border/60">
        <p className="text-[10px] font-mono text-slate-500 tracking-widest">{title}</p>
      </div>
      {loading && <p className="text-xs font-mono text-slate-600 text-center py-8">LOADING...</p>}
      {!loading && policies.length === 0 && <p className="text-xs font-mono text-slate-700 text-center py-8">NO RULES</p>}
      <div className="divide-y divide-border/30">
        {policies.map((p: Policy) => (
          <div key={p.id} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-800/30 transition-colors">
            {/* Toggle */}
            <button
              onClick={() => onToggle(p.id, !p.enabled)}
              className={clsx(
                "w-8 h-4 rounded-full transition-all duration-200 relative flex-shrink-0",
                p.enabled ? "bg-cyan-500/40 border border-cyan-500/60" : "bg-slate-800 border border-border/60"
              )}
            >
              <span className={clsx(
                "absolute top-0.5 w-3 h-3 rounded-full transition-all duration-200",
                p.enabled ? "left-4 bg-cyan-400" : "left-0.5 bg-slate-600"
              )} />
            </button>

            {/* Name + pattern */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-mono text-slate-300 truncate">{p.name}</p>
              {p.pattern && (
                <p className="text-[10px] font-mono text-slate-600 truncate mt-0.5">{p.pattern}</p>
              )}
            </div>

            {/* Threshold selector */}
            <select
              value={p.threshold}
              onChange={(e) => onThreshold(p.id, e.target.value)}
              className={clsx(selectClass, THRESHOLD_COLORS[p.threshold] ?? "text-slate-400")}
            >
              {["block", "warn", "allow", "sanitize"].map((v) => <option key={v} value={v}>{v.toUpperCase()}</option>)}
            </select>

            {/* Delete (custom only) */}
            {onDelete && (
              <button onClick={() => onDelete(p.id)} className="text-[11px] font-mono text-slate-700 hover:text-red-400 transition-colors ml-2">✕</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
