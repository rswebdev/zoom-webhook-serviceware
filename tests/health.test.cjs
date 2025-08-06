const request = require('supertest');
const app = require('../index.mjs').default || require('../index.mjs');

describe('Healthcheck', () => {
  it('should return 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('OK');
  });
});
