// .env file se environment variables load karne ke liye
require('dotenv').config();

// Zaroori packages
const express = require('express');           // Express framework
const cors = require('cors');                 // Cross-Origin Resource Sharing (frontend se baat karne ke liye)
const cookieParser = require('cookie-parser'); // Cookies padhne ke liye (refresh token ke liye zaroori)
const helmet = require('helmet');             // Security headers lagane ke liye

// Apne auth routes ko import kar rahe hain
const authRoutes = require('./routes/auth.routes');

// Express app bana rahe hain
const app = express();

// ====================== MIDDLEWARES ======================

// 1. Helmet → Security related HTTP headers automatically laga deta hai
app.use(helmet());

// 2. CORS → Frontend (React/Next etc.) se request allow karta hai
//    credentials: true → cookies bhejne/allow karne ke liye zaroori hai
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000', // sirf yeh origin allow hoga
  credentials: true
}));

// 3. express.json() → incoming request ka JSON body padhne ke liye
//    iske bina req.body empty aata hai
app.use(express.json());

// 4. cookieParser → req.cookies object available karta hai
//    refresh token httpOnly cookie mein hota hai, isliye zaroori hai
app.use(cookieParser());

// ====================== ROUTES ======================

// Saari auth related routes ko /api/auth ke under mount kar rahe hain
// Example: POST /api/auth/signup, POST /api/auth/login etc.
app.use('/api/auth', authRoutes);

// ====================== EXTRA ROUTES ======================

// Test route → server chal raha hai ya nahi check karne ke liye
app.get('/', (req, res) => {
  res.json({ message: 'Auth Service is running' });
});

// 404 handler → agar koi galat URL pe request aaye to yeh chalega
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// app ko export kar rahe hain taaki server.js isko use kar sake
module.exports = app;