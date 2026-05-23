const { protect, authorize } = require('../middleware/authMiddleware');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

jest.mock('jsonwebtoken');
jest.mock('../models/User');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('protect', () => {
    it('should return 401 if no token provided', async () => {
      await protect(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Not authorized, no token' });
    });

    it('should call next if valid token', async () => {
      req.headers.authorization = 'Bearer validtoken';
      jwt.verify.mockReturnValue({ id: 'userId' });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: 'userId', role: 'Developer' })
      });

      await protect(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.user._id).toBe('userId');
    });

    it('should return 401 if token is invalid', async () => {
      req.headers.authorization = 'Bearer invalidtoken';
      jwt.verify.mockImplementation(() => { throw new Error('invalid signature'); });

      await protect(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Token is invalid or expired' });
    });
  });

  describe('authorize', () => {
    it('should return 403 if user role is not included', () => {
      req.user = { role: 'Developer' };
      const middleware = authorize('Admin');
      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should call next if user role is included', () => {
      req.user = { role: 'Admin' };
      const middleware = authorize('Admin', 'Developer');
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
