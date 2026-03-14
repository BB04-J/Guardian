"use client";
import clsx from "clsx";
import { Incident } from "@/types";
import { RiskBadge, PlatformIcon, ActionBadge, ThreatTag } from "@/components/ui";
import { RISK_CONFIG, formatTs } from "@/lib/utils";

interface Props { incident: Incident; isNew?: boolean; }

export function IncidentCard({ incident, isNew }: Props) {
  const cfg = RISK_CONFIG[incident.risk_level];
  return (
    <div className={clsx(
      "glass rounded-lg p-3 border-l-2 transition-all duration-300",
      cfg.border,
      isNew && "animate-fade-in ring-1 ring-cyan-500/20"
    )}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <RiskBadge level={incident.risk_level} />
          <PlatformIcon platform={incident.ai_platform} />
        </div>
        <ActionBadge action={incident.action} />
      </div>

      <div className="flex flex-wrap gap-1 mb-2">
        {incident.threat_types.slice(0, 3).map((t) => (
          <ThreatTag key={t} type={t} />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono text-slate-600">{formatTs(incident.timestamp)}</p>
        {incident.department && (
          <span className="text-[10px] font-mono text-slate-600">{incident.department}</span>
        )}
      </div>
    </div>
  );
}
