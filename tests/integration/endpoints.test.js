import request from 'supertest';
import app from '../server.js';

describe('API Endpoints', () => {
  it('GET /api/nfl/standings returns array', async () => {
    const res = await request(app).get('/api/nfl/standings');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.standings)).toBe(true);
  });
});

