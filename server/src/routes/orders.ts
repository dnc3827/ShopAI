// src/routes/orders.ts - updated with polling endpoint
import { Router } from 'express';
import { createOrder, payosWebhook, getOrderStatus } from '../controllers/orderController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Public: lightweight status polling (by orderCode)
router.get('/status/:orderCode', getOrderStatus);

// Protected: create order
router.post('/create', requireAuth, createOrder);

// Public: PayOS webhook
router.post('/webhook/payos', payosWebhook);

export default router;
