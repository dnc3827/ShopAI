const { Router } = require('express')
const { getSupabaseAdmin } = require('../middleware/auth')
const router = Router()

router.get('/', async (_req, res) => {
  try {
    const db = getSupabaseAdmin();

    const { data: products, error: productsError } = await db
      .from('products')
      .select(`
        id, name, description, category_id, thumbnail_url,
        categories ( id, name, slug ),
        product_variants (
          id, variant_name, price, type
        )
      `)
      .order('created_at', { ascending: false });

    if (productsError) throw productsError;

    console.log('First product:', JSON.stringify(products?.[0]));

    // Get live inventory counts per variant (count AVAILABLE items only)
    const variantIds = (products || [])
      .flatMap(p => p.product_variants.map(v => v.id));

    const { data: inventoryCounts } = await db
      .from('inventory')
      .select('variant_id')
      .in('variant_id', variantIds)
      .eq('status', 'AVAILABLE');

    // Build count map
    const countMap = {};
    (inventoryCounts || []).forEach(row => {
      countMap[row.variant_id] = (countMap[row.variant_id] || 0) + 1;
    });

    // Attach inventory_count to each variant
    const enriched = (products || []).map(p => ({
      ...p,
      product_variants: p.product_variants.map(v => ({
        ...v,
        inventory_count: countMap[v.id] || 0,
      })),
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    console.error('[getProducts] Error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const db = getSupabaseAdmin();

    const { data: product, error } = await db
      .from('products')
      .select(`
        id, name, description, category_id, thumbnail_url,
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
    const variantIds = product.product_variants.map(v => v.id);
    const { data: inventoryCounts } = await db
      .from('inventory')
      .select('variant_id')
      .in('variant_id', variantIds)
      .eq('status', 'AVAILABLE');

    const countMap = {};
    (inventoryCounts || []).forEach(row => {
      countMap[row.variant_id] = (countMap[row.variant_id] || 0) + 1;
    });

    const enriched = {
      ...product,
      product_variants: product.product_variants.map(v => ({
        ...v,
        inventory_count: countMap[v.id] || 0,
      })),
    };

    res.json({ success: true, data: enriched });
  } catch (err) {
    console.error('[getProductById] Error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch product' });
  }
});

module.exports = router;
