const WebSocket = require('ws');
const { verifyToken } = require('../utils/jwt');

let wss = null;

function initWebSocket(server) {
  wss = new WebSocket.Server({ server, path: '/ws/events' });

  wss.on('connection', (ws, req) => {
    // ── Auth ──────────────────────────────────────────────────────────────────
    let token = null;

    // Accept token from query string: ws://host/ws/events?token=<jwt>
    const url = new URL(req.url, 'http://localhost');
    token = url.searchParams.get('token');

    // Or from Authorization header (some WS clients support this)
    if (!token) {
      const auth = req.headers['authorization'];
      if (auth?.startsWith('Bearer ')) token = auth.slice(7);
    }

    if (!token || !verifyToken(token)) {
      ws.close(1008, 'Unauthorized');
      return;
    }

    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    console.log(`[WS] Client connected. Total: ${wss.clients.size}`);

    ws.on('close', () => {
      console.log(`[WS] Client disconnected. Total: ${wss.clients.size}`);
    });
  });

  // ── Heartbeat — drop stale connections every 30s ──────────────────────────
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) { ws.terminate(); return; }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30_000);

  wss.on('close', () => clearInterval(heartbeat));

  console.log('[WS] WebSocket server ready at /ws/events');
  return wss;
}

// ── Broadcast helpers ─────────────────────────────────────────────────────────

function broadcast(type, data) {
  if (!wss) return;
  const msg = JSON.stringify({ type, data });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

// Called after a new incident is saved — notifies all dashboard clients
function broadcastIncident(incident) {
  broadcast('new_incident', incident);
}

// Called after stats change — keeps the top stat bar in sync
function broadcastStatsUpdate(stats) {
  broadcast('stats_update', stats);
}

module.exports = { initWebSocket, broadcastIncident, broadcastStatsUpdate };
