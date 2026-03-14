"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Sidebar } from "./Sidebar";
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

  // On the server (and first client paint), render the full layout shell
  // to avoid hydration mismatch. Auth redirect happens in useEffect.
  if (!mounted) {
    return (
      <div className="flex min-h-screen">
        <div className="fixed left-0 top-0 h-screen w-56 glass border-r border-border/60 z-30" />
        <div className="flex-1 ml-56 flex flex-col min-h-screen">
          <div className="h-14 border-b border-border/60 glass" />
          <main className="flex-1 p-6" />
        </div>
      </div>
    );
  }

  if (!token) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-56 flex flex-col min-h-screen">
        <TopNav title={title} subtitle={subtitle} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
