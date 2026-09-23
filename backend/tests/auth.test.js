const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const mongoose = require('mongoose');
const crypto = require('crypto');

describe('Authentication Endpoints', () => {
  let authToken;
  let registeredUser;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/shareplate-test');
    await User.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  // ─────────────────────────────────────────────
  // REGISTER
  // ─────────────────────────────────────────────
  describe('POST /api/auth/register', () => {
    it('should register a new restaurant user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Test123',
          role: 'restaurant',
          organizationName: 'Test Restaurant',
          phone: '1234567890'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.data.email).toBe('test@example.com');
      registeredUser = response.body.data;
      authToken = response.body.token;
    });

    it('should register a shelter user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Shelter User',
          email: 'auth_shelter@example.com',
          password: 'Shelter123',
          role: 'shelter',
          organizationName: 'City Shelter'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should fail when registering duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Test123',
          role: 'restaurant',
          organizationName: 'Test Restaurant'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'Test123',
          role: 'restaurant'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with weak password (no uppercase)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'weak@example.com',
          password: 'test123',
          role: 'restaurant',
          organizationName: 'Org'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with too short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'short@example.com',
          password: 'T1',
          role: 'restaurant',
          organizationName: 'Org'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail when restaurant role has no organizationName', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'noorg@example.com',
          password: 'Test123',
          role: 'restaurant'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail when precise coordinates are provided during registration', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Coords User',
          email: 'coords-register@example.com',
          password: 'Coords123',
          role: 'restaurant',
          organizationName: 'Coords Org',
          preciseLocation: {
            latitude: 6.9271,
            longitude: 79.8612
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid phone number', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'phone@example.com',
          password: 'Test123',
          role: 'restaurant',
          organizationName: 'Org',
          phone: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      authToken = response.body.token;
    });

    it('should fail with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nobody@example.com',
          password: 'Test123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with missing email and password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail login for deactivated account', async () => {
      // Deactivate account directly in DB
      await User.findOneAndUpdate(
        { email: 'auth_shelter@example.com' },
        { isActive: false }
      );

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'auth_shelter@example.com',
          password: 'Shelter123'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // GET ME
  // ─────────────────────────────────────────────
  describe('GET /api/auth/me', () => {
    it('should return current logged-in user', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken123');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // UPDATE PASSWORD
  // ─────────────────────────────────────────────
  describe('PUT /api/auth/updatepassword', () => {
    it('should update password with correct current password', async () => {
      const response = await request(app)
        .put('/api/auth/updatepassword')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'Test123',
          newPassword: 'NewTest456'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      authToken = response.body.token; // update token after password change
    });

    it('should fail with incorrect current password', async () => {
      const response = await request(app)
        .put('/api/auth/updatepassword')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'WrongCurrent',
          newPassword: 'Another123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail when fields are missing', async () => {
      const response = await request(app)
        .put('/api/auth/updatepassword')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail without auth token', async () => {
      const response = await request(app)
        .put('/api/auth/updatepassword')
        .send({
          currentPassword: 'NewTest456',
          newPassword: 'Another123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // FORGOT PASSWORD
  // ─────────────────────────────────────────────
  describe('POST /api/auth/forgotpassword', () => {
    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/forgotpassword')
        .send({ email: 'nobody@example.com' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should fail when email field is missing', async () => {
      const response = await request(app)
        .post('/api/auth/forgotpassword')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // RESET PASSWORD
  // ─────────────────────────────────────────────
  describe('PUT /api/auth/resetpassword/:resetToken', () => {
    let rawToken;

    beforeEach(async () => {
      // Manually inject a valid reset token into the DB
      rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      await User.findOneAndUpdate(
        { email: 'test@example.com' },
        {
          resetPasswordToken: hashedToken,
          resetPasswordExpire: Date.now() + 10 * 60 * 1000
        }
      );
    });

    it('should reset password with valid token', async () => {
      const response = await request(app)
        .put(`/api/auth/resetpassword/${rawToken}`)
        .send({ password: 'Reset123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
    });

    it('should fail with an invalid/expired reset token', async () => {
      const response = await request(app)
        .put('/api/auth/resetpassword/invalidtoken000')
        .send({ password: 'Reset123' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail when password field is missing', async () => {
      const response = await request(app)
        .put(`/api/auth/resetpassword/${rawToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────
  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should fail to logout without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
