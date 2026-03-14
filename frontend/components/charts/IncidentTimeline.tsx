"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TimelineData } from "@/types";
import { format } from "date-fns";

interface Props { data: TimelineData }

export function IncidentTimeline({ data }: Props) {
  const chartData = data.labels.map((label, i) => ({
    time:     format(new Date(label), "HH:mm"),
    critical: data.critical[i],
    high:     data.high[i],
    medium:   data.medium[i],
    low:      data.low[i],
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,45,69,0.6)" />
        <XAxis dataKey="time" tick={{ fill: "#475569", fontSize: 10, fontFamily: "var(--font-geist-mono)" }} tickLine={false} axisLine={false} interval={3} />
        <YAxis tick={{ fill: "#475569", fontSize: 10, fontFamily: "var(--font-geist-mono)" }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ background: "#0d1424", border: "1px solid #1e2d45", borderRadius: 6, fontSize: 11, fontFamily: "var(--font-geist-mono)" }}
          labelStyle={{ color: "#94a3b8" }}
        />
        <Legend wrapperStyle={{ fontSize: 10, fontFamily: "var(--font-geist-mono)", paddingTop: 8 }} />
        <Line type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={1.5} dot={false} />
        <Line type="monotone" dataKey="high"     stroke="#f97316" strokeWidth={1.5} dot={false} />
        <Line type="monotone" dataKey="medium"   stroke="#eab308" strokeWidth={1.5} dot={false} />
        <Line type="monotone" dataKey="low"      stroke="#22c55e" strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
