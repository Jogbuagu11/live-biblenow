import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { auth } from './supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,
  
  setUser: (user) => set({ user }),
  
  setLoading: (loading) => set({ loading }),
  
  initialize: async () => {
    try {
      const { data: { session } } = await auth.getSession();
      set({ user: session?.user ?? null, loading: false, initialized: true });
      
      // Listen for auth changes
      auth.onAuthStateChange((event, session) => {
        set({ user: session?.user ?? null });
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ loading: false, initialized: true });
    }
  },
  
  signOut: async () => {
    await auth.signOut();
    set({ user: null });
  },
}));

// Additional stores can be added here
interface AppState {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'system',
  setTheme: (theme) => set({ theme }),
}));

