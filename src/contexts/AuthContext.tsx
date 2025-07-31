import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User as SupabaseUser, AuthResponse } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', session.user.id)
          .single();
        setUser({ id: session.user.id, email: session.user.email!, name: profile?.name || '' });
      }
      setIsLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        supabase
          .from('profiles')
          .select('name')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile }) => {
            setUser({ id: session.user.id, email: session.user.email!, name: profile?.name || '' });
          });
      } else {
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const response = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);
    return response;
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          email_confirm: true,
        },
      },
    });

    if (error || !data.user) {
      setIsLoading(false);
      return false;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: data.user.id, name }]);

    if (profileError) {
      // If profile creation fails, we should probably handle this, maybe delete the user
      console.error("Error creating profile:", profileError);
      setIsLoading(false);
      return false;
    }

    const { error: settingsError } = await supabase
      .from('user_settings')
      .insert([{ user_id: data.user.id }]);

    if (settingsError) {
      // If settings creation fails, we should probably handle this, maybe delete the user
      console.error("Error creating user settings:", settingsError);
      setIsLoading(false);
      return false;
    }

    setIsLoading(false);
    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};