"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  AlertCircle, 
  Users, 
  ShieldCheck, 
  Settings, 
  LogOut,
  ChevronRight,
  Menu
} from "lucide-react";
import { useAuthStore, useLiveStore } from "@/store";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "from-blue-500 to-cyan-500" },
  { id: "incidents", label: "Incidents", href: "/incidents", icon: AlertCircle, color: "from-orange-500 to-red-500" },
  { id: "users", label: "Users", href: "/users", icon: Users, color: "from-green-500 to-emerald-500" },
  { id: "policies", label: "Policies", href: "/policies", icon: ShieldCheck, color: "from-purple-500 to-pink-500" },
  { id: "settings", label: "Settings", href: "/settings", icon: Settings, color: "from-slate-500 to-slate-700" },
  { id: "logout", label: "Logout", href: "/logout", icon: LogOut, color: "from-red-600 to-red-800" },
];

export function OrbitalNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { clearAuth } = useAuthStore();
  const connected = useLiveStore((s) => s.connected);
  
  const [isMinimized, setIsMinimized] = useState(true);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  
  const autoRotateRef = useRef<number>();

  useEffect(() => {
    if (!isMinimized && !isHovering && !navigatingTo) {
      autoRotateRef.current = window.setInterval(() => {
        setRotationAngle((prev) => (prev + 0.5) % 360);
      }, 50);
    } else {
      clearInterval(autoRotateRef.current);
    }
    return () => clearInterval(autoRotateRef.current);
  }, [isMinimized, isHovering, navigatingTo]);

  useEffect(() => {
    // Close the nav once the route successfully changes
    if (navigatingTo) {
      setNavigatingTo(null);
      setIsMinimized(true);
    }
  }, [pathname]);

  const handleNav = (item: typeof NAV_ITEMS[0]) => {
    if (item.id === "logout") {
      clearAuth();
      router.push("/login");
    } else {
      setNavigatingTo(item.id);
      router.push(item.href);
      // Wait for pathname to change to minimize, providing better perceived performance.
    }
  };

  const calculatePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const radius = 120;
    const radian = (angle * Math.PI) / 180;
    const x = Math.cos(radian) * radius;
    const y = Math.sin(radian) * radius;
    return { x, y };
  };

  if (isMinimized) {
    return (
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="group relative flex items-center justify-center w-12 h-12 rounded-xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl hover:border-cyan-500/50 transition-all duration-300"
        >
          <div className="absolute inset-0 rounded-xl bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Menu className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
          
          {/* Active indicator dot */}
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-500 border-2 border-black" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="relative flex items-center justify-center"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Central Core */}
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_50px_rgba(6,182,212,0.5)] flex items-center justify-center z-10 animate-pulse">
          <div className="w-16 h-16 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/10">
            <span className="text-xl font-mono font-bold text-white tracking-widest">AG</span>
          </div>
          
          {/* Close button inside core */}
          <button 
            onClick={() => setIsMinimized(true)}
            className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-slate-900 border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Orbit Path Ring */}
        <div className="absolute w-[240px] h-[240px] rounded-full border border-white/5" />

        {/* Navigation Nodes */}
        {NAV_ITEMS.map((item, index) => {
          const { x, y } = calculatePosition(index, NAV_ITEMS.length);
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <button
              key={item.id}
              onClick={() => handleNav(item)}
              style={{
                transform: `translate(${x}px, ${y}px)`,
              }}
              className={cn(
                "absolute w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all duration-500 hover:scale-110 group",
                isActive 
                  ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.4)]" 
                  : "bg-slate-900/90 text-slate-400 border border-white/10 hover:border-white/40"
              )}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[8px] font-mono font-bold tracking-tighter uppercase">{item.id}</span>
              
              {/* Tooltip on hover */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-black border border-white/10 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {item.label}
              </div>

              {/* Aura effect */}
              <div className={cn(
                "absolute -inset-2 rounded-full blur-md transition-opacity duration-300",
                `bg-gradient-to-br ${item.color}`,
                navigatingTo === item.id ? "opacity-60 animate-ping" : "opacity-0 group-hover:opacity-20"
              )} />
            </button>
          );
        })}
      </div>

      {/* Connection Status simplified */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <div className={cn("w-2 h-2 rounded-full", connected ? "bg-green-500 animate-pulse" : "bg-red-500")} />
        <span className="text-[10px] font-mono text-slate-500 tracking-widest">{connected ? "LIVE" : "OFFLINE"}</span>
      </div>
    </div>
  );
}
