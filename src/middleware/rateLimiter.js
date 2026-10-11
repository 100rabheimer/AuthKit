const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const Redis = require('ioredis');

const redisClient = new Redis(process.env.REDIS_URL);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,     // 15 minutes
  max: 5,                       // max 5 attempts
  message: {
    error: 'Too many login attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

module.exports = { loginLimiter };