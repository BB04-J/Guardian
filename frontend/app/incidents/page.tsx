"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getIncidents, exportIncidents } from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RiskBadge, PlatformIcon, ActionBadge, ThreatTag } from "@/components/ui";
import { formatTs } from "@/lib/utils";
import { Incident } from "@/types";
import toast from "react-hot-toast";

const RISK_OPTS     = ["", "critical", "high", "medium", "low", "safe"];
const PLATFORM_OPTS = ["", "chatgpt", "claude", "gemini", "copilot", "mistral", "groq"];
const ACTION_OPTS   = ["", "blocked", "warned", "allowed", "sanitized"];

export default function IncidentsPage() {
  const router  = useRouter();
  const [page,       setPage]       = useState(1);
  const [riskLevel,  setRiskLevel]  = useState("");
  const [platform,   setPlatform]   = useState("");
  const [department, setDepartment] = useState("");
  const [action,     setAction]     = useState("");

  const params = Object.fromEntries(
    Object.entries({ page, limit: 20, riskLevel, platform, department, action }).filter(([, v]) => v !== "")
  );

  const { data, isLoading } = useQuery({
    queryKey: ["incidents", params],
    queryFn:  () => getIncidents(params as Record<string, string | number>).then((r) => r.data),
  });

  async function handleExport() {
    try {
      const res = await exportIncidents({ riskLevel, platform, department, action });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement("a");
      a.href = url; a.download = "guardian-incidents.csv"; a.click();
    } catch { toast.error("Export failed"); }
  }

  const selectClass = "bg-slate-900/60 border border-border/80 rounded px-2 py-1.5 text-[11px] font-mono text-slate-400 focus:outline-none focus:border-cyan-500/40 w-full";

  return (
    <DashboardLayout title="Incidents" subtitle={`${data?.total ?? "—"} total records`}>
      {/* Filters */}
      <div className="glass rounded-xl p-4 mb-4">
        <p className="text-[10px] font-mono text-slate-600 tracking-widest mb-3">FILTERS</p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <select value={riskLevel} onChange={(e) => { setRiskLevel(e.target.value); setPage(1); }} className={selectClass}>
            <option value="">All risk levels</option>
            {RISK_OPTS.slice(1).map((v) => <option key={v} value={v}>{v.toUpperCase()}</option>)}
          </select>
          <select value={platform} onChange={(e) => { setPlatform(e.target.value); setPage(1); }} className={selectClass}>
            <option value="">All platforms</option>
            {PLATFORM_OPTS.slice(1).map((v) => <option key={v} value={v}>{v.toUpperCase()}</option>)}
          </select>
          <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} className={selectClass}>
            <option value="">All actions</option>
            {ACTION_OPTS.slice(1).map((v) => <option key={v} value={v}>{v.toUpperCase()}</option>)}
          </select>
          <input
            value={department}
            onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
            placeholder="Department..."
            className={selectClass}
          />
          <button onClick={handleExport} className="px-3 py-1.5 text-[11px] font-mono border border-border/60 text-slate-500 rounded hover:border-cyan-500/40 hover:text-cyan-400 transition-colors tracking-widest">
            EXPORT CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/60">
              {["Timestamp", "Platform", "Risk", "Threats", "Action", "Dept"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[10px] font-mono text-slate-600 tracking-widest">{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="text-center py-12 text-xs font-mono text-slate-600">LOADING...</td></tr>
            )}
            {data?.data?.map((inc: Incident) => (
              <tr
                key={inc.id}
                onClick={() => router.push(`/incidents/${inc.id}`)}
                className="table-row-hover border-b border-border/30 last:border-0"
              >
                <td className="px-4 py-3 text-[11px] font-mono text-slate-500">{formatTs(inc.timestamp)}</td>
                <td className="px-4 py-3"><PlatformIcon platform={inc.ai_platform} /></td>
                <td className="px-4 py-3"><RiskBadge level={inc.risk_level} /></td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {inc.threat_types.slice(0, 2).map((t) => <ThreatTag key={t} type={t} />)}
                    {inc.threat_types.length > 2 && <span className="text-[10px] font-mono text-slate-600">+{inc.threat_types.length - 2}</span>}
                  </div>
                </td>
                <td className="px-4 py-3"><ActionBadge action={inc.action} /></td>
                <td className="px-4 py-3 text-[11px] font-mono text-slate-500">{inc.department ?? "—"}</td>
              </tr>
            ))}
            {!isLoading && !data?.data?.length && (
              <tr><td colSpan={6} className="text-center py-12 text-xs font-mono text-slate-600">NO INCIDENTS FOUND</td></tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/60">
            <span className="text-[11px] font-mono text-slate-600">
              PAGE {data.page} OF {data.pages} — {data.total} RECORDS
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-[11px] font-mono border border-border/60 text-slate-500 rounded hover:border-cyan-500/40 hover:text-cyan-400 transition-colors disabled:opacity-30"
              >PREV</button>
              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="px-3 py-1 text-[11px] font-mono border border-border/60 text-slate-500 rounded hover:border-cyan-500/40 hover:text-cyan-400 transition-colors disabled:opacity-30"
              >NEXT</button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
