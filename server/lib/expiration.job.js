// lib/expiration.job.js
// Expiration Job: scan purchased_items with status='active' and expiry_date < NOW()
// Mark them as 'expired' and send a single batch Telegram alert to Admin.
//
// Schedule: runs once at startup, then repeats at 00:00 UTC every day.
// Pattern: mirrors cleanup.job.js — uses native setTimeout/setInterval, no external cron library.

'use strict';

const { supabaseAdmin } = require('../middleware/auth');
const { sendTelegramMessage } = require('../services/telegram.service');

const TELEGRAM_ADMIN_ID = process.env.TELEGRAM_ADMIN_ID || '';

/**
 * Returns milliseconds until the next 00:00 UTC.
 */
function msUntilMidnightUTC() {
  const now = new Date();
  const midnight = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1, // next day
    0, 0, 0, 0
  ));
  return midnight.getTime() - now.getTime();
}

/**
 * Core logic: find expired active accounts, mark them, and notify Admin.
 */
async function expireAccountsAndNotify() {
  console.log('[ExpirationJob] Running expiry check...');

  try {
    const now = new Date().toISOString();

    // 1. Find all active purchased_items that have passed their expiry_date
    const { data: expiredItems, error: fetchError } = await supabaseAdmin
      .from('purchased_items')
      .select('id, email, expiry_date')
      .eq('status', 'active')
      .not('expiry_date', 'is', null)
      .lt('expiry_date', now);

    if (fetchError) {
      console.error('[ExpirationJob] Error fetching expired items:', fetchError.message);
      return;
    }

    if (!expiredItems || expiredItems.length === 0) {
      console.log('[ExpirationJob] No expired accounts found.');
      return;
    }

    const ids = expiredItems.map(item => item.id);

    // 2. Bulk-update all found items to status='expired'
    const { error: updateError } = await supabaseAdmin
      .from('purchased_items')
      .update({ status: 'expired' })
      .in('id', ids);

    if (updateError) {
      console.error('[ExpirationJob] Error updating status:', updateError.message);
      return;
    }

    console.log(`[ExpirationJob] Marked ${expiredItems.length} account(s) as expired.`);

    // 3. Send a single batch Telegram notification to Admin
    const emailList = expiredItems
      .map(item => `  • <code>${item.email}</code>`)
      .join('\n');

    const message =
      `⚠️ <b>ACC ĐÃ HẾT HẠN - CẦN ĐỔI PASS/KICK!</b>\n\n` +
      `📋 Tổng: <b>${expiredItems.length}</b> tài khoản\n\n` +
      `${emailList}\n\n` +
      `🕛 Thời điểm quét: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`;

    await sendTelegramMessage(message, TELEGRAM_ADMIN_ID);

  } catch (err) {
    console.error('[ExpirationJob] Unexpected error:', err);
  }
}

/**
 * Start the expiration job:
 * - Runs once immediately on startup.
 * - Then schedules itself to run at 00:00 UTC every day.
 */
function startExpirationJob() {
  const msToMidnight = msUntilMidnightUTC();
  const hoursToMidnight = (msToMidnight / 1000 / 60 / 60).toFixed(2);

  console.log(
    `[ExpirationJob] Started — will run at next 00:00 UTC (in ~${hoursToMidnight}h), then every 24h.`
  );

  // Run once immediately (catches any items that expired while server was down)
  expireAccountsAndNotify();

  // Schedule first run at next midnight UTC
  setTimeout(() => {
    expireAccountsAndNotify();
    // After the first midnight hit, repeat every 24 hours
    setInterval(expireAccountsAndNotify, 24 * 60 * 60 * 1000);
  }, msToMidnight);
}

module.exports = { startExpirationJob };
