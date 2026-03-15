"use client";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { getIncident, getUserIncidents } from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RiskBadge, PlatformIcon, ActionBadge, ThreatTag } from "@/components/ui";
import { formatTs, RISK_CONFIG } from "@/lib/utils";
import clsx from "clsx";

function Redacted({ text }: { text: string | null }) {
  if (!text) return <span className="text-slate-700 font-mono text-xs italic">— no data —</span>;
  return (
    <pre className="text-xs font-mono text-slate-400 bg-slate-900/60 border border-border/60 rounded p-3 whitespace-pre-wrap break-all leading-relaxed">
      {text}
    </pre>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-mono text-slate-600 tracking-widest mb-1">{label.toUpperCase()}</p>
      <div>{children}</div>
    </div>
  );
}

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: incident, isLoading } = useQuery({
    queryKey: ["incident", id],
    queryFn:  () => getIncident(id).then((r) => r.data),
    enabled:  !!id,
  });

  const { data: relatedRaw } = useQuery({
    queryKey: ["user-incidents", incident?.user_id],
    queryFn:  () => getUserIncidents(incident!.user_id!).then((r) => r.data),
    enabled:  !!incident?.user_id,
  });

  const related = relatedRaw?.filter((i: { id: string }) => i.id !== id).slice(0, 5) ?? [];
  const cfg = incident ? RISK_CONFIG[incident.risk_level as keyof typeof RISK_CONFIG] : null;

  if (isLoading) {
    return (
      <DashboardLayout title="Incident Detail">
        <p className="text-xs font-mono text-slate-600 py-20 text-center">LOADING...</p>
      </DashboardLayout>
    );
  }

  if (!incident) {
    return (
      <DashboardLayout title="Incident Detail">
        <p className="text-xs font-mono text-red-500 py-20 text-center">INCIDENT NOT FOUND</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Incident Detail" subtitle={`ID: ${incident.id}`}>
      <button
        onClick={() => router.back()}
        className="mb-4 text-[11px] font-mono text-slate-600 hover:text-cyan-400 transition-colors tracking-widest"
      >
        ← BACK
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main detail */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header card */}
          <div className={clsx("glass rounded-xl p-5 border-l-4", cfg?.border)}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <RiskBadge level={incident.risk_level} />
                <PlatformIcon platform={incident.ai_platform} size="md" />
                <ActionBadge action={incident.action} />
                {incident.sanitized && (
                  <span className="text-[11px] font-mono text-cyan-400 border border-cyan-800/60 bg-cyan-950/50 px-2 py-0.5 rounded">SANITIZED</span>
                )}
              </div>
              <span className="text-[10px] font-mono text-slate-600">{formatTs(incident.timestamp)}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Department">{<span className="text-sm font-mono text-slate-300">{incident.department ?? "—"}</span>}</Field>
              <Field label="Device ID">{<span className="text-xs font-mono text-slate-500">{incident.device_id ?? "—"}</span>}</Field>
              <Field label="User ID">{<span className="text-xs font-mono text-slate-500 break-all">{incident.user_id ?? "—"}</span>}</Field>
            </div>
          </div>

          {/* Threat types */}
          <div className="glass rounded-xl p-4">
            <p className="text-[10px] font-mono text-slate-600 tracking-widest mb-3">DETECTED THREATS</p>
            <div className="flex flex-wrap gap-2">
              {incident.threat_types.length
                ? incident.threat_types.map((t: string) => <ThreatTag key={t} type={t} />)
                : <span className="text-xs font-mono text-slate-600">NO THREATS TAGGED</span>
              }
            </div>
          </div>

          {/* Prompt preview */}
          <div className="glass rounded-xl p-4">
            <p className="text-[10px] font-mono text-slate-600 tracking-widest mb-3">PROMPT PREVIEW</p>
            <Redacted text={incident.prompt_preview} />
          </div>

          {/* Response preview */}
          <div className="glass rounded-xl p-4">
            <p className="text-[10px] font-mono text-slate-600 tracking-widest mb-3">AI RESPONSE PREVIEW</p>
            <Redacted text={incident.response_preview} />
          </div>
        </div>

        {/* Related incidents timeline */}
        <div className="glass rounded-xl p-4 h-fit">
          <p className="text-[10px] font-mono text-slate-600 tracking-widest mb-4">RELATED INCIDENTS</p>
          {related.length === 0 && (
            <p className="text-xs font-mono text-slate-700 text-center py-6">NO RELATED INCIDENTS</p>
          )}
          <div className="relative">
            {related.map((r: { id: string; timestamp: string; risk_level: "critical" | "high" | "medium" | "low" | "safe"; ai_platform: "chatgpt" | "claude" | "gemini" | "copilot" | "mistral" | "groq" | "other"; action: string }, i: number) => {
              const rc = RISK_CONFIG[r.risk_level];
              return (
                <div
                  key={r.id}
                  onClick={() => router.push(`/incidents/${r.id}`)}
                  className="flex gap-3 mb-4 cursor-pointer group"
                >
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <span className={clsx("w-2 h-2 rounded-full mt-1 flex-shrink-0", rc.dot)} />
                    {i < related.length - 1 && <span className="w-px flex-1 bg-border/60 mt-1" />}
                  </div>
                  <div className="pb-3 group-hover:opacity-80 transition-opacity">
                    <p className="text-[10px] font-mono text-slate-600 mb-0.5">{formatTs(r.timestamp)}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <RiskBadge level={r.risk_level} />
                      <PlatformIcon platform={r.ai_platform} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
