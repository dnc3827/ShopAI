// src/__tests__/payosService.test.ts
// TDD: Write tests FIRST for HMAC signature verification
// These tests do NOT require real PayOS credentials

import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'crypto';

// We test the verification logic in isolation
// Import the function to test
import { verifyWebhookSignature } from '../services/payosService';

describe('PayOS Webhook Signature Verification', () => {
  const MOCK_CHECKSUM_KEY = 'test-checksum-key-12345';
  const originalKey = process.env.PAYOS_CHECKSUM_KEY;

  beforeAll(() => {
    process.env.PAYOS_CHECKSUM_KEY = MOCK_CHECKSUM_KEY;
  });

  function buildValidSignature(data: Record<string, unknown>): string {
    const sortedKeys = Object.keys(data).sort();
    const signatureData = sortedKeys.map(k => `${k}=${data[k]}`).join('&');
    return crypto
      .createHmac('sha256', MOCK_CHECKSUM_KEY)
      .update(signatureData)
      .digest('hex');
  }

  it('should return TRUE for a valid HMAC signature', () => {
    const data = { orderCode: '123456789', amount: 99000, status: 'PAID' };
    const validSig = buildValidSignature(data);
    expect(verifyWebhookSignature(data, validSig)).toBe(true);
  });

  it('should return FALSE for a tampered signature', () => {
    const data = { orderCode: '123456789', amount: 99000, status: 'PAID' };
    const tamperedSig = 'abc123invalidhash';
    expect(verifyWebhookSignature(data, tamperedSig)).toBe(false);
  });

  it('should return TRUE regardless of key order in data (keys are sorted)', () => {
    // Data with different key order should produce the same valid signature
    const data1 = { amount: 99000, orderCode: '123', status: 'PAID' };
    const data2 = { status: 'PAID', orderCode: '123', amount: 99000 };
    const sig = buildValidSignature(data1);
    // Both data objects represent the same sorted content
    expect(verifyWebhookSignature(data2, sig)).toBe(true);
  });

  it('should return FALSE when data has been modified after signing', () => {
    const originalData = { orderCode: '123456789', amount: 99000 };
    const sig = buildValidSignature(originalData);
    // Attacker modifies amount
    const tamperedData = { orderCode: '123456789', amount: 1 };
    expect(verifyWebhookSignature(tamperedData, sig)).toBe(false);
  });
});
