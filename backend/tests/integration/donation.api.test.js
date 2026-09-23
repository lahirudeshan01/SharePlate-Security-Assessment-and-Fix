const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Donation = require('../../src/models/Donation');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Donation API - Integration Tests', () => {
  let donorToken, shelterToken, donorId, shelterId;
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

  // Setup test users before each test
  beforeEach(async () => {
    if (!mongoConnected) { return; }
    
    await User.deleteMany({});
    await Donation.deleteMany({});

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
    donorToken = jwt.sign(
      { id: donor._id, role: donor.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

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
    shelterToken = jwt.sign(
      { id: shelter._id, role: shelter.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  // Cleanup after all tests
  afterAll(async () => {
    if (mongoConnected) {
      await User.deleteMany({});
      await Donation.deleteMany({});
      await mongoose.connection.close();
    }
  });

  describe('POST /api/donations', () => {
    const validDonationData = {
      foodName: 'Pizza',
      quantity: 20,
      expiryDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      pickupAddress: '123 Main St'
    };

    it('should create donation successfully with donor authentication', async () => {
      const response = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${donorToken}`)
        .send(validDonationData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Donation created successfully');
      expect(response.body.donation).toHaveProperty('_id');
      expect(response.body.donation.foodName).toBe('Pizza');
      expect(response.body.donation.status).toBe('available');
      expect(response.body.donation.donor).toBe(donorId.toString());
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/donations')
        .send(validDonationData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 403 if shelter tries to create donation', async () => {
      const response = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${shelterToken}`)
        .send(validDonationData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied');
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          foodName: 'Pizza'
          // Missing quantity, expiryDate
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for quantity less than 1', async () => {
      const response = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          ...validDonationData,
          quantity: -5
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/donations/available', () => {
    beforeEach(async () => {
      // Create available donations
      await Donation.create({
        donor: donorId,
        foodName: 'Pizza',
        quantity: 10,
        expiryDate: new Date(Date.now() + 86400000),
        status: 'available'
      });

      await Donation.create({
        donor: donorId,
        foodName: 'Sandwiches',
        quantity: 20,
        expiryDate: new Date(Date.now() + 172800000),
        status: 'available'
      });

      // A reserved donation — should not appear in available list
      await Donation.create({
        donor: donorId,
        foodName: 'Pasta',
        quantity: 15,
        expiryDate: new Date(Date.now() + 86400000),
        status: 'reserved'
      });
    });

    it('should return only available (non-expired) donations', async () => {
      const response = await request(app)
        .get('/api/donations/available');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2); // Only available donations
      expect(response.body.donations).toHaveLength(2);
      expect(response.body.donations[0].status).toBe('available');
    });

    it('should not require authentication to browse available donations', async () => {
      const response = await request(app)
        .get('/api/donations/available');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should populate donor information', async () => {
      const response = await request(app)
        .get('/api/donations/available');

      expect(response.body.donations[0]).toHaveProperty('donor');
      expect(response.body.donations[0].donor).toHaveProperty('name');
      expect(response.body.donations[0].donor).toHaveProperty('organizationName');
    });

    it('should return empty array if no available donations', async () => {
      await Donation.deleteMany({});

      const response = await request(app)
        .get('/api/donations/available');

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(0);
      expect(response.body.donations).toEqual([]);
    });
  });

  describe('GET /api/donations (all donations — requires auth)', () => {
    beforeEach(async () => {
      await Donation.create({
        donor: donorId,
        foodName: 'All Donations Pizza',
        quantity: 10,
        expiryDate: new Date(Date.now() + 86400000),
        status: 'available'
      });
    });

    it('should return all donations with authentication', async () => {
      const response = await request(app)
        .get('/api/donations')
        .set('Authorization', `Bearer ${donorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.donations).toHaveLength(1);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/donations');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/donations/:id', () => {
    let donationId;

    beforeEach(async () => {
      const donation = await Donation.create({
        donor: donorId,
        foodName: 'Burger',
        quantity: 30,
        expiryDate: new Date(Date.now() + 86400000),
        status: 'available',
        pickupAddress: '456 Oak St',
        pickupTime: '3:00 PM - 5:00 PM'
      });
      donationId = donation._id;
    });

    it('should return donation by ID', async () => {
      const response = await request(app)
        .get(`/api/donations/${donationId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.donation.foodName).toBe('Burger');
      expect(response.body.donation).toHaveProperty('donor');
    });

    it('should return 404 for non-existent donation', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/donations/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Donation not found');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/donations/invalid-id-123');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/donations/my-donations', () => {
    beforeEach(async () => {
      // Create donations for donor
      await Donation.create({
        donor: donorId,
        foodName: 'Pizza',
        quantity: 10,
        expiryDate: new Date(Date.now() + 86400000),
        status: 'available'
      });

      await Donation.create({
        donor: donorId,
        foodName: 'Pasta',
        quantity: 15,
        expiryDate: new Date(Date.now() + 86400000),
        status: 'reserved'
      });

      // Create donation for another donor
      const otherDonor = new User({
        name: 'Other Donor',
        email: 'other@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'donor',
        organizationName: 'Other Restaurant'
      });
      await otherDonor.save({ validateBeforeSave: false });

      await Donation.create({
        donor: otherDonor._id,
        foodName: 'Salad',
        quantity: 5,
        expiryDate: new Date(Date.now() + 86400000),
        status: 'available'
      });
    });

    it('should return only logged-in donors donations', async () => {
      const response = await request(app)
        .get('/api/donations/my-donations')
        .set('Authorization', `Bearer ${donorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2); // Only this donor's donations
      expect(response.body.donations).toHaveLength(2);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/donations/my-donations');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 403 if shelter tries to access', async () => {
      const response = await request(app)
        .get('/api/donations/my-donations')
        .set('Authorization', `Bearer ${shelterToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/donations/:id', () => {
    let donationId;

    beforeEach(async () => {
      const donation = await Donation.create({
        donor: donorId,
        foodName: 'Original Pizza',
        quantity: 10,
        expiryDate: new Date(Date.now() + 86400000),
        status: 'available'
      });
      donationId = donation._id;
    });

    it('should update donation successfully by owner', async () => {
      const response = await request(app)
        .put(`/api/donations/${donationId}`)
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          foodName: 'Updated Pizza',
          quantity: 25,
          pickupAddress: 'New Address'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.donation.foodName).toBe('Updated Pizza');
      expect(response.body.donation.quantity).toBe(25);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put(`/api/donations/${donationId}`)
        .send({
          foodName: 'Updated Pizza'
        });

      expect(response.status).toBe(401);
    });

    it('should return 403 if different donor tries to update', async () => {
      const otherDonor = new User({
        name: 'Other Donor',
        email: 'other@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'donor',
        organizationName: 'Other Restaurant'
      });
      await otherDonor.save({ validateBeforeSave: false });

      const otherToken = jwt.sign(
        { id: otherDonor._id, role: 'donor' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .put(`/api/donations/${donationId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          foodName: 'Hacked Pizza'
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('not authorized');
    });

    it('should return 404 for non-existent donation', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/donations/${fakeId}`)
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          foodName: 'Updated Pizza'
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/donations/:id', () => {
    let donationId;

    beforeEach(async () => {
      const donation = await Donation.create({
        donor: donorId,
        foodName: 'To Delete Pizza',
        quantity: 10,
        expiryDate: new Date(Date.now() + 86400000),
        status: 'available'
      });
      donationId = donation._id;
    });

    it('should delete donation successfully by owner', async () => {
      const response = await request(app)
        .delete(`/api/donations/${donationId}`)
        .set('Authorization', `Bearer ${donorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Donation deleted successfully');

      // Verify donation is deleted
      const donation = await Donation.findById(donationId);
      expect(donation).toBeNull();
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete(`/api/donations/${donationId}`);

      expect(response.status).toBe(401);
    });

    it('should return 403 if different donor tries to delete', async () => {
      const otherDonor = new User({
        name: 'Other Donor',
        email: 'other@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'donor',
        organizationName: 'Other Restaurant'
      });
      await otherDonor.save({ validateBeforeSave: false });

      const otherToken = jwt.sign(
        { id: otherDonor._id, role: 'donor' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .delete(`/api/donations/${donationId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 403 if shelter tries to delete', async () => {
      const response = await request(app)
        .delete(`/api/donations/${donationId}`)
        .set('Authorization', `Bearer ${shelterToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Complete Donation Workflow', () => {
    it('should complete full donation lifecycle: create → browse → update → delete', async () => {
      // Step 1: Donor creates donation
      const createResponse = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          foodName: 'Workflow Pizza',
          quantity: 20,
          expiryDate: new Date(Date.now() + 86400000).toISOString(),
          pickupAddress: '123 Main St',
          pickupTime: '2:00 PM - 4:00 PM'
        });

      expect(createResponse.status).toBe(201);
      const donationId = createResponse.body.donation._id;

      // Step 2: Anyone can browse available donations (public endpoint)
      const browseResponse = await request(app)
        .get('/api/donations/available');

      expect(browseResponse.status).toBe(200);
      expect(browseResponse.body.donations.some(d => d._id === donationId)).toBe(true);

      // Step 3: Donor can update their donation
      const updateResponse = await request(app)
        .put(`/api/donations/${donationId}`)
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          quantity: 25
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.donation.quantity).toBe(25);

      // Step 4: Donor can view their donations
      const myDonationsResponse = await request(app)
        .get('/api/donations/my-donations')
        .set('Authorization', `Bearer ${donorToken}`);

      expect(myDonationsResponse.status).toBe(200);
      expect(myDonationsResponse.body.donations.some(d => d._id === donationId)).toBe(true);

      // Step 5: Donor can delete their donation
      const deleteResponse = await request(app)
        .delete(`/api/donations/${donationId}`)
        .set('Authorization', `Bearer ${donorToken}`);

      expect(deleteResponse.status).toBe(200);

      // Step 6: Donation no longer exists
      const getResponse = await request(app)
        .get(`/api/donations/${donationId}`);

      expect(getResponse.status).toBe(404);
    });
  });
});
