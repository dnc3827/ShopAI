// src/routes/orders.ts
import { Router } from 'express';
import { createOrder, payosWebhook } from '../controllers/orderController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Protected: create order
router.post('/create', requireAuth, createOrder);

// Public: PayOS webhook
router.post('/webhook/payos', payosWebhook);

export default router;
