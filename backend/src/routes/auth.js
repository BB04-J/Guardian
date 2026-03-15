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

// POST /api/auth/signup
router.post('/signup', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name required' });
  }

  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const id = require('crypto').randomUUID();
    const hash = bcrypt.hashSync(password, 10);
    // Defaulting to 'admin' for the demo, so new users can test the Policies page without 403 errors
    db.prepare('INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)').run(
      id, email, hash, name, 'admin'
    );

    const payload = { id, email, role: 'admin', department: null };
    const token = signToken(payload);

    res.cookie('jwt', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge:   8 * 60 * 60 * 1000,
      secure:   process.env.NODE_ENV === 'production',
    });

    res.status(201).json({ token, user: { id, email, name, role: 'admin', department: null } });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
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
