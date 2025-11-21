import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Auth helpers
export const auth = {
  signUp: async (email: string, password: string, options?: { data?: { full_name?: string; role?: string } }) => {
    return await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: options?.data,
      },
    });
  },
  
  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  },
  
  signOut: async () => {
    return await supabase.auth.signOut();
  },
  
  getSession: async () => {
    return await supabase.auth.getSession();
  },
  
  getUser: async () => {
    return await supabase.auth.getUser();
  },
  
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
  
  signInWithGoogle: async () => {
    console.log('[Google Sign-In] Starting OAuth flow...');
    console.log('[Google Sign-In] Redirect URL:', `${window.location.origin}/profile`);
    console.log('[Google Sign-In] Current origin:', window.location.origin);
    
    try {
      const result = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/profile`,
        },
      });
      
      console.log('[Google Sign-In] OAuth response:', result);
      if (result.error) {
        console.error('[Google Sign-In] Error:', result.error);
      } else {
        console.log('[Google Sign-In] Success - redirecting to:', result.data?.url);
      }
      
      return result;
    } catch (error) {
      console.error('[Google Sign-In] Exception:', error);
      throw error;
    }
  },
  
  signInWithApple: async () => {
    return await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/profile`,
      },
    });
  },
};

