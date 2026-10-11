# AuthKit

<p align="center">
  <img src="https://img.shields.io/badge/AuthKit-Authentication%20Service-blueviolet?style=for-the-badge" alt="AuthKit" />
</p>

<p align="center">
  Production-style Authentication Service with JWT Access + Refresh Tokens, Token Rotation, and Redis Rate Limiting.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Neon-00E699?style=for-the-badge&logo=neon&logoColor=black" alt="Neon" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Upstash-00E9A3?style=for-the-badge&logo=upstash&logoColor=black" alt="Upstash" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT" />
  <img src="https://img.shields.io/badge/bcrypt-338b11?style=for-the-badge&logo=letsencrypt&logoColor=white" alt="bcrypt" />
</p>

---

## Features

- User Signup & Login
- JWT Access Token (15 minutes)
- Refresh Token (7 days) in httpOnly cookie
- Token Rotation + Reuse Detection (revokes all sessions on theft)
- Timing-safe password comparison
- bcrypt password hashing (12 rounds)
- Rate limiting (5 attempts / 15 min) with Redis
- Protected routes with authentication middleware
- Input validation
- Secure cookie handling (httpOnly, SameSite)

---

## Tech Stack

| Layer              | Technology                          |
|--------------------|-------------------------------------|
| Runtime            | Node.js                             |
| Framework          | Express.js                          |
| Database           | PostgreSQL (Neon)                   |
| Cache / Rate Limit | Redis (Upstash)                     |
| Auth               | jsonwebtoken + bcrypt               |
| Security           | helmet, cors, cookie-parser         |

---

## Project Structure

```text
auth-service/
├── src/
│   ├── config/
│   │   ├── db.js                 # PostgreSQL (Neon) connection
│   │   └── index.js              # Environment config
│   ├── controllers/
│   │   └── auth.controller.js    # signup, login, refresh, logout, me
│   ├── middleware/
│   │   ├── auth.js               # JWT verification
│   │   ├── rateLimiter.js        # Redis rate limiting
│   │   ├── validate.js           # Input validation
│   │   └── errorHandler.js       # Central error handler
│   ├── routes/
│   │   └── auth.routes.js        # All /api/auth/* routes
│   ├── utils/
│   │   ├── password.js           # bcrypt hash & compare
│   │   └── tokens.js             # Access + Refresh token helpers
│   ├── app.js                    # Express app setup
│   └── server.js                 # Server entry point
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd auth-service
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
PORT=5000
NODE_ENV=development

DATABASE_URL=your_neon_postgresql_url
REDIS_URL=your_upstash_redis_url

ACCESS_TOKEN_SECRET=your_long_random_access_secret
REFRESH_TOKEN_SECRET=your_long_random_refresh_secret

ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

CLIENT_URL=http://localhost:3000
```

### 4. Create Database Tables

Run this SQL in your Neon SQL Editor:

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(100),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash    VARCHAR(255) NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  revoked       BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
```

### 5. Start the server

```bash
node src/server.js
```

Server runs on `http://localhost:5000`

---

## API Endpoints

| Method | Endpoint              | Description                | Auth Required     |
|--------|-----------------------|----------------------------|-------------------|
| POST   | `/api/auth/signup`    | Register a new user        | No                |
| POST   | `/api/auth/login`     | Login user                 | No                |
| POST   | `/api/auth/refresh`   | Get new access token       | Refresh Cookie    |
| POST   | `/api/auth/logout`    | Logout & revoke token      | Refresh Cookie    |
| GET    | `/api/auth/me`        | Get current user info      | Bearer Token      |

### Signup Example

```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

### Login Example

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Protected Route Example

```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

---

## Security Highlights

- Access tokens are short-lived (15 minutes)
- Refresh tokens stored as **SHA-256 hash** in database
- Token rotation on every refresh
- **Reuse detection** → revokes all sessions if a stolen token is used
- Timing-safe password comparison (prevents user enumeration)
- Rate limiting with Redis (5 attempts / 15 minutes)
- httpOnly + SameSite cookies
- Separate secrets for access and refresh tokens
- bcrypt with 12 salt rounds

---

## License

MIT
```