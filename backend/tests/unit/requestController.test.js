const requestController = require('../../src/controllers/requestController');
const Request = require('../../src/models/Request');
const Donation = require('../../src/models/Donation');
const mongoose = require('mongoose');

// Mock the models
jest.mock('../../src/models/Request');
jest.mock('../../src/models/Donation');

// Mock email service so tests don't send real emails
jest.mock('../../src/config/emailService', () => ({
  sendApprovalEmail: jest.fn().mockResolvedValue(undefined),
  sendRejectionEmail: jest.fn().mockResolvedValue(undefined),
}));

describe('Request Controller - Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    // Setup mock request and response objects
    req = {
      body: {},
      params: {},
      user: { _id: 'user123', role: 'shelter' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('createRequest', () => {
    it('should create a request successfully for available donation', async () => {
      // Arrange
      req.body = {
        donationId: 'donation123',
        message: 'We need this food'
      };

      const mockDonation = {
        _id: 'donation123',
        status: 'available',
        save: jest.fn()
      };

      const mockRequest = {
        _id: 'request123',
        donation: 'donation123',
        shelter: 'user123',
        status: 'pending',
        message: 'We need this food'
      };

      Donation.findById = jest.fn().mockResolvedValue(mockDonation);
      Request.findOne = jest.fn().mockResolvedValue(null); // No existing request
      Request.create = jest.fn().mockResolvedValue(mockRequest);

      // Act
      await requestController.createRequest(req, res);

      // Assert
      expect(Donation.findById).toHaveBeenCalledWith('donation123');
      expect(Request.findOne).toHaveBeenCalled();
      // Donation stays 'available' — no longer set to 'requested' on creation
      expect(mockDonation.status).toBe('available');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Request created successfully',
        request: mockRequest
      });
    });

    it('should return 400 if donation is not available', async () => {
      // Arrange
      req.body = {
        donationId: 'donation123',
        message: 'We need this food'
      };

      const mockDonation = {
        _id: 'donation123',
        status: 'approved' // Not available
      };

      Donation.findById = jest.fn().mockResolvedValue(mockDonation);

      // Act
      await requestController.createRequest(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Donation not available'
      });
    });

    it('should return 400 if donation does not exist', async () => {
      // Arrange
      req.body = {
        donationId: 'donation123',
        message: 'We need this food'
      };

      Donation.findById = jest.fn().mockResolvedValue(null);

      // Act
      await requestController.createRequest(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Donation not available'
      });
    });

    it('should prevent duplicate requests from same shelter', async () => {
      // Arrange
      req.body = {
        donationId: 'donation123',
        message: 'We need this food'
      };

      const mockDonation = {
        _id: 'donation123',
        status: 'available'
      };

      const existingRequest = {
        _id: 'existingRequest123',
        donation: 'donation123',
        shelter: 'user123',
        status: 'pending'
      };

      Donation.findById = jest.fn().mockResolvedValue(mockDonation);
      Request.findOne = jest.fn().mockResolvedValue(existingRequest);

      // Act
      await requestController.createRequest(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'You have already requested this donation'
      });
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      req.body = {
        donationId: 'donation123',
        message: 'We need this food'
      };

      Donation.findById = jest.fn().mockRejectedValue(new Error('Database error'));

      // Act
      await requestController.createRequest(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database error'
      });
    });
  });

  describe('approveRequest', () => {
    it('should approve request and auto-reject other pending requests', async () => {
      // Arrange
      req.params.id = 'request123';
      req.user._id = 'donor123';

      const mockRequest = {
        _id: 'request123',
        donation: {
          _id: 'donation123',
          donor: 'donor123',
          status: 'requested',
          save: jest.fn()
        },
        shelter: { _id: 'shelter123', name: 'Test Shelter', email: 'shelter@test.com' },
        foodName: 'Rice',
        requestedQuantity: 5,
        status: 'pending',
        save: jest.fn()
      };

      Request.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockRequest)
        })
      });

      Request.updateMany = jest.fn().mockResolvedValue({ modifiedCount: 2 });

      // Act
      await requestController.approveRequest(req, res);

      // Assert
      expect(mockRequest.status).toBe('approved');
      // Controller sets donation to 'reserved' (not 'approved') on approval
      expect(mockRequest.donation.status).toBe('reserved');
      expect(mockRequest.save).toHaveBeenCalled();
      expect(mockRequest.donation.save).toHaveBeenCalled();
      expect(Request.updateMany).toHaveBeenCalledWith(
        {
          donation: 'donation123',
          _id: { $ne: 'request123' },
          status: 'pending'
        },
        { status: 'rejected' }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Request approved and other requests rejected',
        request: mockRequest
      });
    });

    it('should return 404 if request not found', async () => {
      // Arrange
      req.params.id = 'request123';

      Request.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        })
      });

      // Act
      await requestController.approveRequest(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Request not found'
      });
    });

    it('should return 403 if user is not the donation owner', async () => {
      // Arrange
      req.params.id = 'request123';
      req.user._id = 'differentDonor';

      const mockRequest = {
        _id: 'request123',
        donation: {
          _id: 'donation123',
          donor: 'donor123',
          status: 'requested'
        },
        shelter: { _id: 'shelter123', name: 'Test Shelter', email: 'shelter@test.com' },
        status: 'pending'
      };

      Request.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockRequest)
        })
      });

      // Act
      await requestController.approveRequest(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'You are not authorized to approve this request'
      });
    });
  });

  describe('rejectRequest', () => {
    it('should reject request and make donation available if no other pending requests', async () => {
      // Arrange
      req.params.id = 'request123';
      req.user._id = 'donor123';

      const mockRequest = {
        _id: 'request123',
        donation: {
          _id: 'donation123',
          donor: 'donor123',
          status: 'requested',
          save: jest.fn()
        },
        shelter: { _id: 'shelter123', name: 'Test Shelter', email: 'shelter@test.com' },
        foodName: 'Rice',
        status: 'pending',
        save: jest.fn()
      };

      Request.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockRequest)
        })
      });

      Request.find = jest.fn().mockResolvedValue([]); // No other pending requests

      // Act
      await requestController.rejectRequest(req, res);

      // Assert
      expect(mockRequest.status).toBe('rejected');
      expect(mockRequest.donation.status).toBe('available');
      expect(mockRequest.save).toHaveBeenCalled();
      expect(mockRequest.donation.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should reject request but keep donation as requested if other pending requests exist', async () => {
      // Arrange
      req.params.id = 'request123';
      req.user._id = 'donor123';

      const mockRequest = {
        _id: 'request123',
        donation: {
          _id: 'donation123',
          donor: 'donor123',
          status: 'requested',
          save: jest.fn()
        },
        shelter: { _id: 'shelter123', name: 'Test Shelter', email: 'shelter@test.com' },
        foodName: 'Rice',
        status: 'pending',
        save: jest.fn()
      };

      Request.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockRequest)
        })
      });

      // Other pending requests exist
      Request.find = jest.fn().mockResolvedValue([{ _id: 'request456', status: 'pending' }]);

      // Act
      await requestController.rejectRequest(req, res);

      // Assert
      expect(mockRequest.status).toBe('rejected');
      expect(mockRequest.donation.status).toBe('requested'); // Should stay requested
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 403 if user is not the donation owner', async () => {
      // Arrange
      req.params.id = 'request123';
      req.user._id = 'differentDonor';

      const mockRequest = {
        _id: 'request123',
        donation: {
          _id: 'donation123',
          donor: 'donor123',
          status: 'requested'
        },
        shelter: { _id: 'shelter123', name: 'Test Shelter', email: 'shelter@test.com' },
        status: 'pending'
      };

      Request.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockRequest)
        })
      });

      // Act
      await requestController.rejectRequest(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'You are not authorized to reject this request'
      });
    });
  });

  describe('getRequestsByDonation', () => {
    it('should return all requests for a specific donation', async () => {
      // Arrange
      req.params.donationId = 'donation123';

      const mockRequests = [
        {
          _id: 'request1',
          donation: 'donation123',
          shelter: { name: 'Shelter A' },
          status: 'pending'
        },
        {
          _id: 'request2',
          donation: 'donation123',
          shelter: { name: 'Shelter B' },
          status: 'approved'
        }
      ];

      // Mock the mongoose ObjectId validation
      mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(true);

      const populateMock = jest.fn().mockReturnThis();
      Request.find = jest.fn().mockReturnValue({
        populate: jest.fn(() => ({
          populate: jest.fn().mockResolvedValue(mockRequests)
        }))
      });

      // Act
      await requestController.getRequestsByDonation(req, res);

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith('donation123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        requests: mockRequests
      });
    });

    it('should return 400 for invalid donation ID', async () => {
      // Arrange
      req.params.donationId = 'invalid-id';

      mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(false);

      // Act
      await requestController.getRequestsByDonation(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid donation ID'
      });
    });
  });

  describe('getMyRequests', () => {
    it('should return all requests for logged-in shelter', async () => {
      // Arrange
      req.user._id = 'shelter123';

      const mockRequests = [
        {
          _id: 'request1',
          shelter: 'shelter123',
          status: 'pending',
          donation: { foodName: 'Pizza' }
        }
      ];

      Request.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockRequests)
      });

      // Act
      await requestController.getMyRequests(req, res);

      // Assert
      expect(Request.find).toHaveBeenCalledWith({ shelter: 'shelter123' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        requests: mockRequests
      });
    });
  });
});
