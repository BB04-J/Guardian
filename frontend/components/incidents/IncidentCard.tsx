'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { RiskBadge } from '@/components/ui/RiskBadge'
import { PlatformIcon } from '@/components/ui/PlatformIcon'
import { ActionBadge } from '@/components/ui/ActionBadge'
import { cn } from '@/lib/utils'
import type { Incident } from '@/types'

interface Props { incident: Incident; isNew?: boolean }

export function IncidentCard({ incident, isNew }: Props) {
  const router = useRouter()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  return (
    <div
      onClick={() => router.push(`/incidents/${incident.id}`)}
      className={cn(
        'ag-card px-4 py-3 cursor-pointer hover:border-[#FDC221]/20 transition-all duration-200 animate-slide-up',
        isNew && 'border-l-2 border-l-[#FDC221]/60'
      )}
    >
      <div className="flex items-start gap-3">
        <PlatformIcon platform={incident.ai_platform} size="sm" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <RiskBadge level={incident.risk_level} pulse={incident.risk_level === 'critical'} size="sm" />
            <ActionBadge action={incident.action} />
          </div>
          <p className="font-mono text-[10px] text-white/60 truncate">
            {incident.user_id || 'Unknown User'} · {incident.department || 'Unknown Dept'}
          </p>
          {incident.prompt_preview && (
            <p className="font-mono text-[9px] text-ag-muted truncate mt-0.5">
              {incident.prompt_preview.slice(0, 60)}…
            </p>
          )}
        </div>

      </div>

      {(incident.threat_types || []).length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {incident.threat_types.map(t => (
            <span key={t} className="font-mono text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-white/30 border border-white/5 uppercase tracking-wide">
              {t.replace('_', ' ')}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
