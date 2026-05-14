// src/controllers/telegramController.ts
// Handles Telegram Bot webhook updates
// TDD §4.1 rules:
//   - Read order_code from reply_to_message text
//   - Validate format: "email | pass | link" (link optional)
//   - Email must have @, pass must not be empty
//   - On error: reply "❌ Sai format. Thử lại: email | pass | link"

import { Request, Response } from 'express';
import { getSupabaseAdmin } from '../middleware/auth';
import { sendTelegramMessage } from '../services/telegramService';

const TELEGRAM_ADMIN_ID = process.env.TELEGRAM_ADMIN_ID || '';

interface TelegramMessage {
  message_id: number;
  from?: { id: number; username?: string };
  chat: { id: number };
  text?: string;
  reply_to_message?: {
    text?: string;
    message_id: number;
  };
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

/**
 * Extract order_code from notification text sent by the bot.
 * Looks for pattern: "Mã đơn: 123456789"
 */
export function extractOrderCodeFromText(text: string): string | null {
  // Match "Mã đơn: <code>" pattern (from buildOrderNotification in telegramService.ts)
  const match = text.match(/Mã đơn:\s*(\d+)/);
  return match ? match[1] : null;
}

/**
 * Parse admin reply format: "email | pass | link"
 * Link is optional.
 */
export interface ParsedFulfillment {
  email: string;
  pass: string;
  link: string;
}

export function parseFulfillmentReply(text: string): ParsedFulfillment | null {
  const parts = text.split('|').map(p => p.trim());
  if (parts.length < 2) return null;

  const [email, pass, link = ''] = parts;

  // Validate email has @
  if (!email || !email.includes('@')) return null;
  // Validate password not empty
  if (!pass) return null;

  return { email, pass, link };
}

export async function handleTelegramWebhook(req: Request, res: Response): Promise<void> {
  // Always respond 200 immediately to Telegram (prevent retry)
  res.status(200).json({ ok: true });

  const update: TelegramUpdate = req.body;
  const message = update.message;
  if (!message || !message.text) return;

  const senderId = String(message.from?.id || '');
  const chatId = String(message.chat.id);

  // Only process messages from the configured admin
  if (senderId !== TELEGRAM_ADMIN_ID) {
    console.log(`[Telegram] Ignored message from non-admin: ${senderId}`);
    return;
  }

  // Must be a reply to another message
  const replyTo = message.reply_to_message;
  if (!replyTo || !replyTo.text) {
    // Not a reply — ignore silently
    return;
  }

  // Extract order_code from the original bot notification
  const orderCode = extractOrderCodeFromText(replyTo.text);
  if (!orderCode) {
    await sendTelegramMessage(
      '⚠️ Không tìm thấy mã đơn trong tin nhắn gốc. Hãy reply đúng thông báo đơn hàng.',
      chatId
    );
    return;
  }

  // Parse fulfillment data from admin reply
  const parsed = parseFulfillmentReply(message.text);
  if (!parsed) {
    await sendTelegramMessage(
      '❌ Sai format. Thử lại: email | pass | link',
      chatId
    );
    return;
  }

  // Find the order
  const db = getSupabaseAdmin();
  const { data: order, error: orderError } = await db
    .from('orders')
    .select('id, status, user_id')
    .eq('order_code', orderCode)
    .single();

  if (orderError || !order) {
    await sendTelegramMessage(`❌ Không tìm thấy đơn hàng mã: ${orderCode}`, chatId);
    return;
  }

  if (order.status === 'FULFILLED') {
    await sendTelegramMessage(`⚠️ Đơn ${orderCode} đã được giao rồi.`, chatId);
    return;
  }

  if (order.status !== 'PAID') {
    await sendTelegramMessage(`⚠️ Đơn ${orderCode} đang ở trạng thái: ${order.status}. Không thể fulfill.`, chatId);
    return;
  }

  // Insert purchased_item
  const { error: insertError } = await db.from('purchased_items').insert({
    order_id: order.id,
    user_id: order.user_id,
    email: parsed.email,
    pass: parsed.pass,
    link: parsed.link || null,
  });

  if (insertError) {
    await sendTelegramMessage(`❌ Lỗi khi ghi dữ liệu: ${insertError.message}`, chatId);
    return;
  }

  // Update order status
  await db
    .from('orders')
    .update({ status: 'FULFILLED', updated_at: new Date().toISOString() })
    .eq('id', order.id);

  await sendTelegramMessage(
    `✅ Đã giao hàng thành công cho đơn <code>${orderCode}</code>!\n📧 Email: <code>${parsed.email}</code>`,
    chatId
  );
}
