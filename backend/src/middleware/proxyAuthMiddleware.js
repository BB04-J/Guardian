// Used exclusively on POST /api/incidents
// The proxy engine (PRD 3) must send X-Proxy-Key header
// with the same value as PROXY_SECRET_KEY in both .env files

function proxyAuthMiddleware(req, res, next) {
  const key = req.headers['x-proxy-key'];

  if (!key || key !== process.env.PROXY_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized proxy — invalid or missing X-Proxy-Key' });
  }

  next();
}

module.exports = { proxyAuthMiddleware };
