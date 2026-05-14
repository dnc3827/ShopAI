// src/middleware/auth.ts
// Supabase JWT verification middleware — lazy Supabase client to support tests

import { Request, Response, NextFunction } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        is_admin: boolean;
      };
    }
  }
}

let _supabaseAdmin: SupabaseClient | null = null;
let _supabaseAuth: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = process.env.SUPABASE_URL || 'http://placeholder.supabase.co';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';
    _supabaseAdmin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabaseAdmin;
}

export function getSupabaseAuth(): SupabaseClient {
  if (!_supabaseAuth) {
    const url = process.env.SUPABASE_URL || 'http://placeholder.supabase.co';
    const key = process.env.SUPABASE_ANON_KEY || 'placeholder';
    _supabaseAuth = createClient(url, key);
  }
  return _supabaseAuth;
}

// Convenience export for controllers
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseAdmin() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await requireAuth(req, res, async () => {
    if (!req.user?.is_admin) {
      res.status(403).json({ success: false, error: 'Admin access required' });
      return;
    }
    next();
  });
};
