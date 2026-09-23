const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const User = require('../../src/models/User');
const bcrypt = require('bcryptjs');

describe('Authentication API - Integration Tests', () => {
  let mongoConnected = false;

  // Connect to MongoDB before tests
  beforeAll(async () => {
    try {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/shareplate-test');
      }
      mongoConnected = true;
    } catch (error) {
      console.warn('MongoDB connection failed. Integration tests will be skipped.');
      mongoConnected = false;
    }
  }, 10000);

  // Clear users before each test
  beforeEach(async () => {
    if (!mongoConnected) { return; }
    await User.deleteMany({});
  });

  // Cleanup after all tests
  afterAll(async () => {
    if (mongoConnected) {
      await User.deleteMany({});
      await mongoose.connection.close();
    }
  });

  describe('POST /api/auth/register', () => {
    const validDonorData = {
      name: 'John Restaurant',
      email: 'john@restaurant.com',
      password: 'Password123!',
      role: 'donor',
      organizationName: 'John\'s Restaurant'
    };

    const validShelterData = {
      name: 'Hope Shelter',
      email: 'hope@shelter.org',
      password: 'Password123!',
      role: 'shelter',
      organizationName: 'Hope Shelter Foundation'
    };

    it('should register a donor successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validDonorData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.role).toBe('donor');
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body).toHaveProperty('token');
    });

    it('should register a shelter successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validShelterData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user.role).toBe('shelter');
    });

    it('should return 400 if email already exists', async () => {
      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(validDonorData);

      // Try to register again with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(validDonorData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User already exists with this email');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validDonorData,
          email: 'invalid-email'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validDonorData,
          password: '123',
          confirmPassword: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid role', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validDonorData,
          role: 'admin'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@test.com'
          // Missing password, confirmPassword, role, organizationName
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should hash password before storing', async () => {
      await request(app)
        .post('/api/auth/register')
        .send(validDonorData);

      const user = await User.findOne({ email: validDonorData.email });
      expect(user.password).not.toBe(validDonorData.password);
      
      // Verify password is hashed with bcrypt
      const isMatch = await bcrypt.compare(validDonorData.password, user.password);
      expect(isMatch).toBe(true);
    });
  });

  describe('POST /api/auth/login', () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
      role: 'donor',
      organizationName: 'Test Org'
    };

    beforeEach(async () => {
      // Register a user for login tests
      await request(app)
        .post('/api/auth/register')
        .send({
          ...userData,
          confirmPassword: userData.password
        });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body).toHaveProperty('token');
    });

    it('should return 401 for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 401 for incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: 'WrongPassword123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 400 if email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'Password123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 if password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return valid JWT token that can be used for authentication', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      const token = loginResponse.body.token;

      // Use token to access protected route
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.success).toBe(true);
    });
  });

  describe('GET /api/auth/profile', () => {
    let userToken, userId;

    beforeEach(async () => {
      // Register and login a user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Profile User',
          email: 'profile@test.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
          role: 'donor',
          organizationName: 'Profile Org'
        });

      userToken = registerResponse.body.token;
      userId = registerResponse.body.user.id;
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toHaveProperty('_id');
      expect(response.body.user.email).toBe('profile@test.com');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token-12345');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 if user is deleted after token generation', async () => {
      // Delete the user — middleware returns 401 when user no longer exists in DB
      await User.findByIdAndDelete(userId);

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('Complete Authentication Workflow', () => {
    it('should complete full auth cycle: register → login → access protected route', async () => {
      // Step 1: Register
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Complete Test',
          email: 'complete@test.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
          role: 'shelter',
          organizationName: 'Complete Shelter'
        });

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body).toHaveProperty('token');

      // Step 2: Login with registered credentials
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'complete@test.com',
          password: 'Password123!'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('token');

      // Step 3: Access profile with login token
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${loginResponse.body.token}`);

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.user.email).toBe('complete@test.com');
      expect(profileResponse.body.user.role).toBe('shelter');

      // Step 4: Try to access with wrong password - should fail
      const failedLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'complete@test.com',
          password: 'WrongPassword123!'
        });

      expect(failedLoginResponse.status).toBe(401);
    });
  });
});
