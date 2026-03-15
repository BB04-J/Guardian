import React from 'react'
import type { AIPlatform } from '@/types'
import { cn } from '@/lib/utils'

const PLATFORM_COLORS: Record<AIPlatform, string> = {
  chatgpt: 'bg-[#10a37f]/20 text-[#10a37f] border-[#10a37f]/30',
  claude:  'bg-[#d97757]/20 text-[#d97757] border-[#d97757]/30',
  gemini:  'bg-[#1a73e8]/20 text-[#4285f4] border-[#1a73e8]/30',
  copilot: 'bg-[#0078d4]/20 text-[#0078d4] border-[#0078d4]/30',
  mistral: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  groq:    'bg-red-500/20 text-red-400 border-red-500/30',
  other:   'bg-white/10 text-white/70 border-white/20',
}

const PLATFORM_SYMBOLS: Record<AIPlatform, string> = {
  chatgpt: 'ChatGPT',
  claude:  'Claude',
  gemini:  'Gemini',
  copilot: 'Copilot',
  mistral: 'Mistral',
  groq:    'Groq',
  other:   'Other',
}

interface Props { platform: AIPlatform; size?: 'sm' | 'md' | 'lg' }

export function PlatformIcon({ platform, size = 'md' }: Props) {
  const sizeClass = size === 'sm' ? 'w-6 h-6 text-[7px]' : size === 'lg' ? 'w-10 h-10 text-[10px]' : 'w-8 h-8 text-[8px]'
  return (
    <span className={cn(
      'inline-flex items-center justify-center rounded-lg border font-mono font-semibold tracking-wider shrink-0',
      sizeClass, PLATFORM_COLORS[platform]
    )}>
      {PLATFORM_SYMBOLS[platform]}
    </span>
  )
}
