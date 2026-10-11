const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateAccessToken = (user) => {
  // yahan access token banao
  return jwt.sign(
  { userId: user.id, email: user.email },
  process.env.ACCESS_TOKEN_SECRET,
  { expiresIn: '15m' }
);
};

const generateRefreshToken = (user) => {
  return jwt.sign(
  { userId: user.id },
  process.env.REFRESH_TOKEN_SECRET,
  { expiresIn: '7d' }
);
  // yahan refresh token banao
};

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
  // yahan token ko hash karo
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashToken
};