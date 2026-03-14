const express = require('express');
const db = require('../db/schema');
const { authMiddleware, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/users
router.get('/', authMiddleware, (req, res) => {
  const users = db.prepare(
    'SELECT id, email, name, role, department, risk_score, created_at FROM users ORDER BY risk_score DESC'
  ).all();
  res.json(users);
});

// GET /api/users/:id
router.get('/:id', authMiddleware, (req, res) => {
  const user = db.prepare(
    'SELECT id, email, name, role, department, risk_score, created_at FROM users WHERE id = ?'
  ).get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// GET /api/users/:id/incidents
router.get('/:id/incidents', authMiddleware, (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM incidents WHERE user_id = ? ORDER BY timestamp DESC LIMIT 50'
  ).all(req.params.id);
  res.json(rows.map(r => ({ ...r, threat_types: JSON.parse(r.threat_types || '[]'), sanitized: Boolean(r.sanitized) })));
});

// PATCH /api/users/:id/risk  (admin only — manual override)
router.patch('/:id/risk', authMiddleware, adminOnly, (req, res) => {
  const { riskScore } = req.body;
  if (typeof riskScore !== 'number' || riskScore < 0 || riskScore > 100) {
    return res.status(400).json({ error: 'riskScore must be a number between 0 and 100' });
  }
  db.prepare('UPDATE users SET risk_score = ? WHERE id = ?').run(riskScore, req.params.id);
  const user = db.prepare('SELECT id, email, name, role, department, risk_score FROM users WHERE id = ?').get(req.params.id);
  res.json(user);
});

module.exports = router;
