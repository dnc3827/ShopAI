// src/routes/admin.ts
import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import {
  getInventoryStats,
  getInventoryList,
  addInventoryItem,
  bulkAddInventory,
  getAdminOrders,
} from '../controllers/adminController';

const router = Router();

// All admin routes require admin role
router.use(requireAdmin);

router.get('/inventory/stats', getInventoryStats);
router.get('/inventory', getInventoryList);
router.post('/inventory/add', addInventoryItem);
router.post('/inventory/bulk', bulkAddInventory);
router.get('/orders', getAdminOrders);

export default router;
