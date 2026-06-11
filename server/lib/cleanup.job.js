// lib/cleanup.job.js
// Cleanup job: expire PENDING orders older than 10 minutes
// Runs every 5 minutes

const { supabaseAdmin } = require('../middleware/auth');

const PENDING_EXPIRE_MINUTES = 10;
const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

async function expireStalePendingOrders() {
  try {
    const cutoff = new Date(Date.now() - PENDING_EXPIRE_MINUTES * 60 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ status: 'EXPIRED', updated_at: new Date().toISOString() })
      .eq('status', 'PENDING')
      .lt('created_at', cutoff)
      .select('order_code');

    if (error) {
      console.error('[CleanupJob] Error expiring orders:', error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log(`[CleanupJob] Expired ${data.length} stale PENDING order(s):`, data.map(o => o.order_code).join(', '));
    }
  } catch (err) {
    console.error('[CleanupJob] Unexpected error:', err);
  }
}

function startCleanupJob() {
  console.log('[CleanupJob] Started — will expire PENDING orders older than 10 minutes every 5 minutes');
  // Run immediately on startup, then on interval
  expireStalePendingOrders();
  setInterval(expireStalePendingOrders, INTERVAL_MS);
}

module.exports = { startCleanupJob };
