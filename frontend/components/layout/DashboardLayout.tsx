"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store";
import { useWebSocket } from "@/hooks/useWebSocket";
import { OrbitalNav } from "./OrbitalNav";
import { TopNav } from "./TopNav";

interface Props {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: Props) {
  const { token } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useWebSocket(); // Start WS connection for all protected pages

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !token) router.replace("/login");
  }, [mounted, token]);

  if (!mounted) return null;
  if (!token) return null;

  return (
    <div className="flex min-h-screen bg-black text-white">
      <OrbitalNav />
      <div className="flex-1 flex flex-col min-h-screen">
        <TopNav title={title} subtitle={subtitle} />
        <main className="flex-1 p-6 transition-all duration-500">
          {children}
        </main>
      </div>
    </div>
  );
}
