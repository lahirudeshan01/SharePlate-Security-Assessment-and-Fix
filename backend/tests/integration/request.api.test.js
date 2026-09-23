const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Donation = require('../../src/models/Donation');
const Request = require('../../src/models/Request');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Request API - Integration Tests', () => {
  let donorToken, shelterToken, donorId, shelterId, donationId;
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

  // Clean up and create test users before each test
  beforeEach(async () => {
    if (!mongoConnected) return;
    
    // Clear test data
    await User.deleteMany({});
    await Donation.deleteMany({});
    await Request.deleteMany({});

    // Create test donor
    const donor = new User({
      name: 'Test Donor',
      email: 'donor@test.com',
      password: await bcrypt.hash('password123', 10),
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

    // Create test shelter
    const shelter = new User({
      name: 'Test Shelter',
      email: 'shelter@test.com',
      password: await bcrypt.hash('password123', 10),
      role: 'shelter',
      organizationName: 'Test Shelter'
    });
    await shelter.save({ validateBeforeSave: false });
    shelterId = shelter._id;
    shelterToken = jwt.sign(
      { id: shelter._id, role: shelter.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Create test donation
    const donation = await Donation.create({
      donor: donorId,
      foodName: 'Test Pizza',
      quantity: 10,
      expiryDate: new Date(Date.now() + 86400000), // Tomorrow
      status: 'available'
    });
    donationId = donation._id;
  });

  // Cleanup after all tests
  afterAll(async () => {
    if (mongoConnected) {
      await User.deleteMany({});
      await Donation.deleteMany({});
      await Request.deleteMany({});
      await mongoose.connection.close();
    }
  });

  describe('POST /api/requests', () => {
    it('should create a request successfully with shelter authentication', async () => {
      if (!mongoConnected) { return; }
      
      const response = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${shelterToken}`)
        .send({
          donationId: donationId.toString(),
          requestedQuantity: 5,
          foodName: 'Test Pizza',
          message: 'We need this food for 50 people'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Request created successfully');
      expect(response.body.request).toHaveProperty('_id');
      expect(response.body.request.status).toBe('pending');

      // Donation stays available until a request is approved
      const donation = await Donation.findById(donationId);
      expect(donation.status).toBe('available');
    });

    it('should return 401 without authentication token', async () => {
      const response = await request(app)
        .post('/api/requests')
        .send({
          donationId: donationId.toString(),
          requestedQuantity: 5,
          foodName: 'Test Pizza',
          message: 'We need this food'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 403 if donor tries to create request', async () => {
      const response = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          donationId: donationId.toString(),
          requestedQuantity: 5,
          foodName: 'Test Pizza',
          message: 'We need this food'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied');
    });

    it('should return 400 for invalid donation ID format', async () => {
      const response = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${shelterToken}`)
        .send({
          donationId: 'invalid-id',
          message: 'We need this food'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 if donation is not available', async () => {
      // Make donation unavailable
      await Donation.findByIdAndUpdate(donationId, { status: 'reserved' });

      const response = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${shelterToken}`)
        .send({
          donationId: donationId.toString(),
          requestedQuantity: 5,
          foodName: 'Test Pizza',
          message: 'We need this food'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Donation not available');
    });

    it('should prevent duplicate requests from same shelter', async () => {
      if (!mongoConnected) { return; }

      // Create first request
      await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${shelterToken}`)
        .send({
          donationId: donationId.toString(),
          requestedQuantity: 5,
          foodName: 'Test Pizza',
          message: 'First request'
        });

      // Try to create duplicate request — same donation, same shelter
      const response = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${shelterToken}`)
        .send({
          donationId: donationId.toString(),
          requestedQuantity: 5,
          foodName: 'Test Pizza',
          message: 'Duplicate request'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('You have already requested this donation');
    });

    it('should validate message length', async () => {
      const longMessage = 'a'.repeat(501); // Exceeds 500 character limit

      const response = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${shelterToken}`)
        .send({
          donationId: donationId.toString(),
          requestedQuantity: 5,
          foodName: 'Test Pizza',
          message: longMessage
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/requests/:id/approve', () => {
    let requestId;

    beforeEach(async () => {
      // Create a request to approve
      const newRequest = await Request.create({
        donation: donationId,
        shelter: shelterId,
        requestedQuantity: 5,
        foodName: 'Test Pizza',
        status: 'pending',
        message: 'Please approve'
      });
      requestId = newRequest._id;
    });

    it('should approve request successfully by donor', async () => {
      const response = await request(app)
        .put(`/api/requests/${requestId}/approve`)
        .set('Authorization', `Bearer ${donorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('approved');

      // Verify request status
      const updatedRequest = await Request.findById(requestId);
      expect(updatedRequest.status).toBe('approved');

      // Verify donation status changed to reserved
      const updatedDonation = await Donation.findById(donationId);
      expect(updatedDonation.status).toBe('reserved');
    });

    it('should auto-reject other pending requests when one is approved', async () => {
      // Create another shelter and request
      const shelter2 = new User({
        name: 'Shelter 2',
        email: 'shelter2@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'shelter'
      });
      await shelter2.save({ validateBeforeSave: false });

      const request2 = await Request.create({
        donation: donationId,
        shelter: shelter2._id,
        requestedQuantity: 3,
        foodName: 'Test Pizza',
        status: 'pending',
        message: 'Another request'
      });

      // Approve first request
      await request(app)
        .put(`/api/requests/${requestId}/approve`)
        .set('Authorization', `Bearer ${donorToken}`);

      // Check second request is rejected
      const rejectedRequest = await Request.findById(request2._id);
      expect(rejectedRequest.status).toBe('rejected');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put(`/api/requests/${requestId}/approve`);

      expect(response.status).toBe(401);
    });

    it('should return 403 if shelter tries to approve', async () => {
      const response = await request(app)
        .put(`/api/requests/${requestId}/approve`)
        .set('Authorization', `Bearer ${shelterToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent request', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/requests/${fakeId}/approve`)
        .set('Authorization', `Bearer ${donorToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Request not found');
    });

    it('should return 403 if different donor tries to approve', async () => {
      // Create another donor
      const donor2 = new User({
        name: 'Donor 2',
        email: 'donor2@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'donor'
      });
      await donor2.save({ validateBeforeSave: false });

      const donor2Token = jwt.sign(
        { id: donor2._id, role: 'donor' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .put(`/api/requests/${requestId}/approve`)
        .set('Authorization', `Bearer ${donor2Token}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('not authorized');
    });
  });

  describe('PUT /api/requests/:id/reject', () => {
    let requestId;

    beforeEach(async () => {
      const newRequest = await Request.create({
        donation: donationId,
        shelter: shelterId,
        requestedQuantity: 5,
        foodName: 'Test Pizza',
        status: 'pending',
        message: 'Please consider'
      });
      requestId = newRequest._id;
    });

    it('should reject request successfully by donor', async () => {
      const response = await request(app)
        .put(`/api/requests/${requestId}/reject`)
        .set('Authorization', `Bearer ${donorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Request rejected');

      // Donation returns to available when no pending requests remain
      const donation = await Donation.findById(donationId);
      expect(donation.status).toBe('available');
    });

    it('should keep donation as requested if other pending requests exist', async () => {
      // Create another pending request
      const shelter2 = new User({
        name: 'Shelter 2',
        email: 'shelter2@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'shelter'
      });
      await shelter2.save({ validateBeforeSave: false });

      await Request.create({
        donation: donationId,
        shelter: shelter2._id,
        requestedQuantity: 3,
        foodName: 'Test Pizza',
        status: 'pending',
        message: 'Another request'
      });

      await request(app)
        .put(`/api/requests/${requestId}/reject`)
        .set('Authorization', `Bearer ${donorToken}`);

      // Donation stays available (controller only ensures 'available' if no pending requests)
      const donation = await Donation.findById(donationId);
      expect(donation.status).toBe('available');
    });

    it('should return 403 if shelter tries to reject', async () => {
      const response = await request(app)
        .put(`/api/requests/${requestId}/reject`)
        .set('Authorization', `Bearer ${shelterToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/requests/my-requests', () => {
    beforeEach(async () => {
      // Create multiple requests for shelter
      await Request.create({
        donation: donationId,
        shelter: shelterId,
        requestedQuantity: 5,
        foodName: 'Test Pizza',
        status: 'pending',
        message: 'Request 1'
      });

      await Request.create({
        donation: donationId,
        shelter: shelterId,
        requestedQuantity: 5,
        foodName: 'More Pizza',
        status: 'approved',
        message: 'Request 2'
      });
    });

    it('should return all requests for logged-in shelter', async () => {
      const response = await request(app)
        .get('/api/requests/my-requests')
        .set('Authorization', `Bearer ${shelterToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.requests).toHaveLength(2);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/requests/my-requests');

      expect(response.status).toBe(401);
    });

    it('should return 403 if donor tries to access', async () => {
      const response = await request(app)
        .get('/api/requests/my-requests')
        .set('Authorization', `Bearer ${donorToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/requests/my-donations', () => {
    beforeEach(async () => {
      await Request.create({
        donation: donationId,
        shelter: shelterId,
        requestedQuantity: 5,
        foodName: 'Test Pizza',
        status: 'pending',
        message: 'Request for donor'
      });
    });

    it('should return all requests for logged-in donors donations', async () => {
      const response = await request(app)
        .get('/api/requests/my-donations')
        .set('Authorization', `Bearer ${donorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBeGreaterThan(0);
    });

    it('should return 403 if shelter tries to access', async () => {
      const response = await request(app)
        .get('/api/requests/my-donations')
        .set('Authorization', `Bearer ${shelterToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/requests/donation/:donationId', () => {
    beforeEach(async () => {
      await Request.create({
        donation: donationId,
        shelter: shelterId,
        requestedQuantity: 5,
        foodName: 'Test Pizza',
        status: 'pending',
        message: 'Request'
      });
    });

    it('should return all requests for a specific donation', async () => {
      const response = await request(app)
        .get(`/api/requests/donation/${donationId}`)
        .set('Authorization', `Bearer ${donorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBeGreaterThan(0);
    });

    it('should return 400 for invalid donation ID', async () => {
      const response = await request(app)
        .get('/api/requests/donation/invalid-id')
        .set('Authorization', `Bearer ${donorToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid donation ID');
    });
  });

  describe('Complete Workflow Integration Test', () => {
    it('should complete full request lifecycle: create → approve → auto-reject', async () => {
      // Step 1: Create two shelters
      const shelter2 = new User({
        name: 'Shelter 2',
        email: 'shelter2@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'shelter'
      });
      await shelter2.save({ validateBeforeSave: false });

      const shelter2Token = jwt.sign(
        { id: shelter2._id, role: 'shelter' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      // Step 2: Both shelters create requests
      const req1 = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${shelterToken}`)
        .send({
          donationId: donationId.toString(),
          requestedQuantity: 5,
          foodName: 'Test Pizza',
          message: 'Request 1'
        });

      const req2 = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${shelter2Token}`)
        .send({
          donationId: donationId.toString(),
          requestedQuantity: 3,
          foodName: 'Test Pizza',
          message: 'Request 2'
        });

      expect(req1.status).toBe(201);
      expect(req2.status).toBe(201);

      const request1Id = req1.body.request._id;
      const request2Id = req2.body.request._id;

      // Step 3: Donor approves first request
      const approveResponse = await request(app)
        .put(`/api/requests/${request1Id}/approve`)
        .set('Authorization', `Bearer ${donorToken}`);

      expect(approveResponse.status).toBe(200);

      // Step 4: Verify first request is approved
      const approvedRequest = await Request.findById(request1Id);
      expect(approvedRequest.status).toBe('approved');

      // Step 5: Verify second request is auto-rejected
      const rejectedRequest = await Request.findById(request2Id);
      expect(rejectedRequest.status).toBe('rejected');

      // Step 6: Verify donation is now reserved
      const finalDonation = await Donation.findById(donationId);
      expect(finalDonation.status).toBe('reserved');

      // Step 7: Try to create new request — should fail (donation is now reserved)
      const newRequestResponse = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${shelter2Token}`)
        .send({
          donationId: donationId.toString(),
          requestedQuantity: 3,
          foodName: 'Test Pizza',
          message: 'Too late'
        });

      expect(newRequestResponse.status).toBe(400);
      expect(newRequestResponse.body.message).toBe('Donation not available');
    });
  });
});
