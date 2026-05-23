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
        user_id,
        order_items(
          price,
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

    // Fetch profiles for these users manually
    const userIds = [...new Set((data || []).map(o => o.user_id))].filter(Boolean);
    let profilesMap = {};
    if (userIds.length > 0) {
      const { data: profilesData } = await db
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);
      
      (profilesData || []).forEach(p => {
        profilesMap[p.id] = { email: p.email, full_name: p.full_name };
      });
    }

    const enrichedData = (data || []).map(o => ({
      ...o,
      profiles: profilesMap[o.user_id] || { email: 'Unknown', full_name: 'Unknown' }
    }));

    console.log('[getAdminOrders] SUCCESS — orders count:', enrichedData.length, 'total:', count);
    res.json({ success: true, data: enrichedData, total: count });
  } catch (err) {
    console.error('[getAdminOrders] FATAL ERROR:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

// ─── CATEGORIES ──────────────────────────────────────────────

router.get('/categories', async (req, res) => {
  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db.from('categories').select('*').order('name');
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/categories', async (req, res) => {
  const { name, slug } = req.body;
  if (!name || !slug) return res.status(400).json({ success: false, error: 'Name and slug are required' });
  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db.from('categories').insert({ name, slug }).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/categories/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db.from('categories').update(updates).eq('id', id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/categories/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const db = getSupabaseAdmin();
    const { error } = await db.from('categories').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: 'Không thể xoá danh mục này do đã có sản phẩm.' });
  }
});

// ─── PRODUCTS ────────────────────────────────────────────────

router.get('/products', async (req, res) => {
  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db.from('products').select(`*, categories(name)`).order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/products', async (req, res) => {
  const { name, description, category_id, thumbnail_url, status, is_featured, slug } = req.body;
  if (!name || !category_id) return res.status(400).json({ success: false, error: 'Name and Category ID are required' });
  try {
    const db = getSupabaseAdmin();
    // Default slug if not provided
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const { data, error } = await db.from('products').insert({ 
      name, description, category_id, thumbnail_url, status: status || 'visible', is_featured: is_featured || false, slug: finalSlug 
    }).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/products/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db.from('products').update(updates).eq('id', id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const db = getSupabaseAdmin();
    const { error } = await db.from('products').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: 'Không thể xoá sản phẩm này do đã có giao dịch.' });
  }
});

// ─── VARIANTS ────────────────────────────────────────────────

router.get('/variants/:product_id', async (req, res) => {
  const { product_id } = req.params;
  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db.from('product_variants').select('*').eq('product_id', product_id).order('created_at');
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/variants', async (req, res) => {
  const { product_id, variant_name, price, type, duration_days } = req.body;
  if (!product_id || !variant_name || price === undefined || !type) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }
  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db.from('product_variants').insert({ 
      product_id, variant_name, price, type, duration_days: duration_days || 30 
    }).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/variants/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db.from('product_variants').update(updates).eq('id', id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/variants/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const db = getSupabaseAdmin();
    const { error } = await db.from('product_variants').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: 'Không thể xoá gói này do đã có tồn kho hoặc giao dịch.' });
  }
});

module.exports = router;
