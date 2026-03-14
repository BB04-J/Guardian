require('dotenv').config();

const http    = require('http');
const express = require('express');
const cors    = require('cors');

// ── DB ────────────────────────────────────────────────────────────────────────
require('./db/schema');                       // Runs CREATE TABLE IF NOT EXISTS
const { seedIfEmpty } = require('./db/seed'); // Seeds demo data on first run
seedIfEmpty();

// ── WebSocket ─────────────────────────────────────────────────────────────────
const { initWebSocket } = require('./websocket/wsServer');

// ── Routes ────────────────────────────────────────────────────────────────────
const authRoutes      = require('./routes/auth');
const incidentRoutes  = require('./routes/incidents');
const statsRoutes     = require('./routes/stats');
const userRoutes      = require('./routes/users');
const policyRoutes    = require('./routes/policies');

// ── App ───────────────────────────────────────────────────────────────────────
const app = express();

app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Health check — proxy engine and frontend use this to verify backend is up
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API routes
app.use('/api/auth',      authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/stats',     statsRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/policies',  policyRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ error: `Route ${req.method} ${req.path} not found` }));

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT   = process.env.PORT || 4000;
const server = http.createServer(app);

initWebSocket(server);

server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   AI Response Guardian — Backend         ║
  ║   REST  → http://localhost:${PORT}/api     ║
  ║   WS    → ws://localhost:${PORT}/ws/events ║
  ╚══════════════════════════════════════════╝
  `);
});
