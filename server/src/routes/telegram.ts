// src/routes/telegram.ts
import { Router } from 'express';
import { handleTelegramWebhook } from '../controllers/telegramController';

const router = Router();

// Public — Telegram calls this (security via TELEGRAM_ADMIN_ID check inside handler)
router.post('/webhook', handleTelegramWebhook);

export default router;
