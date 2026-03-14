"use client";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { getUser, getUserIncidents } from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RiskBadge, PlatformIcon, ActionBadge } from "@/components/ui";
import { formatTs, riskBarColor } from "@/lib/utils";
import { Incident } from "@/types";
import clsx from "clsx";

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: user }      = useQuery({ queryKey: ["user", id], queryFn: () => getUser(id).then((r) => r.data) });
  const { data: incidents } = useQuery({ queryKey: ["user-incidents", id], queryFn: () => getUserIncidents(id).then((r) => r.data) });

  return (
    <DashboardLayout title="User Profile" subtitle={user?.email ?? "Loading..."}>
      <button onClick={() => router.back()} className="mb-4 text-[11px] font-mono text-slate-600 hover:text-cyan-400 transition-colors tracking-widest">← BACK</button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile card */}
        <div className="glass rounded-xl p-5 h-fit space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-slate-800 border border-border/60 flex items-center justify-center">
              <span className="text-lg font-mono text-slate-400">
                {user?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() ?? "??"}
              </span>
            </div>
            <div>
              <p className="font-mono font-semibold text-slate-200">{user?.name ?? "—"}</p>
              <p className="text-xs font-mono text-slate-600">{user?.email ?? "—"}</p>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-border/60">
            {[
              { label: "Department", value: user?.department },
              { label: "Role",       value: user?.role?.toUpperCase() },
              { label: "Member since", value: user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-[10px] font-mono text-slate-600 tracking-widest">{label.toUpperCase()}</span>
                <span className="text-[11px] font-mono text-slate-400">{value ?? "—"}</span>
              </div>
            ))}
          </div>

          {/* Risk score */}
          <div className="pt-2 border-t border-border/60">
            <div className="flex justify-between mb-2">
              <span className="text-[10px] font-mono text-slate-600 tracking-widest">RISK SCORE</span>
              <span className={clsx("text-sm font-mono font-bold", riskBarColor(user?.risk_score ?? 0).replace("bg-", "text-"))}>
                {user?.risk_score ?? "—"}
              </span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={clsx("h-full rounded-full transition-all duration-1000", riskBarColor(user?.risk_score ?? 0))}
                style={{ width: `${user?.risk_score ?? 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Incident history */}
        <div className="lg:col-span-2 glass rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border/60">
            <p className="text-[10px] font-mono text-slate-500 tracking-widest">INCIDENT HISTORY</p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/60">
                {["Timestamp", "Platform", "Risk", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-2 text-[10px] font-mono text-slate-600 tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(incidents ?? []).map((inc: Incident) => (
                <tr key={inc.id} onClick={() => router.push(`/incidents/${inc.id}`)} className="table-row-hover border-b border-border/30 last:border-0">
                  <td className="px-4 py-3 text-[11px] font-mono text-slate-500">{formatTs(inc.timestamp)}</td>
                  <td className="px-4 py-3"><PlatformIcon platform={inc.ai_platform} /></td>
                  <td className="px-4 py-3"><RiskBadge level={inc.risk_level} /></td>
                  <td className="px-4 py-3"><ActionBadge action={inc.action} /></td>
                </tr>
              ))}
              {!incidents?.length && (
                <tr><td colSpan={4} className="text-center py-8 text-xs font-mono text-slate-700">NO INCIDENTS</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
