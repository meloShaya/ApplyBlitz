import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { LocalMemory, localMemoryStore } from '../lib/localMemory';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (LocalMemory) {
      // Use local memory simulation
      const initializeAuth = () => {
        const currentUser = localMemoryStore.getCurrentUser();
        console.log('Auth initialization - current user:', currentUser);
        
        if (currentUser) {
          setUser(currentUser as any);
          setSession({ access_token: 'mock-token', user: currentUser } as any);
        } else {
          setUser(null);
          setSession(null);
        }
        setLoading(false);
      };

      initializeAuth();

      // Listen for auth changes in local memory
      const handleStorageChange = () => {
        const currentUser = localMemoryStore.getCurrentUser();
        console.log('Storage change detected - current user:', currentUser);
        
        if (currentUser) {
          setUser(currentUser as any);
          setSession({ access_token: 'mock-token', user: currentUser } as any);
        } else {
          setUser(null);
          setSession(null);
        }
      };

      // Set up a custom event listener for auth changes
      window.addEventListener('demo-auth-change', handleStorageChange);
      
      return () => {
        window.removeEventListener('demo-auth-change', handleStorageChange);
      };
    } else {
      // Use real Supabase
      const getSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      };

      getSession();

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      );

      return () => subscription.unsubscribe();
    }
  }, []);

  const signOut = async () => {
    if (LocalMemory) {
      await localMemoryStore.signOut();
      setUser(null);
      setSession(null);
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('demo-auth-change'));
    } else {
      await supabase.auth.signOut();
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
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