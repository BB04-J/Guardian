const { verifyToken } = require('../utils/jwt');

// Validates JWT from Authorization header or cookie
function authMiddleware(req, res, next) {
  let token = null;

  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

  // Also accept token from cookie (set by login route)
  if (!token && req.headers.cookie) {
    const match = req.headers.cookie.match(/(?:^|;\s*)jwt=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = payload; // { id, email, role, department }
  next();
}

// Restrict route to admin only
function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { authMiddleware, adminOnly };
