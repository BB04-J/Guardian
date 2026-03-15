const express = require('express');
const db = require('../db/schema');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/stats/summary
// Powers the top stat cards on the dashboard
router.get('/summary', authMiddleware, (req, res) => {
  const today = new Date().toISOString().split('T')[0] + ' 00:00:00';

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
  const sinceISO = new Date(Date.now() - hours * 3600 * 1000).toISOString();
  // Convert ISO string `YYYY-MM-DDTHH:mm:ss.sssZ` to SQLite format `YYYY-MM-DD HH:MM:SS`
  const since = sinceISO.replace('T', ' ').slice(0, 19);

  const rows = db.prepare(`
    SELECT
      strftime('%Y-%m-%d %H:00:00', timestamp) as hour,
      risk_level,
      COUNT(*) as count
    FROM incidents
    WHERE timestamp >= ?
    GROUP BY hour, risk_level
    ORDER BY hour ASC
  `).all(since);

  // Build contiguous hour labels
  const data = [];
  const now = new Date();
  for (let i = hours - 1; i >= 0; i--) {
    const d = new Date(now - i * 3600 * 1000);
    const hourLabel = d.toISOString().replace('T', ' ').slice(0, 13) + ':00:00';
    data.push({ hour: hourLabel, critical: 0, high: 0, medium: 0, low: 0 });
  }

  // Fill data series
  for (const row of rows) {
    const point = data.find(d => d.hour === row.hour);
    if (point && point.hasOwnProperty(row.risk_level)) {
      point[row.risk_level] = row.count;
    }
  }

  // Formatting hours to be shorter for the graph like '14:00'
  const formattedData = data.map(d => ({
    ...d,
    hour: d.hour.slice(11, 16)
  }));

  res.json(formattedData);
});

module.exports = router;
