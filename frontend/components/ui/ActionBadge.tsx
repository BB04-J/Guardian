import React from 'react'
import { cn, ACTION_CONFIG } from '@/lib/utils'
import type { ActionType } from '@/types'

export function ActionBadge({ action }: { action: ActionType }) {
  const cfg = ACTION_CONFIG[action]
  return (
    <span className={cn('font-mono text-[9px] tracking-widest uppercase', cfg.color)}>
      {cfg.label}
    </span>
  )
}
