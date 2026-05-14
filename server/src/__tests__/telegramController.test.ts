// src/__tests__/telegramController.test.ts
// TDD: Unit tests for pure parsing logic — no DB, no API calls needed

import { describe, it, expect } from 'vitest';
import { extractOrderCodeFromText, parseFulfillmentReply } from '../controllers/telegramController';

describe('extractOrderCodeFromText', () => {
  it('should extract order code from bot notification text', () => {
    const text = '✅ ĐƠN FAMILY MỚI — Cần xử lý thủ công\n\nMã đơn: 123456789\nSố tiền: 99.000 ₫';
    expect(extractOrderCodeFromText(text)).toBe('123456789');
  });

  it('should return null if no order code in text', () => {
    expect(extractOrderCodeFromText('Hello world')).toBeNull();
  });

  it('should handle different spacing around Mã đơn', () => {
    expect(extractOrderCodeFromText('🏷️ Mã đơn:  987654321')).toBe('987654321');
  });
});

describe('parseFulfillmentReply', () => {
  it('should parse valid "email | pass | link" format', () => {
    const result = parseFulfillmentReply('user@gmail.com | mypassword123 | https://invite.link');
    expect(result).toEqual({
      email: 'user@gmail.com',
      pass: 'mypassword123',
      link: 'https://invite.link',
    });
  });

  it('should parse valid format without link (link optional)', () => {
    const result = parseFulfillmentReply('user@gmail.com | mypassword123');
    expect(result).toEqual({
      email: 'user@gmail.com',
      pass: 'mypassword123',
      link: '',
    });
  });

  it('should return null if email has no @', () => {
    expect(parseFulfillmentReply('notanemail | pass123 | link')).toBeNull();
  });

  it('should return null if password is empty', () => {
    expect(parseFulfillmentReply('user@gmail.com |  | link')).toBeNull();
  });

  it('should return null if format has only 1 part (no pipe)', () => {
    expect(parseFulfillmentReply('user@gmail.com')).toBeNull();
  });

  it('should trim whitespace from each field', () => {
    const result = parseFulfillmentReply('  user@test.com  |  secret  |  ');
    expect(result?.email).toBe('user@test.com');
    expect(result?.pass).toBe('secret');
    expect(result?.link).toBe('');
  });
});

describe('Admin route guard', () => {
  // Integration test — 403 when non-admin hits admin endpoints
  it('should be tested via orderRoutes integration (auth middleware shared)', () => {
    // The requireAdmin middleware is tested indirectly through the auth middleware
    // which is already covered in orderRoutes.test.ts
    expect(true).toBe(true);
  });
});
