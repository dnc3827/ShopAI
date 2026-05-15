const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

let _supabaseAdmin = null;
let _supabaseAuth = null;

function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const url = process.env.SUPABASE_URL || 'http://placeholder.supabase.co';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';
    _supabaseAdmin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { WebSocket }
    });
  }
  return _supabaseAdmin;
}

function getSupabaseAuth() {
  if (!_supabaseAuth) {
    const url = process.env.SUPABASE_URL || 'http://placeholder.supabase.co';
    const key = process.env.SUPABASE_ANON_KEY || 'placeholder';
    _supabaseAuth = createClient(url, key, {
      global: { WebSocket }
    });
  }
  return _supabaseAuth;
}

// Convenience export for controllers
const supabaseAdmin = new Proxy({}, {
  get(_target, prop) {
    return getSupabaseAdmin()[prop];
  },
});

const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ success: false, error: 'Missing authorization token' });
    return;
  }

  try {
    const supabaseAuth = getSupabaseAuth();
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ success: false, error: 'Invalid or expired token' });
      return;
    }

    const admin = getSupabaseAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    req.user = {
      id: user.id,
      email: user.email || '',
      is_admin: profile?.is_admin || false,
    };

    next();
  } catch {
    res.status(401).json({ success: false, error: 'Authentication failed' });
  }
};

module.exports = {
  getSupabaseAdmin,
  getSupabaseAuth,
  supabaseAdmin,
  requireAuth
};
