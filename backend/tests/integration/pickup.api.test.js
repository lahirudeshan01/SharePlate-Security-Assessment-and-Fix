const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Donation = require('../../src/models/Donation');
const Request = require('../../src/models/Request');
const Pickup = require('../../src/models/Pickup');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Pickup API - Integration Tests', () => {
  let managerToken, donorToken, shelterToken;
  let donorId, shelterId, donationId, requestId;
  let mongoConnected = false;

  const signToken = (id, role) =>
    jwt.sign(
      { id, role },
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
    await Donation.deleteMany({});
    await Request.deleteMany({});
    await Pickup.deleteMany({});

    // Create manager
    const manager = new User({
      name: 'Test Manager',
      email: 'manager@test.com',
      password: await bcrypt.hash('password123', 10),
      role: 'manager',
      organizationName: 'Logistics HQ'
    });
    await manager.save({ validateBeforeSave: false });
    managerToken = signToken(manager._id, 'manager');

    // Create donor
    const donor = new User({
      name: 'Test Donor',
      email: 'donor@test.com',
      password: await bcrypt.hash('password123', 10),
      role: 'donor',
      organizationName: 'Test Restaurant'
    });
    await donor.save({ validateBeforeSave: false });
    donorId = donor._id;
    donorToken = signToken(donor._id, 'donor');

    // Create shelter
    const shelter = new User({
      name: 'Test Shelter',
      email: 'shelter@test.com',
      password: await bcrypt.hash('password123', 10),
      role: 'shelter',
      organizationName: 'Test Shelter'
    });
    await shelter.save({ validateBeforeSave: false });
    shelterId = shelter._id;
    shelterToken = signToken(shelter._id, 'shelter');

    // Create donation
    const donation = await Donation.create({
      donor: donorId,
      foodName: 'Test Food',
      quantity: 10,
      expiryDate: new Date(Date.now() + 86400000),
      status: 'reserved'
    });
    donationId = donation._id;

    // Create approved request (pre-condition for pickups)
    const req = await Request.create({
      donation: donationId,
      shelter: shelterId,
      requestedQuantity: 10,
      foodName: 'Test Food',
      status: 'approved'
    });
    requestId = req._id;
  });

  afterAll(async () => {
    if (mongoConnected) {
      await User.deleteMany({});
      await Donation.deleteMany({});
      await Request.deleteMany({});
      await Pickup.deleteMany({});
      await mongoose.connection.close();
    }
  });

  describe('POST /api/pickups/schedule', () => {
    it('should schedule a pickup for an approved request (donor)', async () => {
      if (!mongoConnected) { return; }

      const response = await request(app)
        .post('/api/pickups/schedule')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          requestId: requestId.toString(),
          scheduledTime: new Date(Date.now() + 3600000).toISOString(), // 1h from now
          notes: 'Please handle with care'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.pickup).toHaveProperty('_id');
      expect(response.body.pickup.status).toBe('scheduled');
    });

    it('should schedule a pickup (manager)', async () => {
      if (!mongoConnected) { return; }

      const response = await request(app)
        .post('/api/pickups/schedule')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          requestId: requestId.toString(),
          scheduledTime: new Date(Date.now() + 3600000).toISOString()
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      if (!mongoConnected) { return; }

      const response = await request(app)
        .post('/api/pickups/schedule')
        .send({
          requestId: requestId.toString(),
          scheduledTime: new Date(Date.now() + 3600000).toISOString()
        });

      expect(response.status).toBe(401);
    });

    it('should return 403 for shelter role', async () => {
      if (!mongoConnected) { return; }

      const response = await request(app)
        .post('/api/pickups/schedule')
        .set('Authorization', `Bearer ${shelterToken}`)
        .send({
          requestId: requestId.toString(),
          scheduledTime: new Date(Date.now() + 3600000).toISOString()
        });

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent request', async () => {
      if (!mongoConnected) { return; }

      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post('/api/pickups/schedule')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          requestId: fakeId.toString(),
          scheduledTime: new Date(Date.now() + 3600000).toISOString()
        });

      expect(response.status).toBe(404);
    });

    it('should return 400 if request is not approved', async () => {
      if (!mongoConnected) { return; }

      // Make request pending
      await Request.findByIdAndUpdate(requestId, { status: 'pending' });

      const response = await request(app)
        .post('/api/pickups/schedule')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          requestId: requestId.toString(),
          scheduledTime: new Date(Date.now() + 3600000).toISOString()
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Request is not approved');
    });

    it('should prevent duplicate pickups for the same request', async () => {
      if (!mongoConnected) { return; }

      // Schedule first pickup
      await request(app)
        .post('/api/pickups/schedule')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          requestId: requestId.toString(),
          scheduledTime: new Date(Date.now() + 3600000).toISOString()
        });

      // Try to schedule again
      const response = await request(app)
        .post('/api/pickups/schedule')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          requestId: requestId.toString(),
          scheduledTime: new Date(Date.now() + 7200000).toISOString()
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Pickup already scheduled');
    });
  });

  describe('GET /api/pickups (Manager only)', () => {
    beforeEach(async () => {
      if (!mongoConnected) { return; }
      await Pickup.create({
        request: requestId,
        scheduledTime: new Date(Date.now() + 3600000),
        status: 'scheduled'
      });
    });

    it('should return all pickups for manager', async () => {
      if (!mongoConnected) { return; }

      const response = await request(app)
        .get('/api/pickups')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.pickups).toHaveLength(1);
    });

    it('should return 401 without authentication', async () => {
      if (!mongoConnected) { return; }

      const response = await request(app).get('/api/pickups');

      expect(response.status).toBe(401);
    });

    it('should return 403 for donor role', async () => {
      if (!mongoConnected) { return; }

      const response = await request(app)
        .get('/api/pickups')
        .set('Authorization', `Bearer ${donorToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/pickups/:id (Manager only)', () => {
    let pickupId;

    beforeEach(async () => {
      if (!mongoConnected) { return; }
      const pickup = await Pickup.create({
        request: requestId,
        scheduledTime: new Date(Date.now() + 3600000),
        status: 'scheduled'
      });
      pickupId = pickup._id;
    });

    it('should return single pickup by ID for manager', async () => {
      if (!mongoConnected) { return; }

      const response = await request(app)
        .get(`/api/pickups/${pickupId}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.pickup).toHaveProperty('_id');
    });

    it('should return 404 for non-existent pickup', async () => {
      if (!mongoConnected) { return; }

      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/pickups/${fakeId}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/pickups/:id (Manager only)', () => {
    let pickupId;

    beforeEach(async () => {
      if (!mongoConnected) { return; }
      const pickup = await Pickup.create({
        request: requestId,
        scheduledTime: new Date(Date.now() + 3600000),
        status: 'scheduled'
      });
      pickupId = pickup._id;
    });

    it('should update pickup scheduled time and notes', async () => {
      if (!mongoConnected) { return; }

      const newTime = new Date(Date.now() + 7200000).toISOString();
      const response = await request(app)
        .put(`/api/pickups/${pickupId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ scheduledTime: newTime, notes: 'Updated notes' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.pickup.notes).toBe('Updated notes');
    });

    it('should return 403 for donor role', async () => {
      if (!mongoConnected) { return; }

      const response = await request(app)
        .put(`/api/pickups/${pickupId}`)
        .set('Authorization', `Bearer ${donorToken}`)
        .send({ notes: 'Attempt to update' });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/pickups/approved-requests (Manager only)', () => {
    it('should return approved requests awaiting pickup scheduling', async () => {
      if (!mongoConnected) { return; }

      const response = await request(app)
        .get('/api/pickups/approved-requests')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('requests');
    });

    it('should return 403 for donor role', async () => {
      if (!mongoConnected) { return; }

      const response = await request(app)
        .get('/api/pickups/approved-requests')
        .set('Authorization', `Bearer ${donorToken}`);

      expect(response.status).toBe(403);
    });
  });
});
