// routes/user.js
const { Router } = require('express');
const { requireAuth, getSupabaseAdmin } = require('../middleware/auth');

const router = Router();

router.use(requireAuth);

router.get('/orders', async (req, res) => {
  const userId = req.user.id;

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
});

router.get('/profile', async (req, res) => {
  const userId = req.user.id;

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
});

module.exports = router;
