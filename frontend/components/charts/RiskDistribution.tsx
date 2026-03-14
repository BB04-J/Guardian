"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = { critical: "#ef4444", high: "#f97316", medium: "#eab308", low: "#22c55e", safe: "#3b82f6" };

interface Props { data: { type: string; count: number }[] }

export function RiskDistribution({ data }: Props) {
  const pie = data.map((d) => ({ name: d.type.replace(/_/g, " "), value: d.count, fill: COLORS[d.type as keyof typeof COLORS] ?? "#475569" }));
  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie data={pie} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
          {pie.map((entry, i) => <Cell key={i} fill={entry.fill} stroke="transparent" />)}
        </Pie>
        <Tooltip contentStyle={{ background: "#0d1424", border: "1px solid #1e2d45", borderRadius: 6, fontSize: 11, fontFamily: "var(--font-geist-mono)" }} />
        <Legend wrapperStyle={{ fontSize: 10, fontFamily: "var(--font-geist-mono)" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
