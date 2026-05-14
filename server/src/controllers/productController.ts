// src/controllers/productController.ts
// Products API - returns products with live inventory counts

import { Request, Response } from 'express';
import { getSupabaseAdmin } from '../middleware/auth';

export async function getProducts(_req: Request, res: Response): Promise<void> {
  try {
    const db = getSupabaseAdmin();

    const { data: products, error: productsError } = await db
      .from('products')
      .select(`
        id, name, description, category_id,
        categories ( id, name, slug ),
        product_variants (
          id, variant_name, price, type
        )
      `)
      .order('created_at', { ascending: false });

    if (productsError) throw productsError;

    // Get live inventory counts per variant (count AVAILABLE items only)
    const variantIds = (products || [])
      .flatMap((p: Record<string, unknown>) => (p.product_variants as Array<{ id: string }>).map(v => v.id));

    const { data: inventoryCounts } = await db
      .from('inventory')
      .select('variant_id')
      .in('variant_id', variantIds)
      .eq('status', 'AVAILABLE');

    // Build count map
    const countMap: Record<string, number> = {};
    (inventoryCounts || []).forEach((row: { variant_id: string }) => {
      countMap[row.variant_id] = (countMap[row.variant_id] || 0) + 1;
    });

    // Attach inventory_count to each variant
    const enriched = (products || []).map((p: Record<string, unknown>) => ({
      ...p,
      product_variants: (p.product_variants as Array<{ id: string }>).map(v => ({
        ...v,
        inventory_count: countMap[v.id] || 0,
      })),
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    console.error('[getProducts] Error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
}

export async function getProductById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const db = getSupabaseAdmin();

    const { data: product, error } = await db
      .from('products')
      .select(`
        id, name, description, category_id,
        categories ( id, name, slug ),
        product_variants ( id, variant_name, price, type )
      `)
      .eq('id', id)
      .single();

    if (error || !product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    // Get inventory counts
    const variantIds = (product.product_variants as Array<{ id: string }>).map(v => v.id);
    const { data: inventoryCounts } = await db
      .from('inventory')
      .select('variant_id')
      .in('variant_id', variantIds)
      .eq('status', 'AVAILABLE');

    const countMap: Record<string, number> = {};
    (inventoryCounts || []).forEach((row: { variant_id: string }) => {
      countMap[row.variant_id] = (countMap[row.variant_id] || 0) + 1;
    });

    const enriched = {
      ...product,
      product_variants: (product.product_variants as Array<{ id: string }>).map(v => ({
        ...v,
        inventory_count: countMap[v.id] || 0,
      })),
    };

    res.json({ success: true, data: enriched });
  } catch (err) {
    console.error('[getProductById] Error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch product' });
  }
}
