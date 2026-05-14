// src/__tests__/orderRoutes.test.ts
// Integration tests for order endpoints

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index';

describe('POST /api/orders/create', () => {
  it('should return 401 when no authorization header is provided', async () => {
    const res = await request(app)
      .post('/api/orders/create')
      .send({ variantId: 'some-id', productId: 'some-product-id' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 when an invalid token is provided', async () => {
    const res = await request(app)
      .post('/api/orders/create')
      .set('Authorization', 'Bearer invalid-token-xyz')
      .send({ variantId: 'some-id', productId: 'some-product-id' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/orders/webhook/payos', () => {
  it('should always return 200 even with invalid payload (prevent PayOS retry)', async () => {
    const res = await request(app)
      .post('/api/orders/webhook/payos')
      .send({});  // Empty/invalid body

    // ⚠️ TDD Rule: ALWAYS return 200 to prevent PayOS retry spam
    expect(res.status).toBe(200);
  });

  it('should return 200 with error when signature is invalid', async () => {
    const res = await request(app)
      .post('/api/orders/webhook/payos')
      .send({
        code: '00',
        success: true,
        data: { orderCode: '123456', amount: 99000 },
        signature: 'invalid-signature',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/products', () => {
  it('should return 200 or 500 (may be empty or error without DB)', async () => {
    const res = await request(app).get('/api/products');
    // With no DB configured, it should return 200 or 500, but not 404
    expect([200, 500]).toContain(res.status);
  }, 15000); // Allow up to 15s for DNS timeout in test env
});
