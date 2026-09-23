const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('User API - Integration Tests', () => {
  let adminToken, donorToken, donorId;
  let mongoConnected = false;

  const createAdminToken = (id) =>
    jwt.sign(
      { id, role: 'admin' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

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

  beforeEach(async () => {
    if (!mongoConnected) { return; }

    await User.deleteMany({});

    // Create admin user
    const admin = new User({
      name: 'Admin User',
      email: 'admin@test.com',
      password: await bcrypt.hash('AdminPass123!', 10),
      role: 'admin',
      organizationName: 'Admin Org'
    });
    await admin.save({ validateBeforeSave: false });
    adminToken = createAdminToken(admin._id);

    // Create a donor user
    const donor = new User({
      name: 'Test Donor',
      email: 'donor@test.com',
      password: await bcrypt.hash('DonorPass123!', 10),
      role: 'donor',
      organizationName: 'Test Restaurant'
    });
    await donor.save({ validateBeforeSave: false });
    donorId = donor._id;
    donorToken = jwt.sign(
      { id: donor._id, role: donor.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    if (mongoConnected) {
      await User.deleteMany({});
      await mongoose.connection.close();
    }
  });

  describe('GET /api/users (Admin only)', () => {
    it('should return all users for admin', async () => {
      if (!mongoConnected) { return; }

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('users');
      expect(Array.isArray(response.body.data.users)).toBe(true);
      expect(response.body.data.users.length).toBeGreaterThanOrEqual(2);
    });

    it('should return 401 without authentication', async () => {
      if (!mongoConnected) { return; }

      const response = await request(app).get('/api/users');

      expect(response.status).toBe(401);
    });

    it('should return 403 for non-admin users', async () => {
      if (!mongoConnected) { return; }

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${donorToken}`);

      expect(response.status).toBe(403);
    });

    it('should not expose password field', async () => {
      if (!mongoConnected) { return; }

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      response.body.data.users.forEach((user) => {
        expect(user).not.toHaveProperty('password');
      });
    });

    it('should support pagination', async () => {
      if (!mongoConnected) { return; }

      const response = await request(app)
        .get('/api/users?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.users).toHaveLength(1);
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 1);
    });
  });

  describe('GET /api/users/:id (Admin only)', () => {
    it('should return a specific user by ID', async () => {
      if (!mongoConnected) { return; }

      const response = await request(app)
        .get(`/api/users/${donorId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data).toHaveProperty('email', 'donor@test.com');
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should return 404 for non-existent user', async () => {
      if (!mongoConnected) { return; }

      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 403 for non-admin', async () => {
      if (!mongoConnected) { return; }

      const response = await request(app)
        .get(`/api/users/${donorId}`)
        .set('Authorization', `Bearer ${donorToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/users/profile (any authenticated user)', () => {
    it('should allow donor to update their own profile', async () => {
      if (!mongoConnected) { return; }

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          name: 'Updated Donor Name',
          organizationName: 'Updated Restaurant'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify in DB
      const updated = await User.findById(donorId);
      expect(updated.name).toBe('Updated Donor Name');
      expect(updated.organizationName).toBe('Updated Restaurant');
    });

    it('should return 401 without authentication', async () => {
      if (!mongoConnected) { return; }

      const response = await request(app)
        .put('/api/users/profile')
        .send({ name: 'New Name' });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/users/profile (authenticated user deletes own account)', () => {
    it('should allow user to delete their own account', async () => {
      if (!mongoConnected) { return; }

      const response = await request(app)
        .delete('/api/users/profile')
        .set('Authorization', `Bearer ${donorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const deleted = await User.findById(donorId);
      expect(deleted).toBeNull();
    });

    it('should return 401 without authentication', async () => {
      if (!mongoConnected) { return; }

      const response = await request(app)
        .delete('/api/users/profile');

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/users/:id (Admin only)', () => {
    it('should allow admin to delete any user', async () => {
      if (!mongoConnected) { return; }

      const response = await request(app)
        .delete(`/api/users/${donorId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const deleted = await User.findById(donorId);
      expect(deleted).toBeNull();
    });

    it('should return 403 for non-admin', async () => {
      if (!mongoConnected) { return; }

      const response = await request(app)
        .delete(`/api/users/${donorId}`)
        .set('Authorization', `Bearer ${donorToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent user', async () => {
      if (!mongoConnected) { return; }

      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/users/role/:role (Admin only)', () => {
    it('should return users filtered by role', async () => {
      if (!mongoConnected) { return; }

      const response = await request(app)
        .get('/api/users/role/donor')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 403 for non-admin', async () => {
      if (!mongoConnected) { return; }

      const response = await request(app)
        .get('/api/users/role/donor')
        .set('Authorization', `Bearer ${donorToken}`);

      expect(response.status).toBe(403);
    });
  });
});
