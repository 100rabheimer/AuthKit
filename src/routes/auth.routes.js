const express = require('express');
const router = express.Router();

const { signup, login, refresh, logout, me } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');
const { validateSignup, validateLogin } = require('../middleware/validate');

router.post('/signup', validateSignup, signup);
router.post('/login', loginLimiter, validateLogin, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, me);

module.exports = router;