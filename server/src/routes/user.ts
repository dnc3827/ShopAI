// src/routes/user.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getUserOrders, getUserProfile } from '../controllers/userController';

const router = Router();

router.use(requireAuth);

router.get('/orders', getUserOrders);
router.get('/profile', getUserProfile);

export default router;
