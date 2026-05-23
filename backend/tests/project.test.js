const request = require('supertest');
const app = require('../server');
const Project = require('../models/Project');

jest.mock('../models/Project');
jest.mock('../middleware/authMiddleware', () => ({
  protect: (req, res, next) => {
    req.user = { _id: 'mockUserId', name: 'Mock User', role: 'Developer' };
    next();
  },
  authorize: (...roles) => (req, res, next) => next()
}));

describe('Project API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/projects should return paginated projects', async () => {
    Project.countDocuments.mockResolvedValue(1);
    Project.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([{ name: 'Test Project', _id: 'proj1' }])
    });

    const res = await request(app).get('/api/projects?page=1&limit=10&search=Test');
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.projects.length).toBe(1);
    expect(res.body.projects[0].name).toBe('Test Project');
  });

  it('POST /api/projects should fail if required fields are missing', async () => {
    Project.create.mockRejectedValue(new Error('Validation Error'));
    const res = await request(app).post('/api/projects').send({});
    expect(res.statusCode).toEqual(500);
    expect(res.body.success).toBe(false);
  });
});
