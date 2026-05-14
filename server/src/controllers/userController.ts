// src/controllers/userController.ts
// User-facing API: orders history + profile

import { Request, Response } from 'express';
import { getSupabaseAdmin } from '../middleware/auth';

export async function getUserOrders(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;

  try {
    const db = getSupabaseAdmin();

    const { data, error } = await db
      .from('orders')
      .select(`
        id, order_code, status, family_email_capture, created_at, updated_at,
        order_items(
          price,
          product_variants(variant_name, type),
          products(name)
        ),
        purchased_items(id, email, pass, link, created_at)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    console.error('[getUserOrders] Error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
}

export async function getUserProfile(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;

  try {
    const db = getSupabaseAdmin();

    const { data, error } = await db
      .from('profiles')
      .select('id, email, full_name, is_admin, created_at')
      .eq('id', userId)
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    console.error('[getUserProfile] Error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
}
