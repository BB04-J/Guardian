const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/schema');
const { authMiddleware, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/policies
router.get('/', authMiddleware, (req, res) => {
  const policies = db.prepare('SELECT * FROM policies ORDER BY type ASC, name ASC').all();
  res.json(policies.map(p => ({ ...p, enabled: Boolean(p.enabled) })));
});

// GET /api/policies/whitelist (proxy only)
router.get('/whitelist', (req, res) => {
  // Proxy sends X-Proxy-Key which is validated in server.js or a different middleware,
  // but for simplicity, let's just return the list of allowed platforms if the proxy requests it.
  // We can validate the proxy key here.
  const proxyKey = req.headers['x-proxy-key'];
  if (proxyKey !== process.env.PROXY_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const allowed = db.prepare('SELECT pattern FROM policies WHERE type = ? AND enabled = 1')
                    .all('platform_allow')
                    .map(p => p.pattern);
  res.json({ whitelist: allowed });
});

// POST /api/policies  (admin only — create custom rule)
router.post('/', authMiddleware, adminOnly, (req, res) => {
  const { name, pattern, threshold = 'warn', type = 'custom' } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const id = uuidv4();
  db.prepare(
    'INSERT INTO policies (id, name, type, pattern, threshold, enabled) VALUES (?, ?, ?, ?, ?, 1)'
  ).run(id, name, type, pattern || null, threshold);

  const policy = db.prepare('SELECT * FROM policies WHERE id = ?').get(id);
  res.status(201).json({ ...policy, enabled: Boolean(policy.enabled) });
});

// PATCH /api/policies/:id  (admin only — toggle or update)
router.patch('/:id', authMiddleware, adminOnly, (req, res) => {
  const { enabled, threshold, pattern } = req.body;
  const policy = db.prepare('SELECT * FROM policies WHERE id = ?').get(req.params.id);
  if (!policy) return res.status(404).json({ error: 'Policy not found' });

  const updates = [];
  const params  = [];
  if (typeof enabled === 'boolean')   { updates.push('enabled = ?');   params.push(enabled ? 1 : 0); }
  if (threshold)                       { updates.push('threshold = ?'); params.push(threshold); }
  if (pattern !== undefined)           { updates.push('pattern = ?');   params.push(pattern); }

  if (updates.length) {
    db.prepare(`UPDATE policies SET ${updates.join(', ')} WHERE id = ?`).run(...params, req.params.id);
  }

  const updated = db.prepare('SELECT * FROM policies WHERE id = ?').get(req.params.id);
  res.json({ ...updated, enabled: Boolean(updated.enabled) });
});

// DELETE /api/policies/:id  (admin only, custom rules only)
router.delete('/:id', authMiddleware, adminOnly, (req, res) => {
  const policy = db.prepare('SELECT * FROM policies WHERE id = ?').get(req.params.id);
  if (!policy) return res.status(404).json({ error: 'Policy not found' });
  if (policy.type === 'builtin') return res.status(403).json({ error: 'Cannot delete builtin policies' });

  db.prepare('DELETE FROM policies WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
