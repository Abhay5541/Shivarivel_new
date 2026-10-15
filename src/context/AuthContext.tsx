import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPasswordRecovery: boolean;
  setIsPasswordRecovery: (val: boolean) => void;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  demoSignIn: (role?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.hash.includes('type=recovery');
    }
    return false;
  });

  useEffect(() => {
    let isMounted = true;

    // 1. Initial session check
    async function initSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Supabase auth getSession notice:', error.message);
        }
        if (isMounted) {
          setSession(data?.session ?? null);
          setUser(data?.session?.user ?? null);
        }
      } catch (err) {
        console.warn('Local auth initialization note:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initSession();

    // 2. Auth state subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
        }
        if (isMounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signInWithPassword = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error };
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const resetPasswordForEmail = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/login`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      if (error) return { error };
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) return { error };
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out warning:', err);
    } finally {
      setUser(null);
      setSession(null);
      setIsPasswordRecovery(false);
    }
  };

  // Demo fallback sign-in for development and evaluation when running without live Supabase Auth
  const demoSignIn = (role = 'Owner') => {
    const mockUser = {
      id: 'demo-user-001',
      app_metadata: {},
      user_metadata: { full_name: 'K. Senthil Nathan', role },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: 'owner@shivarivel.com',
    } as unknown as User;

    setUser(mockUser);
    setSession({
      access_token: 'demo-token',
      token_type: 'bearer',
      user: mockUser,
      expires_in: 3600,
      refresh_token: 'demo-refresh',
    } as Session);
  };

  const value = useMemo(
    () => ({
      user,
      session,
      isLoading,
      isAuthenticated: Boolean(session || user),
      isPasswordRecovery,
      setIsPasswordRecovery,
      signInWithPassword,
      resetPasswordForEmail,
      updatePassword,
      signOut,
      demoSignIn,
    }),
    [user, session, isLoading, isPasswordRecovery]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
