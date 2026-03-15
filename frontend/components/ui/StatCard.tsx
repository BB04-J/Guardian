import React from 'react'
import { cn } from '@/lib/utils'

interface Props {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
  icon?: React.ReactNode
  trend?: 'up' | 'down'
}

export function StatCard({ label, value, sub, accent, icon, trend }: Props) {
  return (
    <div className={cn(
      'ag-card ag-glow p-5 flex flex-col gap-3 transition-all duration-300',
      accent && 'border-[#FDC221]/20 bg-[#FDC221]/[0.03]'
    )}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] text-ag-muted tracking-widest uppercase">{label}</span>
        {icon && <span className="text-ag-muted">{icon}</span>}
      </div>
      <div className={cn('font-display text-5xl leading-none', accent ? 'text-[#FDC221]' : 'text-white')}>
        {value}
      </div>
      {sub && (
        <span className={cn('font-mono text-[9px] tracking-wide',
          trend === 'up' ? 'text-red-400' : trend === 'down' ? 'text-green-400' : 'text-ag-muted'
        )}>
          {sub}
        </span>
      )}
    </div>
  )
}
