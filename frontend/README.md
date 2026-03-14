# AI Response Guardian — Frontend (PRD 1)
### Next.js 14 · Tailwind CSS · Recharts · Zustand · TanStack Query

---

## Quick Start

```bash
npm install
cp .env.example .env.local   # set API_URL and WS_URL
npm run dev
# Open http://localhost:3000
```

Login: `admin@company.com` / `admin123`

---

## Project Structure

```
app/
├── layout.tsx              ← Root layout (fonts, providers)
├── providers.tsx           ← QueryClient + Toast
├── globals.css             ← Tailwind + glass/scanline effects
├── page.tsx                ← Redirects → /dashboard
├── login/page.tsx
├── dashboard/page.tsx
├── incidents/
│   ├── page.tsx            ← Paginated table + filters
│   └── [id]/page.tsx       ← Detail view
├── users/
│   ├── page.tsx
│   └── [id]/page.tsx
├── policies/page.tsx
└── settings/page.tsx

components/
├── layout/
│   ├── Sidebar.tsx         ← Nav + WS status indicator
│   ├── TopNav.tsx          ← User info + logout
│   └── DashboardLayout.tsx ← Wraps all protected pages + starts WS
├── ui/
│   └── index.tsx           ← RiskBadge, PlatformIcon, StatCard, ThreatTag
├── incidents/
│   └── IncidentCard.tsx    ← Live feed card
└── charts/
    ├── IncidentTimeline.tsx ← 24h line chart (Recharts)
    └── RiskDistribution.tsx ← Threat pie chart

hooks/
└── useWebSocket.ts         ← Auto-connect, auto-reconnect, toast on critical

store/
└── index.ts                ← Auth store + Live incidents store (Zustand)

lib/
├── api.ts                  ← Axios instance + all API calls
└── utils.ts                ← Risk colors, platform labels, formatters

types/
└── index.ts                ← Shared TypeScript types
```

---

## Pages

| Route | Description |
|-------|-------------|
| `/login` | Auth — email + password |
| `/dashboard` | Live feed + stat cards + charts |
| `/incidents` | Paginated table with filters + CSV export |
| `/incidents/[id]` | Full detail — prompts, threats, timeline |
| `/users` | Risk score table |
| `/users/[id]` | User profile + incident history |
| `/policies` | Toggle rules, change thresholds, add custom |
| `/settings` | API key, notifications, connection info |

---

## WebSocket

The `useWebSocket` hook (started in `DashboardLayout`) connects to:
```
ws://localhost:4000/ws/events?token=<JWT>
```

Events handled:
- `new_incident` → prepend to live feed + toast if critical
- `stats_update` → refresh top stat bar

Auto-reconnects with exponential backoff (1s → 2s → 4s → … → 30s max).

---

## Design System

- Font: Geist Sans + Geist Mono (monospace throughout for ops feel)
- Theme: Deep navy canvas (`#080c14`) with grid overlay
- Glass cards: `backdrop-filter: blur` + semi-transparent fills
- Risk colors: Red / Orange / Yellow / Green / Blue
- Scanline overlay on stat cards for CRT aesthetic
