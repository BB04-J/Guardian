# AI Response Guardian — Backend (PRD 2)
### Node.js · Express · SQLite · WebSocket

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env — set JWT_SECRET and PROXY_SECRET_KEY

# 3. Start (dev with auto-reload)
npm run dev

# 4. Start (production)
npm start
```

Server starts at:
- REST API → `http://localhost:4000/api`
- WebSocket → `ws://localhost:4000/ws/events`

Default admin login: `admin@company.com` / `admin123`

---

## Project Structure

```
src/
├── server.js                  ← Entry point
├── db/
│   ├── schema.js              ← DB init + tables
│   └── seed.js                ← Demo data
├── middleware/
│   ├── authMiddleware.js      ← JWT validation
│   └── proxyAuthMiddleware.js ← X-Proxy-Key validation
├── routes/
│   ├── auth.js                ← Login / verify / logout
│   ├── incidents.js           ← CRUD + proxy ingest
│   ├── stats.js               ← Dashboard charts data
│   ├── users.js               ← User risk profiles
│   └── policies.js            ← Scan rule management
├── websocket/
│   └── wsServer.js            ← WS server + broadcast
└── utils/
    ├── jwt.js                 ← Sign / verify tokens
    └── csv.js                 ← CSV export helper
```

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET  | `/api/auth/verify` | JWT | Verify token |
| POST | `/api/auth/logout` | — | Clear cookie |

### Incidents
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET    | `/api/incidents` | JWT | Paginated list with filters |
| GET    | `/api/incidents/export` | JWT | CSV download |
| GET    | `/api/incidents/:id` | JWT | Single incident detail |
| POST   | `/api/incidents` | X-Proxy-Key | Ingest from proxy engine |

### Stats
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/stats/summary` | JWT | Top-bar stats |
| GET | `/api/stats/timeline?hours=24` | JWT | Chart data |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET   | `/api/users` | JWT | All users with risk scores |
| GET   | `/api/users/:id` | JWT | Single user |
| GET   | `/api/users/:id/incidents` | JWT | User's incidents |
| PATCH | `/api/users/:id/risk` | JWT + admin | Override risk score |

### Policies
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET    | `/api/policies` | JWT | All rules |
| POST   | `/api/policies` | JWT + admin | Create custom rule |
| PATCH  | `/api/policies/:id` | JWT + admin | Toggle / update |
| DELETE | `/api/policies/:id` | JWT + admin | Delete custom rule |

---

## WebSocket

Connect: `ws://localhost:4000/ws/events?token=<JWT>`

Events received by client:
```json
{ "type": "new_incident", "data": { ...Incident } }
{ "type": "stats_update", "data": { "totalToday": 5, "criticalToday": 1, ... } }
```

---

## Integration with PRD 3 (Proxy Engine)

The proxy engine posts incidents using a shared secret key:
```bash
curl -X POST http://localhost:4000/api/incidents \
  -H "Content-Type: application/json" \
  -H "X-Proxy-Key: your_proxy_secret_here" \
  -d '{
    "aiPlatform": "chatgpt",
    "riskLevel": "critical",
    "action": "blocked",
    "threatTypes": ["api_key", "credentials"],
    "promptPreview": "Here is my API key: sk-abc...",
    "sanitized": false,
    "deviceId": "device_001"
  }'
```

Make sure `PROXY_SECRET_KEY` in this `.env` matches `PROXY_SECRET_KEY` in the proxy engine's `.env`.

---

## Integration with PRD 1 (Frontend)

Set in the frontend `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_WS_URL=ws://localhost:4000/ws/events
```
