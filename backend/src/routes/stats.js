const express = require('express');
const db = require('../db/schema');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/stats/summary
// Powers the top stat cards on the dashboard
router.get('/summary', authMiddleware, (req, res) => {
  const today = new Date().toISOString().split('T')[0] + 'T00:00:00';

  const totalToday = db.prepare(
    `SELECT COUNT(*) as c FROM incidents WHERE timestamp >= ?`
  ).get(today).c;

  const criticalToday = db.prepare(
    `SELECT COUNT(*) as c FROM incidents WHERE timestamp >= ? AND risk_level = 'critical'`
  ).get(today).c;

  const activeUsers = db.prepare(
    `SELECT COUNT(DISTINCT user_id) as c FROM incidents WHERE timestamp >= ? AND user_id IS NOT NULL`
  ).get(today).c;

  const platformsDetected = db.prepare(
    `SELECT DISTINCT ai_platform FROM incidents WHERE timestamp >= ?`
  ).all(today).map(r => r.ai_platform);

  const topThreats = db.prepare(`
    SELECT threat_types, COUNT(*) as count
    FROM incidents
    WHERE timestamp >= ?
    GROUP BY threat_types
    ORDER BY count DESC
    LIMIT 5
  `).all(today).flatMap(r => {
    try {
      return JSON.parse(r.threat_types).map(t => ({ type: t, count: r.count }));
    } catch { return []; }
  });

  res.json({ totalToday, criticalToday, activeUsers, platformsDetected, topThreats });
});

// GET /api/stats/timeline?hours=24
// Powers the line chart — incidents per hour broken down by risk level
router.get('/timeline', authMiddleware, (req, res) => {
  const hours = Math.min(168, parseInt(req.query.hours) || 24); // max 7 days
  const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();

  const rows = db.prepare(`
    SELECT
      strftime('%Y-%m-%dT%H:00:00', timestamp) as hour,
      risk_level,
      COUNT(*) as count
    FROM incidents
    WHERE timestamp >= ?
    GROUP BY hour, risk_level
    ORDER BY hour ASC
  `).all(since);

  // Build contiguous hour labels
  const labels   = [];
  const now      = new Date();
  for (let i = hours - 1; i >= 0; i--) {
    const d = new Date(now - i * 3600 * 1000);
    labels.push(d.toISOString().slice(0, 13) + ':00:00');
  }

  // Fill data series
  const series = { critical: {}, high: {}, medium: {}, low: {} };
  for (const row of rows) {
    if (series[row.risk_level]) series[row.risk_level][row.hour] = row.count;
  }

  res.json({
    labels,
    critical: labels.map(l => series.critical[l] || 0),
    high:     labels.map(l => series.high[l]     || 0),
    medium:   labels.map(l => series.medium[l]   || 0),
    low:      labels.map(l => series.low[l]       || 0),
  });
});

module.exports = router;
