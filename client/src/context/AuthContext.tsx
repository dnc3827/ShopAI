// client/src/context/AuthContext.tsx
// Global Supabase auth state — wraps entire app

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import api from '../lib/api';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  isLoading: true,
  isAdmin: false,
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      userIdRef.current = session?.user?.id ?? null;
      if (session?.user) fetchAdminStatus();
      else setIsLoading(false);
    });

    // Listen for auth changes — only react to real auth events, NOT token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // TOKEN_REFRESHED fires on every tab-focus; ignore it to prevent spurious re-renders
      if (event === 'TOKEN_REFRESHED') return;

      const nextUserId = session?.user?.id ?? null;
      if (event === 'SIGNED_IN' && nextUserId && nextUserId === userIdRef.current) {
        setSession(session);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      userIdRef.current = nextUserId;
      if (session?.user) fetchAdminStatus();
      else {
        setIsAdmin(false);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAdminStatus = async () => {
    try {
      const res = await api.get<{ success: boolean; data: { is_admin: boolean } }>('/user/profile');
      setIsAdmin(res.data.data?.is_admin || false);
    } catch {
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    userIdRef.current = null;
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// Guard: redirect to /auth if not logged in
export const useRequireAuth = () => {
  const auth = useAuth();
  return auth;
};
