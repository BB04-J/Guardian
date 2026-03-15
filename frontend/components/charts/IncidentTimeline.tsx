'use client'

import React from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts'
import type { Incident } from '@/types'

interface Props { data: any[] }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="ag-card p-3 text-xs font-mono space-y-1 shadow-xl">
      <p className="text-ag-muted mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/60 capitalize">{p.name}:</span>
          <span className="text-white font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export function IncidentTimeline({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis
          dataKey="hour"
          tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
          tickLine={false}
          axisLine={false}
          interval={3}
        />
        <YAxis
          tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(253,194,33,0.15)' }} />
        <Legend
          wrapperStyle={{ fontSize: '9px', fontFamily: 'JetBrains Mono', color: 'rgba(255,255,255,0.4)', paddingTop: '12px' }}
        />
        <Line type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={1.5} dot={false} activeDot={{ r: 4, fill: '#ef4444' }} />
        <Line type="monotone" dataKey="high"     stroke="#f97316" strokeWidth={1.5} dot={false} activeDot={{ r: 4, fill: '#f97316' }} />
        <Line type="monotone" dataKey="medium"   stroke="#eab308" strokeWidth={1.5} dot={false} activeDot={{ r: 4, fill: '#eab308' }} />
        <Line type="monotone" dataKey="low"      stroke="#22c55e" strokeWidth={1.5} dot={false} activeDot={{ r: 4, fill: '#22c55e' }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
