"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getUsers } from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { riskBarColor } from "@/lib/utils";
import { User } from "@/types";
import clsx from "clsx";

export default function UsersPage() {
  const router   = useRouter();
  const [search, setSearch] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn:  () => getUsers().then((r) => r.data),
  });

  const filtered = users.filter((u: User) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="Users" subtitle={`${users.length} registered users`}>
      {/* Search */}
      <div className="glass rounded-xl p-4 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, department..."
          className="w-full bg-slate-900/60 border border-border/80 rounded px-3 py-2 text-sm font-mono text-slate-300 focus:outline-none focus:border-cyan-500/40 placeholder:text-slate-700"
        />
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/60">
              {["User", "Department", "Role", "Risk Score", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[10px] font-mono text-slate-600 tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="text-center py-12 text-xs font-mono text-slate-600">LOADING...</td></tr>
            )}
            {filtered.map((user: User) => (
              <tr
                key={user.id}
                onClick={() => router.push(`/users/${user.id}`)}
                className="table-row-hover border-b border-border/30 last:border-0"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded bg-slate-800 border border-border/60 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-mono text-slate-400">
                        {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-mono text-slate-200">{user.name}</p>
                      <p className="text-[11px] font-mono text-slate-600">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-[11px] font-mono text-slate-400">{user.department ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={clsx(
                    "text-[10px] font-mono px-2 py-0.5 rounded border",
                    user.role === "admin"
                      ? "text-cyan-400 bg-cyan-950/50 border-cyan-800/60"
                      : "text-slate-500 bg-slate-800/50 border-slate-700/60"
                  )}>{user.role.toUpperCase()}</span>
                </td>
                <td className="px-4 py-3 w-48">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={clsx("h-full rounded-full transition-all duration-700", riskBarColor(user.risk_score))}
                        style={{ width: `${user.risk_score}%` }}
                      />
                    </div>
                    <span className={clsx("text-[11px] font-mono w-6 text-right", riskBarColor(user.risk_score).replace("bg-", "text-"))}>
                      {user.risk_score}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[11px] font-mono text-slate-700 hover:text-cyan-400 transition-colors">VIEW →</td>
              </tr>
            ))}
            {!isLoading && !filtered.length && (
              <tr><td colSpan={5} className="text-center py-12 text-xs font-mono text-slate-600">NO USERS FOUND</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
