const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const mongoose = require('mongoose');

describe('User Management Endpoints', () => {
  let authToken;
  let adminToken;
  let userId;
  let adminId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/shareplate-test');
    await User.deleteMany({});

    // Create regular restaurant user
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Regular User',
        email: 'user@example.com',
        password: 'User123',
        role: 'restaurant',
        organizationName: 'User Restaurant',
        phone: '1234567890'
      });

    authToken = userResponse.body.token;
    userId = userResponse.body.data._id;

    // Create regular shelter user
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Shelter User',
        email: 'shelter@example.com',
        password: 'Shelter123',
        role: 'shelter',
        organizationName: 'City Shelter'
      });

    // Create admin user directly (bypass validator since admin has no organizationName)
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Admin123',
      role: 'admin'
    });

    adminId = admin._id.toString();
    adminToken = admin.getSignedJwtToken();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  // ─────────────────────────────────────────────
  // GET ALL USERS
  // ─────────────────────────────────────────────
  describe('GET /api/users', () => {
    it('should get all users as admin', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeDefined();
      expect(response.body.data.count).toBeGreaterThan(0);
    });

    it('should not expose passwords in the response', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      response.body.data.users.forEach(user => {
        expect(user.password).toBeUndefined();
      });
    });

    it('should fail without admin role (regular user)', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should fail without any token', async () => {
      const response = await request(app)
        .get('/api/users');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should support pagination query params', async () => {
      const response = await request(app)
        .get('/api/users?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.pagination.total).toBeGreaterThan(0);
      expect(response.body.data.users.length).toBeLessThanOrEqual(1);
    });

    it('should support search by name or email', async () => {
      const response = await request(app)
        .get('/api/users?search=admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users.length).toBeGreaterThan(0);

      response.body.data.users.forEach(user => {
        const matched =
          user.name.toLowerCase().includes('admin') ||
          user.email.toLowerCase().includes('admin');
        expect(matched).toBe(true);
      });
    });
  });

  // ─────────────────────────────────────────────
  // GET USER BY ID
  // ─────────────────────────────────────────────
  describe('GET /api/users/:id', () => {
    it('should get user by ID as admin', async () => {
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(userId);
    });

    it('should fail with a non-existent user ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should fail with an invalid ID format (CastError → 404)', async () => {
      const response = await request(app)
        .get('/api/users/not-a-valid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should fail for non-admin user', async () => {
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // UPDATE OWN PROFILE
  // ─────────────────────────────────────────────
  describe('PUT /api/users/profile', () => {
    it('should update own name and phone', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated User Name',
          phone: '9876543210'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated User Name');
      expect(response.body.data.phone).toBe('9876543210');
    });

    it('should update organizationName', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ organizationName: 'New Restaurant Name' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.organizationName).toBe('New Restaurant Name');
    });

    it('should update address fields', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          address: {
            street: '123 Main St',
            city: 'Colombo',
            state: 'Western',
            zipCode: '10001',
            country: 'Sri Lanka'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.address.city).toBe('Colombo');
    });

    it('should update precise location coordinates', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          preciseLocation: {
            latitude: 6.9271,
            longitude: 79.8612
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.preciseLocation.latitude).toBe(6.9271);
      expect(response.body.data.preciseLocation.longitude).toBe(79.8612);
    });

    it('should fail when precise location has only one coordinate', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          preciseLocation: {
            latitude: 6.9271
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should not expose password in profile response', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Safe Name' });

      expect(response.body.data.password).toBeUndefined();
    });

    it('should fail without auth token', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .send({ name: 'No Auth' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // ADMIN UPDATE USER BY ID
  // ─────────────────────────────────────────────
  describe('PUT /api/users/:id', () => {
    it('should allow admin to deactivate a user', async () => {
      const response = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(false);
    });

    it('should allow admin to verify a user', async () => {
      const response = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isVerified: true });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isVerified).toBe(true);
    });

    it('should fail for non-existent user ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should fail when non-admin tries to update another user', async () => {
      const response = await request(app)
        .put(`/api/users/${adminId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isActive: false });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // GET USERS BY ROLE
  // ─────────────────────────────────────────────
  describe('GET /api/users/role/:role', () => {
    it('should get all restaurant users', async () => {
      const response = await request(app)
        .get('/api/users/role/restaurant')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeDefined();
      response.body.data.users.forEach(user => {
        expect(user.role).toBe('restaurant');
      });
    });

    it('should get all shelter users', async () => {
      const response = await request(app)
        .get('/api/users/role/shelter')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should get all admin users', async () => {
      const response = await request(app)
        .get('/api/users/role/admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should fail with an invalid role', async () => {
      const response = await request(app)
        .get('/api/users/role/superuser')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail for non-admin user', async () => {
      const response = await request(app)
        .get('/api/users/role/restaurant')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should support pagination for role-based users', async () => {
      const response = await request(app)
        .get('/api/users/role/restaurant?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.data.users.length).toBeLessThanOrEqual(1);
    });

    it('should support search within role-filtered users', async () => {
      const response = await request(app)
        .get('/api/users/role/restaurant?search=regular')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      response.body.data.users.forEach(user => {
        expect(user.role).toBe('restaurant');
        const matched =
          user.name.toLowerCase().includes('regular') ||
          user.email.toLowerCase().includes('regular');
        expect(matched).toBe(true);
      });
    });
  });

  // ─────────────────────────────────────────────
  // DELETE USER
  // ─────────────────────────────────────────────
  describe('DELETE /api/users/:id', () => {
    let tempUserId;

    beforeAll(async () => {
      // Create a user specifically for deletion tests
      const temp = await User.create({
        name: 'Temp User',
        email: 'temp@example.com',
        password: 'Temp1234',
        role: 'restaurant',
        organizationName: 'Temp Org'
      });
      tempUserId = temp._id.toString();
    });

    it('should fail when non-admin tries to delete', async () => {
      const response = await request(app)
        .delete(`/api/users/${tempUserId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should allow admin to delete a user', async () => {
      const response = await request(app)
        .delete(`/api/users/${tempUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should fail deleting an already-deleted user', async () => {
      const response = await request(app)
        .delete(`/api/users/${tempUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .delete(`/api/users/${userId}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
