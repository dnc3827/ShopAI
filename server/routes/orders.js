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
    const orderCodeStr = orderCode.toString(); // Store as String in DB

    // 4. Create order record in DB
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: user.id,
        status: 'PENDING',
        order_code: orderCodeStr,
        family_email_capture: familyEmail || null,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('[createOrder] DB error:', orderError);
      res.status(500).json({ success: false, error: 'Failed to create order' });
      return;
    }

    // 5. Create order_item record
    await supabaseAdmin.from('order_items').insert({
      order_id: order.id,
      variant_id: variantId,
      product_id: productId,
      price: variant.price,
    });

    // 6. Call PayOS to create payment link
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
        orderId: order.id,
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

module.exports = router;
