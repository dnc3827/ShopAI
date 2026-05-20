require('dotenv').config();
const { getSupabaseAdmin } = require('./middleware/auth');

async function testQuery() {
  const db = getSupabaseAdmin();
  const limit = 50, offset = 0;

  let query = db
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
    .limit(1);

  const { data, error, count } = await query;
  if (error) {
    console.error('ERROR:', error);
  } else {
    console.log('SUCCESS, data length:', data?.length);
  }
}

testQuery();
