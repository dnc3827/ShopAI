// src/controllers/orderController.ts
// Order creation + PayOS webhook handler + status polling
//
// ⚠️ TDD Rules:
//   - order_code: Number when calling PayOS, String in DB
//   - isPaid check: code === '00' && success === true
//   - Webhook: ALWAYS return 200, even on error
//   - HMAC: verify before processing

import { Request, Response } from 'express';
import { getSupabaseAdmin } from '../middleware/auth';
import { createPaymentLink, verifyWebhookSignature } from '../services/payosService';
import { sendTelegramMessage, buildOrderNotification } from '../services/telegramService';
import type { CreateOrderPayload } from '../types/index';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

export async function createOrder(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const body: CreateOrderPayload = req.body;
  const { variantId, productId, familyEmail } = body;

  if (!variantId || !productId) {
    res.status(400).json({ success: false, error: 'variantId and productId are required' });
    return;
  }

  try {
    const db = getSupabaseAdmin();

    const { data: variant, error: variantError } = await db
      .from('product_variants')
      .select('id, variant_name, price, type, products(id, name)')
      .eq('id', variantId)
      .single();

    if (variantError || !variant) {
      res.status(404).json({ success: false, error: 'Variant not found' });
      return;
    }

    const variantType = variant.type as string;
    if (variantType === 'family') {
      if (!familyEmail || !familyEmail.includes('@')) {
        res.status(400).json({ success: false, error: 'Valid family email is required for this variant' });
        return;
      }
    }

    const orderCode = parseInt(Date.now().toString().slice(-9));
    const orderCodeStr = orderCode.toString();

    const { data: order, error: orderError } = await db
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

    await db.from('order_items').insert({
      order_id: order.id,
      variant_id: variantId,
      product_id: productId,
      price: variant.price,
    });

    const productInfo = variant.products as { name: string } | null;
    const productName = productInfo?.name || 'San pham';

    const paymentLink = await createPaymentLink({
      orderCode,
      amount: variant.price,
      description: productName.substring(0, 25),
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
}

// ── Lightweight status polling (public) ──────────────────────

export async function getOrderStatus(req: Request, res: Response): Promise<void> {
  const { orderCode } = req.params;

  try {
    const db = getSupabaseAdmin();
    const { data: order, error } = await db
      .from('orders')
      .select('id, order_code, status, updated_at')
      .eq('order_code', orderCode)
      .single();

    if (error || !order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    res.json({ success: true, data: { status: order.status, updatedAt: order.updated_at } });
  } catch (err) {
    console.error('[getOrderStatus] Error:', err);
    res.status(500).json({ success: false, error: 'Failed to get order status' });
  }
}

// ── PayOS Webhook ─────────────────────────────────────────────

export async function payosWebhook(req: Request, res: Response): Promise<void> {
  const body = req.body;

  try {
    const { data, signature } = body;

    if (!data || !signature) {
      console.error('[Webhook] Missing data or signature');
      res.status(200).json({ success: false, error: 'Invalid webhook payload' });
      return;
    }

    const isValid = verifyWebhookSignature(data as Record<string, unknown>, signature);
    if (!isValid) {
      console.error('[Webhook] Invalid HMAC signature');
      res.status(200).json({ success: false, error: 'Invalid signature' });
      return;
    }

    const isPaid = body.code === '00' && body.success === true;
    if (!isPaid) {
      res.status(200).json({ success: true, message: 'Not a payment confirmation' });
      return;
    }

    const db = getSupabaseAdmin();
    const orderCodeStr = String(data.orderCode);

    const { data: order, error: orderError } = await db
      .from('orders')
      .select('id, status, user_id, family_email_capture, order_items(variant_id, product_id, price, product_variants(variant_name, type), products(name))')
      .eq('order_code', orderCodeStr)
      .single();

    if (orderError || !order) {
      console.error('[Webhook] Order not found for code:', orderCodeStr);
      res.status(200).json({ success: false, error: 'Order not found' });
      return;
    }

    if (order.status !== 'PENDING') {
      res.status(200).json({ success: true, message: 'Already processed' });
      return;
    }

    await db.from('orders').update({ status: 'PAID', updated_at: new Date().toISOString() }).eq('id', order.id);

    const orderItems = order.order_items as Array<{
      variant_id: string; product_id: string; price: number;
      product_variants: { variant_name: string; type: string } | null;
      products: { name: string } | null;
    }>;
    const firstItem = orderItems?.[0];
    const variantType = firstItem?.product_variants?.type;
    const productName = firstItem?.products?.name || 'Sản phẩm';
    const variantName = firstItem?.product_variants?.variant_name || '';
    const amount = firstItem?.price || 0;

    const { data: profile } = await db.from('profiles').select('email').eq('id', order.user_id).single();
    const userEmail = profile?.email || 'Unknown';

    if (variantType === 'family') {
      const message = buildOrderNotification({ orderCode: orderCodeStr, productName, variantName, amount, userEmail, familyEmail: order.family_email_capture || undefined, status: 'PAID' });
      await sendTelegramMessage(message);
      res.status(200).json({ success: true, message: 'Family order notified' });
      return;
    }

    const { data: txResult, error: txError } = await db.rpc('fulfill_order_transaction', { p_order_id: order.id });

    if (txError) {
      console.error('[Webhook] Transaction RPC error:', txError);
      await sendTelegramMessage(`⚠️ Lỗi hệ thống khi xử lý đơn ${orderCodeStr}: ${txError.message}`);
      res.status(200).json({ success: false, error: 'Transaction failed' });
      return;
    }

    const txData = txResult as { success: boolean; error?: string };

    if (!txData.success) {
      if (txData.error === 'OUT_OF_STOCK') {
        const message = buildOrderNotification({ orderCode: orderCodeStr, productName, variantName, amount, userEmail, status: 'OUT_OF_STOCK' });
        await sendTelegramMessage(message);
      } else {
        await sendTelegramMessage(`⚠️ Lỗi giao hàng đơn ${orderCodeStr}: ${txData.error}`);
      }
      res.status(200).json({ success: false, error: txData.error });
      return;
    }

    const message = buildOrderNotification({ orderCode: orderCodeStr, productName, variantName, amount, userEmail, status: 'FULFILLED' });
    await sendTelegramMessage(message);
    res.status(200).json({ success: true, message: 'Order fulfilled' });
  } catch (err) {
    console.error('[Webhook] Unexpected error:', err);
    res.status(200).json({ success: false, error: 'Internal server error' });
  }
}
