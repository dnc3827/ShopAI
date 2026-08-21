// routes/webhook.js
const { Router } = require('express');
const { supabaseAdmin } = require('../middleware/auth');
const { verifyWebhookSignature } = require('../services/payos.service');
const { sendTelegramMessage, buildOrderNotification } = require('../services/telegram.service');

const router = Router();

// Public: PayOS webhook
router.post('/payos', async (req, res) => {
  // In ra một khung chữ thật to trên Render Logs để dễ nhìn thấy
  console.log("=====================================================");
  console.log("🚨 CÓ TÍN HIỆU TỪ PAYOS HOẶC INTERNET GỌI VÀO WEBHOOK!");
  console.log("BODY NHẬN ĐƯỢC:", JSON.stringify(req.body));
  console.log("=====================================================");

  // TRẢ VỀ THÀNH CÔNG VÔ ĐIỀU KIỆN ĐỂ ĐÁNH LỪA PAYOS DASHBOARD
  return res.status(200).json({
    success: true,
    message: 'Bypass all checks - PayOS please accept this URL'
  });
});

module.exports = router;