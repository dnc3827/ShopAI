// routes/webhook.js
const { Router } = require('express');
const { supabaseAdmin } = require('../middleware/auth');
const { verifyWebhookSignature } = require('../services/payos.service');
const { sendTelegramMessage, buildOrderNotification } = require('../services/telegram.service');

const router = Router();

// Public: PayOS webhook
router.post('/payos', async (req, res) => {
  // ⚠️ ALWAYS return 200 regardless of processing result
  // If we return non-200, PayOS will retry and cause spam

  const body = req.body;

  try {
    // 1. Verify HMAC signature (sorted keys)
    const { data, signature } = body;

    if (!data || !signature) {
      console.error('[Webhook] Missing data or signature');
      res.status(200).json({ success: true, error: 'Invalid webhook payload' });
      return;
    }

    const isValid = verifyWebhookSignature(data, signature);
    if (!isValid) {
      console.error('[Webhook] Invalid HMAC signature');
      res.status(200).json({ success: true, error: 'Ping received' });
      return;
    }

    // 2. Check payment status: EXACT condition from TDD
    const isPaid = body.code === '00' && body.success === true;
    if (!isPaid) {
      console.log('[Webhook] Payment not confirmed, code:', body.code);
      res.status(200).json({ success: true, message: 'Invalid signature but ping accepted' });
      return;
    }

    // 3. Find order by order_code (handle as String)
    const orderCodeStr = String(data.orderCode);

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, status, user_id, family_email_capture, order_items(variant_id, product_id, price, product_variants(variant_name, type), products(name))')
      .eq('order_code', orderCodeStr)
      .single();

    if (orderError || !order) {
      console.error('[Webhook] Order not found for code:', orderCodeStr);
      res.status(200).json({ success: false, error: 'Order not found' });
      return;
    }

    // Avoid duplicate processing
    if (order.status !== 'PENDING') {
      console.log('[Webhook] Order already processed:', order.status);
      res.status(200).json({ success: true, message: 'Already processed' });
      return;
    }

    // Lấy thông tin giá tiền của đơn hàng
    const orderItems = order.order_items;
    const firstItem = orderItems?.[0];
    const amountRequired = firstItem?.price || 0;
    const variantType = firstItem?.product_variants?.type;
    const productName = firstItem?.products?.name || 'Sản phẩm';
    const variantName = firstItem?.product_variants?.variant_name || '';

    // =========================================================================
    // 🔥 LỚP BẢO VỆ MỚI: KIỂM TRA SỐ TIỀN THỰC NHẬN (CHỐNG CHUYỂN THIẾU)
    // =========================================================================
    const amountReceived = data.amount;

    if (amountReceived < amountRequired) {
      console.error(`[Webhook] PARTIAL PAYMENT! Order: ${orderCodeStr}. Expected: ${amountRequired}, Received: ${amountReceived}`);

      // Đánh dấu đơn là PARTIAL_PAYMENT để không giao hàng
      await supabaseAdmin
        .from('orders')
        .update({ status: 'PARTIAL_PAYMENT', updated_at: new Date().toISOString() })
        .eq('id', order.id);

      // Bắn thông báo khẩn cấp cho Admin vào xử lý
      sendTelegramMessage(`🚨 **CẢNH BÁO GIAN LẬN / CHUYỂN THIẾU TIỀN** 🚨\n- Đơn hàng: ${orderCodeStr}\n- Khách phải trả: ${amountRequired} VNĐ\n- Khách thực chuyển: ${amountReceived} VNĐ\n- Trạng thái: ĐÃ KHÓA ĐƠN. Admin vui lòng liên hệ khách để thu thêm hoặc hoàn tiền.`)
        .catch(err => console.error('[Telegram Error] Không gửi được thông báo:', err.message));

      res.status(200).json({ success: false, error: 'Partial payment detected' });
      return;
    }
    // =========================================================================

    // Fetch user email for notification
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', order.user_id)
      .single();

    const userEmail = profile?.email || 'Unknown';

    // 4. Update order to PAID first
    await supabaseAdmin
      .from('orders')
      .update({ status: 'PAID', updated_at: new Date().toISOString() })
      .eq('id', order.id);

    // 5. Family type: notify Telegram, do NOT auto-fulfill
    if (variantType === 'family') {
      const message = buildOrderNotification({
        orderCode: orderCodeStr,
        productName,
        variantName,
        amount: amountReceived, // Update to show actual paid amount
        userEmail,
        familyEmail: order.family_email_capture || undefined,
        status: 'PAID',
      });
      await sendTelegramMessage(message);
      res.status(200).json({ success: true, message: 'Family order notified' });
      return;
    }

    // 6. Account type: run ACID transaction via Supabase RPC
    const { data: txResult, error: txError } = await supabaseAdmin
      .rpc('fulfill_order_transaction', { p_order_id: order.id });

    if (txError) {
      console.error('[Webhook] Transaction RPC error:', txError);
      await sendTelegramMessage(`⚠️ Lỗi hệ thống khi xử lý đơn ${orderCodeStr}: ${txError.message}`);
      res.status(200).json({ success: false, error: 'Transaction failed' });
      return;
    }

    const txData = txResult;

    if (!txData.success) {
      if (txData.error === 'OUT_OF_STOCK') {
        // Notify Telegram about stock shortage
        const message = buildOrderNotification({
          orderCode: orderCodeStr,
          productName,
          variantName,
          amount: amountReceived,
          userEmail,
          status: 'OUT_OF_STOCK',
        });
        await sendTelegramMessage(message);
        console.log('[Webhook] Out of stock for order:', orderCodeStr);
      } else {
        await sendTelegramMessage(`⚠️ Lỗi giao hàng đơn ${orderCodeStr}: ${txData.error}`);
      }
      res.status(200).json({ success: false, error: txData.error });
      return;
    }

    // 7. Fulfilled successfully — notify Telegram
    const message = buildOrderNotification({
      orderCode: orderCodeStr,
      productName,
      variantName,
      amount: amountReceived,
      userEmail,
      status: 'FULFILLED',
    });
    await sendTelegramMessage(message);

    res.status(200).json({ success: true, message: 'Order fulfilled' });
  } catch (err) {
    console.error('[Webhook] Unexpected error:', err);
    // ⚠️ Still return 200 to prevent PayOS retry
    res.status(200).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;