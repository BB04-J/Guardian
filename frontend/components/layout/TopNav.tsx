"use client";
import { useAuthStore } from "@/store";
import { logout } from "@/lib/api";
import { useRouter } from "next/navigation";

interface TopNavProps { title: string; subtitle?: string; }

export function TopNav({ title, subtitle }: TopNavProps) {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();

  async function handleLogout() {
    try { await logout(); } catch {}
    clearAuth();
    router.push("/login");
  }

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-border/60 glass sticky top-0 z-20">
      <div>
        <h1 className="text-sm font-mono font-semibold text-slate-100 tracking-wider">{title.toUpperCase()}</h1>
        {subtitle && <p className="text-[10px] font-mono text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-xs font-mono text-slate-300">{user?.name ?? "—"}</p>
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">{user?.role ?? "—"}</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 text-[11px] font-mono text-slate-500 border border-border/60 rounded hover:border-red-800/60 hover:text-red-400 transition-colors tracking-widest"
        >
          LOGOUT
        </button>
      </div>
    </header>
  );
}
