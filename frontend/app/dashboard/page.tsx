"use client";
import { useQuery } from "@tanstack/react-query";
import { getStats, getTimeline, getIncidents } from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui";
import { IncidentCard } from "@/components/incidents/IncidentCard";
import { IncidentTimeline } from "@/components/charts/IncidentTimeline";
import { RiskDistribution } from "@/components/charts/RiskDistribution";
import { useLiveStore } from "@/store";
import { useEffect } from "react";

export default function DashboardPage() {
  const { incidents, stats: liveStats, prependIncident, setInitialIncidents } = useLiveStore();

  const { data: statsData } = useQuery({
    queryKey: ["stats"],
    queryFn:  () => getStats().then((r) => r.data),
    refetchInterval: 30_000,
  });

  const { data: timeline } = useQuery({
    queryKey: ["timeline"],
    queryFn:  () => getTimeline(24).then((r) => r.data),
    refetchInterval: 60_000,
  });

  const { data: initialIncidents } = useQuery({
    queryKey: ["incidents-feed"],
    queryFn:  () => getIncidents({ limit: 40, page: 1 }).then((r) => r.data),
  });

  useEffect(() => {
    if (initialIncidents?.data) setInitialIncidents(initialIncidents.data);
  }, [initialIncidents]);

  const stats = liveStats ?? statsData;

  return (
    <DashboardLayout title="Dashboard" subtitle="Real-time AI threat monitoring">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 stagger">
        <StatCard label="Incidents Today"   value={stats?.totalToday     ?? "—"} accent="cyan" />
        <StatCard label="Critical Alerts"   value={stats?.criticalToday  ?? "—"} accent="red" pulse={!!stats?.criticalToday} />
        <StatCard label="Active Users"      value={stats?.activeUsers    ?? "—"} accent="orange" />
        <StatCard label="Platforms Detected" value={stats?.platformsDetected?.length ?? "—"} sub={stats?.platformsDetected?.join(", ")} accent="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Live feed */}
        <div className="lg:col-span-2">
          <div className="glass rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
              <p className="text-[10px] font-mono text-slate-400 tracking-widest">LIVE INCIDENT FEED</p>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 pulse-dot text-green-500" />
                <span className="text-[10px] font-mono text-slate-600">STREAMING</span>
              </span>
            </div>
            <div className="p-3 space-y-2 max-h-[520px] overflow-y-auto">
              {incidents.length === 0 && (
                <p className="text-xs font-mono text-slate-600 text-center py-8">AWAITING EVENTS...</p>
              )}
              {incidents.map((inc, i) => (
                <IncidentCard key={inc.id} incident={inc} isNew={i === 0} />
              ))}
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="lg:col-span-3 space-y-4">
          {/* Timeline */}
          <div className="glass rounded-xl p-4">
            <p className="text-[10px] font-mono text-slate-500 tracking-widest mb-4">INCIDENT TIMELINE — LAST 24H</p>
            {timeline
              ? <IncidentTimeline data={timeline} />
              : <div className="h-[220px] flex items-center justify-center text-xs font-mono text-slate-700">LOADING...</div>
            }
          </div>

          {/* Threat distribution + top threats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass rounded-xl p-4">
              <p className="text-[10px] font-mono text-slate-500 tracking-widest mb-2">THREAT DISTRIBUTION</p>
              {stats?.topThreats?.length
                ? <RiskDistribution data={stats.topThreats} />
                : <div className="h-[180px] flex items-center justify-center text-xs font-mono text-slate-700">NO DATA</div>
              }
            </div>
            <div className="glass rounded-xl p-4">
              <p className="text-[10px] font-mono text-slate-500 tracking-widest mb-3">TOP THREATS</p>
              <div className="space-y-2">
                {(stats?.topThreats ?? []).slice(0, 6).map((t) => (
                  <div key={t.type} className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400 truncate">{t.type.replace(/_/g, " ").toUpperCase()}</span>
                    <span className="text-[11px] font-mono text-cyan-400 ml-2">{t.count}</span>
                  </div>
                ))}
                {!stats?.topThreats?.length && (
                  <p className="text-xs font-mono text-slate-700 py-4 text-center">NO THREATS TODAY</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
