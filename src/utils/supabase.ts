import { createClient } from '@supabase/supabase-js';
import { ENV_CONFIG } from '../config/env';

const supabaseUrl = ENV_CONFIG.SUPABASE_URL;
const supabaseAnonKey = ENV_CONFIG.SUPABASE_ANON_KEY;

console.log('[SUPABASE] URL:', supabaseUrl);
console.log('[SUPABASE] Anon Key:', supabaseAnonKey ? 'Present' : 'Missing');
console.log('[SUPABASE] Full URL check:', supabaseUrl?.includes('supabase.co') ? 'Valid' : 'Invalid');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[SUPABASE] Missing environment variables');
  console.error('[SUPABASE] SUPABASE_URL:', supabaseUrl);
  console.error('[SUPABASE] SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'Missing');
  throw new Error('Missing Supabase environment variables. Please check your configuration.');
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