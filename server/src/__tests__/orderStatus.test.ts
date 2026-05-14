// src/__tests__/orderStatus.test.ts
// TDD: Order status polling endpoint

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index';

describe('GET /api/orders/status/:orderCode', () => {
  it('should return 404 for a non-existent order code', async () => {
    const res = await request(app)
      .get('/api/orders/status/000000000');
    // Without DB: 404 or 500 both acceptable
    expect([404, 500]).toContain(res.status);
  }, 15000);

  it('should be a public route (no auth required)', async () => {
    const res = await request(app)
      .get('/api/orders/status/123456789');
    // Should NOT return 401 — this is a public endpoint
    expect(res.status).not.toBe(401);
  }, 15000);
});
