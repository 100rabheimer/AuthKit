const request = require('supertest');
const app = require('../app');                 // src/app.js
const pool = require('../config/db');          // src/config/db.js

describe('Auth APIs', () => {

  let accessToken = '';
  let refreshTokenCookie = '';
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'password123';
  const testName = 'Test User';

  // Saare tests ke baad database connection band kar do
  afterAll(async () => {
    await pool.end();
  });

  // ====================== SIGNUP ======================
  describe('POST /api/auth/signup', () => {

    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: testEmail,
          password: testPassword,
          name: testName
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testEmail);
      expect(res.body.message).toBe('User registered successfully');

      // Access token save kar lo baad ke tests ke liye
      accessToken = res.body.accessToken;

      // Cookie se refresh token nikal lo
      const cookies = res.headers['set-cookie'];
      if (cookies) {
        refreshTokenCookie = cookies.find(cookie => cookie.startsWith('refreshToken'));
      }
    });

    it('should not register with existing email', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: testEmail,          // same email
          password: testPassword,
          name: testName
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/already registered/i);
    });

    it('should fail if email or password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'No Email User'
        });

      expect(res.statusCode).toBe(400);
    });
  });

  // ====================== LOGIN ======================
  describe('POST /api/auth/login', () => {

    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.message).toBe('Login successful');

      accessToken = res.body.accessToken;

      const cookies = res.headers['set-cookie'];
      if (cookies) {
        refreshTokenCookie = cookies.find(cookie => cookie.startsWith('refreshToken'));
      }
    });

    it('should fail with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toMatch(/invalid credentials/i);
    });
  });

  // ====================== ME (Protected) ======================
  describe('GET /api/auth/me', () => {

    it('should return current user with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testEmail);
    });

    it('should fail without access token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.statusCode).toBe(401);
    });
  });

  // ====================== REFRESH ======================
  describe('POST /api/auth/refresh', () => {

    it('should refresh access token with valid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', refreshTokenCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.message).toBe('Token refreshed successfully');

      // naya token update kar lo
      accessToken = res.body.accessToken;
    });
  });

  // ====================== LOGOUT ======================
  describe('POST /api/auth/logout', () => {

    it('should logout successfully', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', refreshTokenCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Logged out successfully');
    });
  });

});