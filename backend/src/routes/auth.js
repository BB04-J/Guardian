const express = require('express');
const bcrypt  = require('bcryptjs');
const db      = require('../db/schema');
const { signToken, verifyToken } = require('../utils/jwt');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const payload = { id: user.id, email: user.email, role: user.role, department: user.department };
  const token   = signToken(payload);

  // Set httpOnly cookie so frontend doesn't have to manage it manually
  res.cookie('jwt', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge:   8 * 60 * 60 * 1000, // 8 hours
    secure:   process.env.NODE_ENV === 'production',
  });

  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, department: user.department } });
});

// GET /api/auth/verify
router.get('/verify', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, email, name, role, department FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(401).json({ error: 'User not found' });
  res.json({ valid: true, user });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('jwt');
  res.json({ success: true });
});

module.exports = router;
