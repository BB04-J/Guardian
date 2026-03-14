const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/schema');
const { toCSV } = require('../utils/csv');
const { authMiddleware } = require('../middleware/authMiddleware');
const { proxyAuthMiddleware } = require('../middleware/proxyAuthMiddleware');
const { broadcastIncident, broadcastStatsUpdate } = require('../websocket/wsServer');

const router = express.Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildFilters(query) {
  const conditions = [];
  const params     = [];

  if (query.riskLevel)   { conditions.push('risk_level = ?');  params.push(query.riskLevel); }
  if (query.platform)    { conditions.push('ai_platform = ?'); params.push(query.platform); }
  if (query.department)  { conditions.push('department = ?');  params.push(query.department); }
  if (query.action)      { conditions.push('action = ?');      params.push(query.action); }
  if (query.startDate)   { conditions.push('timestamp >= ?');  params.push(query.startDate); }
  if (query.endDate)     { conditions.push('timestamp <= ?');  params.push(query.endDate); }

  return {
    where:  conditions.length ? 'WHERE ' + conditions.join(' AND ') : '',
    params,
  };
}

function parseIncident(row) {
  return { ...row, threat_types: JSON.parse(row.threat_types || '[]'), sanitized: Boolean(row.sanitized) };
}

// ── GET /api/incidents ────────────────────────────────────────────────────────
router.get('/', authMiddleware, (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const offset = (page - 1) * limit;

  const { where, params } = buildFilters(req.query);

  const total = db.prepare(`SELECT COUNT(*) as c FROM incidents ${where}`).get(...params).c;
  const rows  = db.prepare(`SELECT * FROM incidents ${where} ORDER BY timestamp DESC LIMIT ? OFFSET ?`)
                  .all(...params, limit, offset);

  res.json({
    data:  rows.map(parseIncident),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

// ── GET /api/incidents/export ─────────────────────────────────────────────────
router.get('/export', authMiddleware, (req, res) => {
  const { where, params } = buildFilters(req.query);
  const rows = db.prepare(`SELECT * FROM incidents ${where} ORDER BY timestamp DESC`).all(...params);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="guardian-incidents.csv"');
  res.send(toCSV(rows.map(parseIncident)));
});

// ── GET /api/incidents/:id ────────────────────────────────────────────────────
router.get('/:id', authMiddleware, (req, res) => {
  const row = db.prepare('SELECT * FROM incidents WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Incident not found' });
  res.json(parseIncident(row));
});

// ── POST /api/incidents  ← Called exclusively by PRD 3 Proxy Engine ──────────
router.post('/', proxyAuthMiddleware, (req, res) => {
  const {
    userId, department, aiPlatform, riskLevel, action,
    threatTypes = [], promptPreview, responsePreview, sanitized = false, deviceId,
  } = req.body;

  if (!aiPlatform || !riskLevel || !action) {
    return res.status(400).json({ error: 'aiPlatform, riskLevel, and action are required' });
  }

  // Resolve userId to a real user if provided
  let resolvedUserId = null;
  if (userId) {
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    resolvedUserId = user?.id || null;
  }

  const id        = uuidv4();
  const timestamp = new Date().toISOString();

  db.prepare(`
    INSERT INTO incidents
      (id, timestamp, user_id, department, ai_platform, risk_level, action,
       threat_types, prompt_preview, response_preview, sanitized, device_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, timestamp, resolvedUserId, department, aiPlatform, riskLevel, action,
    JSON.stringify(threatTypes), promptPreview || null, responsePreview || null,
    sanitized ? 1 : 0, deviceId || null,
  );

  // Update user risk score if applicable
  if (resolvedUserId && ['critical', 'high'].includes(riskLevel)) {
    db.prepare(`
      UPDATE users SET risk_score = MIN(100, risk_score + ?)
      WHERE id = ?
    `).run(riskLevel === 'critical' ? 10 : 5, resolvedUserId);
  }

  const incident = parseIncident(
    db.prepare('SELECT * FROM incidents WHERE id = ?').get(id)
  );

  // Push to all connected dashboard clients in real time
  broadcastIncident(incident);

  // Also broadcast updated stats
  const stats = getTodayStats();
  broadcastStatsUpdate(stats);

  res.status(201).json({ id, timestamp });
});

// ── Stats helper (used after new incident) ────────────────────────────────────
function getTodayStats() {
  const today = new Date().toISOString().split('T')[0];
  const total    = db.prepare(`SELECT COUNT(*) as c FROM incidents WHERE timestamp >= ?`).get(today + 'T00:00:00').c;
  const critical = db.prepare(`SELECT COUNT(*) as c FROM incidents WHERE timestamp >= ? AND risk_level = 'critical'`).get(today + 'T00:00:00').c;
  const platforms = db.prepare(`SELECT DISTINCT ai_platform FROM incidents WHERE timestamp >= ?`).all(today + 'T00:00:00').map(r => r.ai_platform);
  return { totalToday: total, criticalToday: critical, platformsDetected: platforms };
}

module.exports = router;
