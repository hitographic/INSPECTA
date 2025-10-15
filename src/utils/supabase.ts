import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('[SUPABASE] URL:', supabaseUrl);
console.log('[SUPABASE] Anon Key:', supabaseAnonKey ? 'Present' : 'Missing');
console.log('[SUPABASE] Full URL check:', supabaseUrl?.includes('supabase.co') ? 'Valid' : 'Invalid');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[SUPABASE] Missing environment variables');
  console.error('[SUPABASE] VITE_SUPABASE_URL:', supabaseUrl);
  console.error('[SUPABASE] VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'Missing');
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'sanitation-pwa'
    }
  }
});

// Test connection on initialization
console.log('[SUPABASE] Testing connection...');
(async () => {
  try {
    const { data, error } = await supabase
      .from('sanitation_records')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('[SUPABASE] Connection test failed:', error);
      console.error('[SUPABASE] Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log('[SUPABASE] Connection test successful', data);
    }
  } catch (error: unknown) {
    console.error('[SUPABASE] Connection test error:', error);
  }
})();