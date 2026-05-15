// routes/admin.js
const { Router } = require('express');
const { requireAdmin } = require('../middleware/adminAuth');
const { getSupabaseAdmin } = require('../middleware/auth');

const router = Router();

// All admin routes require admin role
router.use(requireAdmin);

// ─── INVENTORY ──────────────────────────────────────────────

router.get('/inventory/stats', async (_req, res) => {
  console.log('[getInventoryStats] START');
  try {
    const db = getSupabaseAdmin();
    console.log('[getInventoryStats] Supabase admin client created');

    // Step 1: Get all variants with product names
    console.log('[getInventoryStats] Step 1: querying product_variants...');
    const { data: variants, error: variantsError } = await db
      .from('product_variants')
      .select('id, variant_name, products(name)')
      .order('created_at');

    if (variantsError) {
      console.error('[getInventoryStats] Step 1 FAILED:', JSON.stringify(variantsError));
      throw variantsError;
    }
    console.log('[getInventoryStats] Step 1 OK — variants count:', variants?.length);

    // Step 2: Count AVAILABLE items per variant
    console.log('[getInventoryStats] Step 2: querying inventory AVAILABLE...');
    const { data: available, error: availableError } = await db
      .from('inventory')
      .select('variant_id')
      .eq('status', 'AVAILABLE');
    if (availableError) console.error('[getInventoryStats] Step 2 FAILED:', JSON.stringify(availableError));
    console.log('[getInventoryStats] Step 2 OK — available count:', available?.length);

    // Step 3: Count SOLD items per variant
    console.log('[getInventoryStats] Step 3: querying inventory SOLD...');
    const { data: sold, error: soldError } = await db
      .from('inventory')
      .select('variant_id')
      .eq('status', 'SOLD');
    if (soldError) console.error('[getInventoryStats] Step 3 FAILED:', JSON.stringify(soldError));
    console.log('[getInventoryStats] Step 3 OK — sold count:', sold?.length);

    const availableMap = {};
    (available || []).forEach(r => {
      availableMap[r.variant_id] = (availableMap[r.variant_id] || 0) + 1;
    });

    const soldMap = {};
    (sold || []).forEach(r => {
      soldMap[r.variant_id] = (soldMap[r.variant_id] || 0) + 1;
    });

    const stats = (variants || []).map(v => ({
      variant_id: v.id,
      variant_name: v.variant_name,
      product_name: v.products?.name || '',
      available_count: availableMap[v.id] || 0,
      sold_count: soldMap[v.id] || 0,
    }));

    console.log('[getInventoryStats] SUCCESS — stats count:', stats.length);
    res.json({ success: true, data: stats });
  } catch (err) {
    console.error('[getInventoryStats] FATAL ERROR:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch inventory stats' });
  }
});

router.get('/inventory', async (req, res) => {
  console.log('[getInventoryList] START — query:', req.query);
  try {
    const db = getSupabaseAdmin();
    const { variant_id, status } = req.query;

    let query = db
      .from('inventory')
      .select('id, email, status, variant_id, created_at, product_variants(variant_name)')
      .order('created_at', { ascending: false });

    if (variant_id) query = query.eq('variant_id', variant_id);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) {
      console.error('[getInventoryList] Query FAILED:', JSON.stringify(error));
      throw error;
    }

    console.log('[getInventoryList] SUCCESS — items count:', data?.length);
    res.json({ success: true, data });
  } catch (err) {
    console.error('[getInventoryList] FATAL ERROR:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch inventory' });
  }
});

router.post('/inventory/add', async (req, res) => {
  const { variant_id, email, pass, link } = req.body;

  if (!variant_id || !email || !pass) {
    res.status(400).json({ success: false, error: 'variant_id, email, and pass are required' });
    return;
  }

  if (!email.includes('@')) {
    res.status(400).json({ success: false, error: 'Invalid email format' });
    return;
  }

  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from('inventory')
      .insert({ variant_id, email, pass, link: link || null, status: 'AVAILABLE' })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('[addInventoryItem] Error:', err);
    res.status(500).json({ success: false, error: 'Failed to add inventory item' });
  }
});

router.post('/inventory/bulk', async (req, res) => {
  const { variant_id, items } = req.body;

  if (!variant_id || !items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ success: false, error: 'variant_id and items[] are required' });
    return;
  }

  // Validate all items
  const errors = [];
  items.forEach((item, idx) => {
    if (!item.email?.includes('@')) errors.push(`Row ${idx + 1}: invalid email`);
    if (!item.pass) errors.push(`Row ${idx + 1}: password is empty`);
  });

  if (errors.length > 0) {
    res.status(400).json({ success: false, error: errors.join('; ') });
    return;
  }

  try {
    const db = getSupabaseAdmin();
    const rows = items.map(item => ({
      variant_id,
      email: item.email,
      pass: item.pass,
      link: item.link || null,
      status: 'AVAILABLE',
    }));

    const { data, error } = await db.from('inventory').insert(rows).select();
    if (error) throw error;

    res.status(201).json({ success: true, data, inserted: (data || []).length });
  } catch (err) {
    console.error('[bulkAddInventory] Error:', err);
    res.status(500).json({ success: false, error: 'Failed to bulk add inventory' });
  }
});

// ─── ORDERS ─────────────────────────────────────────────────

router.get('/orders', async (req, res) => {
  console.log('[getAdminOrders] START — query:', req.query);
  try {
    const db = getSupabaseAdmin();
    const { status, limit = '50', offset = '0' } = req.query;

    console.log('[getAdminOrders] Building orders query...');
    let query = db
      .from('orders')
      .select(`
        id, order_code, status, family_email_capture, created_at, updated_at,
        profiles(email, full_name),
        order_items(
          price, quantity,
          product_variants(variant_name),
          products(name)
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(
        parseInt(offset),
        parseInt(offset) + parseInt(limit) - 1
      );

    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) {
      console.error('[getAdminOrders] Query FAILED:', JSON.stringify(error));
      throw error;
    }

    console.log('[getAdminOrders] SUCCESS — orders count:', data?.length, 'total:', count);
    res.json({ success: true, data, total: count });
  } catch (err) {
    console.error('[getAdminOrders] FATAL ERROR:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

module.exports = router;
