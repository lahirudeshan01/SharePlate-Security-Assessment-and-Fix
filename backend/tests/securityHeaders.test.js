///////////Clickjacking & Content Security Policy (CSP)///////////

const request = require('supertest');
const app = require('../src/app');

describe('Security headers', () => {
  it('protects responses from framing and restricts content sources', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    expect(response.headers['content-security-policy']).toContain("frame-ancestors 'none'");
  });
});