import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, AuthError } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (displayName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } finally {
        setLoading(false);
      }
    }
    loadUser();

    // Set up auth listener - KEEP SIMPLE, avoid async operations in callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Sign in with email and password
  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  }

  // Sign up with email and password
  async function signUp(email: string, password: string, displayName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split('@')[0]
        }
      }
    });

    if (!error && data.user) {
      // Create user profile
      await supabase.from('user_profiles').insert({
        id: data.user.id,
        email: data.user.email,
        display_name: displayName || email.split('@')[0]
      });
    }

    return { error };
  }

  // Sign out
  async function signOut() {
    localStorage.removeItem('is_premium_intel');
    await supabase.auth.signOut();
  }

  // Update user profile
  async function updateProfile(displayName: string) {
    if (!user) return;

    await supabase.from('user_profiles').update({
      display_name: displayName,
      updated_at: new Date().toISOString()
    }).eq('id', user.id);

    // Update auth metadata
    await supabase.auth.updateUser({
      data: { display_name: displayName }
    });
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
