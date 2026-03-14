"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { login } from "@/lib/api";
import { useAuthStore } from "@/store";

export default function LoginPage() {
  const [email, setEmail]       = useState("admin@company.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading]   = useState(false);
  const { setAuth }             = useAuthStore();
  const router                  = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(email, password);
      setAuth(res.data.user, res.data.token);
      router.push("/dashboard");
    } catch {
      toast.error("Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {/* Grid backdrop */}
      <div className="absolute inset-0 bg-grid-faint bg-grid-faint opacity-40 pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/30 mb-4">
            <span className="text-cyan-400 font-mono text-lg font-bold">AG</span>
          </div>
          <h1 className="text-xl font-mono font-bold text-slate-100 tracking-widest">AI RESPONSE GUARDIAN</h1>
          <p className="text-xs font-mono text-slate-500 mt-1 tracking-wider">SECURITY OPERATIONS CONSOLE</p>
        </div>

        <form onSubmit={handleLogin} className="glass rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-mono text-slate-500 tracking-widest mb-1.5">EMAIL ADDRESS</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-900/60 border border-border/80 rounded px-3 py-2.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 transition-colors placeholder:text-slate-700"
              placeholder="operator@company.com"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-slate-500 tracking-widest mb-1.5">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-900/60 border border-border/80 rounded px-3 py-2.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 font-mono text-sm rounded hover:bg-cyan-500/20 hover:border-cyan-500/60 transition-all duration-150 tracking-widest disabled:opacity-50"
          >
            {loading ? "AUTHENTICATING..." : "ACCESS CONSOLE"}
          </button>
        </form>

        <p className="text-center text-[10px] font-mono text-slate-700 mt-4 tracking-widest">
          UNAUTHORIZED ACCESS IS PROHIBITED
        </p>
      </div>
    </div>
  );
}
