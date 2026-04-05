const jwt = require('jsonwebtoken');

function extractToken(req) {
  const authHeader = req.headers.token;
  if (authHeader) {
    const parts = String(authHeader).split(' ');
    return parts.length > 1 ? parts[1] : parts[0];
  }
  const q = req.query || {};
  if (q.token) return String(q.token);
  if (q.access_token) return String(q.access_token);
  return null;
}

function verify(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: 'You are not authenticated' });
  }

  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) {
      res.status(403).json({ message: 'Token not valid' });
    } else {
      req.user = user;
      next();
    }
  });
}

module.exports = verify;
