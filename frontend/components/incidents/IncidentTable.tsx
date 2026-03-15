'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { RiskBadge } from '@/components/ui/RiskBadge'
import { PlatformIcon } from '@/components/ui/PlatformIcon'
import { ActionBadge } from '@/components/ui/ActionBadge'
import { formatTime, formatDate, cn } from '@/lib/utils'
import type { Incident } from '@/types'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  incidents: Incident[]
  total: number
  page: number
  limit: number
  onPageChange: (p: number) => void
}

export function IncidentTable({ incidents, total, page, limit, onPageChange }: Props) {
  const router   = useRouter()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const totalPages = Math.ceil(total / limit)

  const COLS = ['Time', 'User', 'Platform', 'Risk', 'Action', 'Threats', 'Preview']

  return (
    <div className="ag-card overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto ag-scroll">
        <table className="w-full">
          <thead>
            <tr className="border-b border-ag bg-white/[0.015]">
              {COLS.map(c => (
                <th key={c} className="px-4 py-3 text-left font-mono text-[9px] text-ag-muted tracking-widest uppercase">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {incidents.map(inc => (
              <tr
                key={inc.id}
                onClick={() => router.push(`/incidents/${inc.id}`)}
                className="hover:bg-white/[0.02] cursor-pointer transition-colors group"
              >
                <td className="px-4 py-3">
                  <div className="font-mono text-[10px] text-white/60">{mounted ? formatTime(inc.timestamp) : '—'}</div>
                  <div className="font-mono text-[9px] text-ag-muted">{mounted ? formatDate(inc.timestamp) : '—'}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-mono text-[11px] text-white/80">{inc.user_id || 'Unknown User'}</div>
                  <div className="font-mono text-[9px] text-ag-muted">{inc.department}</div>
                </td>
                <td className="px-4 py-3">
                  <PlatformIcon platform={inc.ai_platform} size="sm" />
                </td>
                <td className="px-4 py-3">
                  <RiskBadge level={inc.risk_level} pulse={inc.risk_level === 'critical'} size="sm" />
                </td>
                <td className="px-4 py-3">
                  <ActionBadge action={inc.action} />
                </td>
                <td className="px-4 py-3 max-w-[140px]">
                  <div className="flex gap-1 flex-wrap">
                    {(inc.threat_types || []).slice(0, 2).map(t => (
                      <span key={t} className="font-mono text-[7px] px-1 py-0.5 rounded bg-white/5 text-white/30 border border-white/5 uppercase tracking-wide">
                        {t.replace('_', ' ')}
                      </span>
                    ))}
                    {(inc.threat_types || []).length > 2 && (
                      <span className="font-mono text-[7px] text-ag-muted">+{(inc.threat_types || []).length - 2}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 max-w-[200px]">
                  <p className="font-mono text-[9px] text-ag-muted truncate group-hover:text-white/50 transition-colors">
                    {inc.prompt_preview?.slice(0, 50)}…
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-ag bg-white/[0.01]">
        <span className="font-mono text-[9px] text-ag-muted">
          Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="w-7 h-7 flex items-center justify-center rounded border border-ag text-ag-muted hover:text-white hover:border-white/20 disabled:opacity-30 transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = i + 1
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={cn(
                  'w-7 h-7 flex items-center justify-center rounded border font-mono text-[10px] transition-all',
                  p === page
                    ? 'bg-[#FDC221]/10 border-[#FDC221]/30 text-[#FDC221]'
                    : 'border-ag text-ag-muted hover:text-white hover:border-white/20'
                )}
              >
                {p}
              </button>
            )
          })}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="w-7 h-7 flex items-center justify-center rounded border border-ag text-ag-muted hover:text-white hover:border-white/20 disabled:opacity-30 transition-all"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
