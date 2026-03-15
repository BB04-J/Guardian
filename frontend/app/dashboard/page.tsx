"use client";
import { useQuery } from "@tanstack/react-query";
import { getStats, getTimeline, getIncidents } from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/StatCard";
import { IncidentCard } from "@/components/incidents/IncidentCard";
import { IncidentTimeline } from "@/components/charts/IncidentTimeline";
import { RiskDistribution } from "@/components/charts/RiskDistribution";
import { useLiveStore } from "@/store";
import { useEffect } from "react";
import { Activity, ShieldAlert, Users, Monitor } from "lucide-react";

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
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Incidents Today"
          value={stats?.totalToday ?? 0}
          sub={`+${stats?.blockedToday ?? 0} blocked`}
          accent
          icon={<Activity className="w-4 h-4" />}
          trend="up"
        />
        <StatCard
          label="Critical Alerts"
          value={stats?.criticalToday ?? 0}
          sub="Require immediate review"
          icon={<ShieldAlert className="w-4 h-4" />}
          trend="up"
        />
        <StatCard
          label="Active Users"
          value={stats?.activeUsers ?? 0}
          sub="Across all departments"
          icon={<Users className="w-4 h-4" />}
        />
        <StatCard
          label="Platforms Detected"
          value={stats?.platformsDetected?.length ?? 0}
          sub={stats?.platformsDetected?.slice(0, 3).join(", ") || "No detection"}
          icon={<Monitor className="w-4 h-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Live feed */}
        <div className="lg:col-span-2 flex flex-col ag-card overflow-hidden" style={{ maxHeight: 520 }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-ag shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <h3 className="font-display text-lg tracking-widest text-white">LIVE FEED</h3>
            </div>
            <span className="font-mono text-[9px] text-ag-muted">{incidents.length} events</span>
          </div>
          <div className="flex-1 overflow-y-auto ag-scroll p-3 space-y-2">
            {incidents.length === 0 && (
              <p className="text-xs font-mono text-slate-600 text-center py-8">AWAITING EVENTS...</p>
            )}
            {incidents.map((inc, i) => (
              <IncidentCard key={inc.id} incident={inc} isNew={i === 0} />
            ))}
          </div>
        </div>

        {/* Charts */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          {/* Timeline chart */}
          <div className="ag-card p-5 flex flex-col" style={{ height: 300 }}>
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div>
                <h3 className="font-display text-lg tracking-widest text-white">INCIDENTS · 24H</h3>
                <p className="font-mono text-[9px] text-ag-muted mt-0.5">Grouped by risk level</p>
              </div>
            </div>
            <div className="flex-1">
              {timeline ? (
                <IncidentTimeline data={timeline} />
              ) : (
                <div className="h-full flex items-center justify-center text-xs font-mono text-slate-700">LOADING...</div>
              )}
            </div>
          </div>

          {/* Risk distribution */}
          <div className="ag-card p-5 flex flex-col" style={{ height: 195 }}>
            <h3 className="font-display text-lg tracking-widest text-white mb-3 shrink-0">RISK DISTRIBUTION</h3>
            <div className="flex-1 flex gap-4">
              <div className="flex-1">
                <RiskDistribution incidents={incidents} />
              </div>
              <div className="flex flex-col justify-center gap-2 shrink-0">
                {(['critical','high','medium','low','safe'] as const).map(level => {
                  const count = incidents.filter(i => i.risk_level === level).length;
                  const colors: Record<string, string> = { critical:'text-red-400', high:'text-orange-400', medium:'text-yellow-400', low:'text-green-400', safe:'text-blue-400' };
                  return (
                    <div key={level} className="flex items-center gap-2">
                      <span className={`font-mono text-[9px] uppercase tracking-wider ${colors[level]}`}>{level}</span>
                      <span className="font-mono text-[10px] text-white/60">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
