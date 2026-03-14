"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useLiveStore } from "@/store";

const NAV = [
  { href: "/dashboard",  label: "Dashboard",  icon: "▦" },
  { href: "/incidents",  label: "Incidents",  icon: "⚡" },
  { href: "/users",      label: "Users",      icon: "◈" },
  { href: "/policies",   label: "Policies",   icon: "⊞" },
  { href: "/settings",   label: "Settings",   icon: "⚙" },
];

export function Sidebar() {
  const path      = usePathname();
  const connected = useLiveStore((s) => s.connected);

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 flex flex-col glass border-r border-border/60 z-30">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
            <span className="text-cyan-400 text-xs font-mono font-bold">AG</span>
          </div>
          <div>
            <p className="text-xs font-mono font-semibold text-slate-100 tracking-wider">GUARDIAN</p>
            <p className="text-[10px] font-mono text-slate-500 tracking-widest">AI RESPONSE</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map((item) => {
          const active = path.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded text-sm font-mono transition-all duration-150",
                active
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/60"
              )}
            >
              <span className="text-base w-4 text-center">{item.icon}</span>
              <span className="tracking-wide text-xs">{item.label.toUpperCase()}</span>
              {active && <span className="ml-auto w-1 h-1 rounded-full bg-cyan-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Connection status */}
      <div className="px-4 py-4 border-t border-border/60">
        <div className="flex items-center gap-2">
          <span className={clsx(
            "w-2 h-2 rounded-full relative",
            connected ? "bg-green-500 pulse-dot text-green-500" : "bg-red-500"
          )} />
          <span className="text-[10px] font-mono text-slate-500 tracking-widest">
            {connected ? "LIVE" : "OFFLINE"}
          </span>
        </div>
        <p className="text-[10px] text-slate-600 mt-1 font-mono">WS STREAM</p>
      </div>
    </aside>
  );
}
