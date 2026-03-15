import React from 'react'
import { cn, RISK_CONFIG } from '@/lib/utils'
import type { RiskLevel } from '@/types'

interface Props { level: RiskLevel; pulse?: boolean; size?: 'sm' | 'md' }

export function RiskBadge({ level, pulse = false, size = 'md' }: Props) {
  const cfg = RISK_CONFIG[level]
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded border font-mono tracking-widest uppercase',
      cfg.bg, cfg.border, cfg.color,
      size === 'sm' ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-1 text-[9px]'
    )}>
      <span className={cn('shrink-0 rounded-full', size === 'sm' ? 'w-1 h-1' : 'w-1.5 h-1.5',
        cfg.dot, pulse ? 'animate-pulse' : ''
      )} />
      {cfg.label}
    </span>
  )
}
