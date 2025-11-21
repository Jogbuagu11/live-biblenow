import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { auth } from './supabase';
import { supabase } from './supabase';

interface AuthState {
  user: User | null;
  profile: any | null;
  currentRole: 'client' | 'proxy' | null;
  availableRoles: ('client' | 'proxy')[];
  loading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: any) => void;
  setCurrentRole: (role: 'client' | 'proxy') => Promise<void>;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  currentRole: null,
  availableRoles: [],
  loading: true,
  initialized: false,
  
  setUser: (user) => set({ user }),
  
  setProfile: (profile) => set({ profile }),
  
  setCurrentRole: async (role: 'client' | 'proxy') => {
    const { user } = get();
    if (!user) return;
    
    try {
      // Call the switch_user_role function
      const { error } = await supabase.rpc('switch_user_role', {
        user_uuid: user.id,
        new_role: role,
      });
      
      if (error) throw error;
      
      // Refresh profile to get updated role
      await get().refreshProfile();
    } catch (error) {
      console.error('Error switching role:', error);
      throw error;
    }
  },
  
  setLoading: (loading) => set({ loading }),
  
  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;
    
    try {
      // Get profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) throw profileError;
      
      // Get user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role, is_active')
        .eq('user_id', user.id);
      
      if (rolesError) throw rolesError;
      
      const availableRoles = (roles || []).map((r: any) => r.role) as ('client' | 'proxy')[];
      const activeRole = roles?.find((r: any) => r.is_active)?.role as 'client' | 'proxy' | null;
      
      set({
        profile,
        currentRole: activeRole || profile?.role || 'client',
        availableRoles: availableRoles.length > 0 ? availableRoles : [profile?.role || 'client'],
      });
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  },
  
  initialize: async () => {
    try {
      const { data: { session } } = await auth.getSession();
      set({ user: session?.user ?? null, loading: false, initialized: true });
      
      if (session?.user) {
        await get().refreshProfile();
      }
      
      // Listen for auth changes
      auth.onAuthStateChange(async (event, session) => {
        set({ user: session?.user ?? null });
        if (session?.user) {
          await get().refreshProfile();
        } else {
          set({ profile: null, currentRole: null, availableRoles: [] });
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ loading: false, initialized: true });
    }
  },
  
  signOut: async () => {
    await auth.signOut();
    set({ user: null, profile: null, currentRole: null, availableRoles: [] });
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

