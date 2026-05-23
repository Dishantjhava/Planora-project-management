const request = require('supertest');
const app = require('../server');

describe('Auth API Endpoints', () => {
  it('POST /api/auth/login should return validation error on empty body', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it('POST /api/auth/register should return validation error on empty body', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });
});
