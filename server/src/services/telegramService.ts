// src/services/telegramService.ts
// Telegram Bot notification service

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_ADMIN_ID = process.env.TELEGRAM_ADMIN_ID || '';

export async function sendTelegramMessage(message: string, chatId?: string): Promise<void> {
  const targetChat = chatId || TELEGRAM_ADMIN_ID;

  if (!TELEGRAM_BOT_TOKEN || !targetChat) {
    console.warn('[Telegram] Missing bot token or admin ID, skipping notification');
    return;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChat,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Telegram] Failed to send message:', error);
    }
  } catch (err) {
    console.error('[Telegram] Network error:', err);
  }
}

export function buildOrderNotification(params: {
  orderCode: string;
  productName: string;
  variantName: string;
  amount: number;
  userEmail: string;
  familyEmail?: string;
  status: 'PAID' | 'FULFILLED' | 'OUT_OF_STOCK';
}): string {
  const amountFormatted = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(params.amount);

  if (params.status === 'OUT_OF_STOCK') {
    return (
      `🔴 <b>CHÁY KHO!</b>\n\n` +
      `📦 Sản phẩm: ${params.productName} - ${params.variantName}\n` +
      `🏷️ Mã đơn: <code>${params.orderCode}</code>\n` +
      `💰 Số tiền: ${amountFormatted}\n` +
      `👤 Khách hàng: ${params.userEmail}\n\n` +
      `⚠️ Đơn hàng đã thanh toán nhưng <b>kho đã hết</b>. Cần nạp kho ngay!`
    );
  }

  if (params.familyEmail) {
    return (
      `✅ <b>ĐƠN FAMILY MỚI</b> — Cần xử lý thủ công\n\n` +
      `📦 Sản phẩm: ${params.productName} - ${params.variantName}\n` +
      `🏷️ Mã đơn: <code>${params.orderCode}</code>\n` +
      `💰 Số tiền: ${amountFormatted}\n` +
      `👤 Khách hàng: ${params.userEmail}\n` +
      `📧 Email Family: <code>${params.familyEmail}</code>\n\n` +
      `👉 Reply tin nhắn này với: <code>email | pass | link</code>`
    );
  }

  return (
    `✅ <b>ĐƠN HÀNG ĐÃ GIAO</b>\n\n` +
    `📦 Sản phẩm: ${params.productName} - ${params.variantName}\n` +
    `🏷️ Mã đơn: <code>${params.orderCode}</code>\n` +
    `💰 Số tiền: ${amountFormatted}\n` +
    `👤 Khách hàng: ${params.userEmail}`
  );
}
