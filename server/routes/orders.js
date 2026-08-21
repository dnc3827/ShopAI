// routes/orders.js
const { Router } = require('express');
const { requireAuth, supabaseAdmin } = require('../middleware/auth');
const { createPaymentLink } = require('../services/payos.service');

const router = Router();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Protected: create order
router.post('/create', requireAuth, async (req, res) => {
  const user = req.user;
  const { variantId, productId, familyEmail } = req.body;

  if (!variantId || !productId) {
    res.status(400).json({ success: false, error: 'variantId and productId are required' });
    return;
  }

  try {
    // 1. Fetch variant + product info
    const { data: variant, error: variantError } = await supabaseAdmin
      .from('product_variants')
      .select('id, variant_name, price, type, products(id, name)')
      .eq('id', variantId)
      .single();

    if (variantError || !variant) {
      res.status(404).json({ success: false, error: 'Variant not found' });
      return;
    }

    // 2. Validate family email if required
    const variantType = variant.type;
    if (variantType === 'family') {
      if (!familyEmail || !familyEmail.includes('@')) {
        res.status(400).json({ success: false, error: 'Valid family email is required for this variant' });
        return;
      }
    }

    // 3. Generate a unique order code (timestamp-based, safe for PayOS Number)
    // Using last 9 digits of timestamp to stay within JS safe integer range
    const orderCode = parseInt(Date.now().toString().slice(-9));
    const orderCodeStr = orderCode.toString();

    // =========================================================================
    // 4. ATOMIC STOCK CHECK + ORDER INSERT via Postgres RPC (Advisory Lock)
    //
    //    create_pending_order() acquires pg_advisory_xact_lock(variant_id),
    //    performs the effective-stock calculation (AVAILABLE - PENDING), and
    //    inserts into both `orders` and `order_items` inside one transaction.
    //    If stock is exhausted it RAISE EXCEPTIONs with code 'OUT_OF_STOCK'.
    //    No race condition is possible because the lock serialises all
    //    concurrent requests for the same variant_id at the DB level.
    // =========================================================================
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc(
      'create_pending_order',
      {
        p_user_id:      user.id,
        p_variant_id:   variantId,
        p_product_id:   productId,
        p_order_code:   orderCodeStr,
        p_family_email: familyEmail || null,
        p_price:        variant.price,
      }
    );

    if (rpcError) {
      // Postgres RAISE EXCEPTION message surfaces in rpcError.message
      const isOutOfStock = rpcError.message?.includes('OUT_OF_STOCK');
      console.error('[createOrder] RPC error:', rpcError.message);

      if (isOutOfStock) {
        res.status(400).json({
          success: false,
          error: 'Sản phẩm đã hết hàng hoặc đang có người khác tiến hành thanh toán. Vui lòng thử lại sau ít phút!',
        });
      } else {
        res.status(500).json({ success: false, error: 'Không thể tạo đơn hàng. Vui lòng thử lại.' });
      }
      return;
    }

    const orderId = rpcResult?.order_id;
    if (!orderId) {
      console.error('[createOrder] RPC returned no order_id:', rpcResult);
      res.status(500).json({ success: false, error: 'Failed to create order' });
      return;
    }

    // =========================================================================
    // 5. Call PayOS to create payment link (unchanged from original flow)
    // =========================================================================
    const productInfo = variant.products;
    const productName = productInfo?.name || 'San pham';

    const paymentLink = await createPaymentLink({
      orderCode,           // ⚠️ Number type for PayOS
      amount: variant.price,
      description: productName.substring(0, 25), // ⚠️ Max 25 chars
      productName: variant.variant_name,
      price: variant.price,
      cancelUrl: `${CLIENT_URL}/checkout/cancel?orderCode=${orderCodeStr}`,
      returnUrl: `${CLIENT_URL}/checkout/success?orderCode=${orderCodeStr}`,
    });

    res.json({
      success: true,
      data: {
        orderId,
        orderCode: orderCodeStr,
        checkoutUrl: paymentLink.checkoutUrl,
        qrCode: paymentLink.qrCode,
      },
    });
  } catch (err) {
    console.error('[createOrder] Error:', err);
    res.status(500).json({ success: false, error: 'Failed to create payment link' });
  }
});


// Protected: check order status
router.get('/status/:orderCode', requireAuth, async (req, res) => {
  const user = req.user;
  const { orderCode } = req.params;

  try {
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('status, user_id')
      .eq('order_code', orderCode)
      .single();

    if (error || !order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.user_id !== user.id) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    res.json({ success: true, data: { status: order.status } });
  } catch (err) {
    console.error('[getOrderStatus] Error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch order status' });
  }
});

// Protected: cancel a PENDING order (user closes QR modal)
router.patch('/:orderCode/cancel', requireAuth, async (req, res) => {
  const user = req.user;
  const { orderCode } = req.params;

  try {
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('id, status, user_id')
      .eq('order_code', orderCode)
      .single();

    if (error || !order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.user_id !== user.id) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    if (order.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: `Cannot cancel order with status: ${order.status}` });
    }

    const { data: cancelledOrder, error: cancelError } = await supabaseAdmin
      .from('orders')
      .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
      .eq('id', order.id)
      .eq('status', 'PENDING')
      .select('id')
      .single();

    if (cancelError || !cancelledOrder) {
      console.error('[cancelOrder] Update error:', cancelError);
      return res.status(409).json({ success: false, error: 'Order status changed before cancellation' });
    }

    res.json({ success: true, message: 'Order cancelled' });
  } catch (err) {
    console.error('[cancelOrder] Error:', err);
    res.status(500).json({ success: false, error: 'Failed to cancel order' });
  }
});

module.exports = router;
