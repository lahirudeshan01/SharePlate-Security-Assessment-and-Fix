const authMiddleware = require('../../src/middleware/authMiddleware');
const jwt = require('jsonwebtoken');
const User = require('../../src/models/User');

jest.mock('jsonwebtoken');
jest.mock('../../src/models/User');

describe('Auth Middleware - Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      header: jest.fn()
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authMiddleware', () => {
    it('should authenticate user with valid token', async () => {
      // Arrange
      const token = 'valid-jwt-token';
      const decoded = { id: 'user123', role: 'donor' };
      const user = {
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'donor'
      };

      req.header.mockReturnValue(`Bearer ${token}`);
      jwt.verify = jest.fn().mockReturnValue(decoded);
      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(user)
      });

      // Act
      await authMiddleware(req, res, next);

      // Assert
      expect(req.header).toHaveBeenCalledWith('Authorization');
      expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(req.user).toEqual(user);
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 if no token provided', async () => {
      // Arrange
      req.header.mockReturnValue(null);

      // Act
      await authMiddleware(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. No token provided.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
      // Arrange
      const token = 'invalid-token';
      req.header.mockReturnValue(`Bearer ${token}`);
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      await authMiddleware(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user not found', async () => {
      // Arrange
      const token = 'valid-jwt-token';
      const decoded = { id: 'user123', role: 'donor' };

      req.header.mockReturnValue(`Bearer ${token}`);
      jwt.verify = jest.fn().mockReturnValue(decoded);
      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      // Act
      await authMiddleware(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle token without Bearer prefix', async () => {
      // Arrange
      req.header.mockReturnValue('invalid-format-token');

      // Act
      await authMiddleware(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token'
      });
    });
  });
});
