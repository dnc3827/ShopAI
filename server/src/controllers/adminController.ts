// src/controllers/adminController.ts
// Admin-only API: inventory management + orders overview

import { Request, Response } from 'express';
import { getSupabaseAdmin } from '../middleware/auth';

// ─── INVENTORY ──────────────────────────────────────────────

export async function getInventoryStats(_req: Request, res: Response): Promise<void> {
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

    const availableMap: Record<string, number> = {};
    (available || []).forEach((r: { variant_id: string }) => {
      availableMap[r.variant_id] = (availableMap[r.variant_id] || 0) + 1;
    });

    const soldMap: Record<string, number> = {};
    (sold || []).forEach((r: { variant_id: string }) => {
      soldMap[r.variant_id] = (soldMap[r.variant_id] || 0) + 1;
    });

    const stats = (variants || []).map((v: Record<string, unknown>) => ({
      variant_id: v.id,
      variant_name: v.variant_name,
      product_name: (v.products as { name: string } | null)?.name || '',
      available_count: availableMap[v.id as string] || 0,
      sold_count: soldMap[v.id as string] || 0,
    }));

    console.log('[getInventoryStats] SUCCESS — stats count:', stats.length);
    res.json({ success: true, data: stats });
  } catch (err) {
    console.error('[getInventoryStats] FATAL ERROR:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch inventory stats' });
  }
}

export async function getInventoryList(req: Request, res: Response): Promise<void> {
  console.log('[getInventoryList] START — query:', req.query);
  try {
    const db = getSupabaseAdmin();
    const { variant_id, status } = req.query;

    let query = db
      .from('inventory')
      .select('id, email, status, variant_id, created_at, product_variants(variant_name)')
      .order('created_at', { ascending: false });

    if (variant_id) query = query.eq('variant_id', variant_id as string);
    if (status) query = query.eq('status', status as string);

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
}

export async function addInventoryItem(req: Request, res: Response): Promise<void> {
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
}

export async function bulkAddInventory(req: Request, res: Response): Promise<void> {
  const { variant_id, items } = req.body as {
    variant_id: string;
    items: Array<{ email: string; pass: string; link?: string }>;
  };

  if (!variant_id || !items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ success: false, error: 'variant_id and items[] are required' });
    return;
  }

  // Validate all items
  const errors: string[] = [];
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
}

// ─── ORDERS ─────────────────────────────────────────────────

export async function getAdminOrders(req: Request, res: Response): Promise<void> {
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
      `)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string))
      .range(
        parseInt(offset as string),
        parseInt(offset as string) + parseInt(limit as string) - 1
      );

    if (status) query = query.eq('status', status as string);

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
}
