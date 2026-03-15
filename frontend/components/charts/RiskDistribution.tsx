'use client'

import React from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import type { Incident } from '@/types'

interface Props { incidents: Incident[] }

const COLORS: Record<string, string> = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#eab308',
  low:      '#22c55e',
  safe:     '#3b82f6',
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div className="ag-card px-3 py-2 text-xs font-mono">
      <span className="capitalize text-white/70">{name}: </span>
      <span className="text-white font-semibold">{value}</span>
    </div>
  )
}

export function RiskDistribution({ incidents }: Props) {
  const counts: Record<string, number> = {}
  incidents.forEach(i => { counts[i.risk_level] = (counts[i.risk_level] ?? 0) + 1 })
  const data = Object.entries(counts).map(([name, value]) => ({ name, value }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius="55%"
          outerRadius="75%"
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name] ?? '#888'} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '9px', fontFamily: 'JetBrains Mono', color: 'rgba(255,255,255,0.4)' }}
          formatter={(val) => <span className="capitalize text-white/50">{val}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
