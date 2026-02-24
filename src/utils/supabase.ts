import { createClient } from '@supabase/supabase-js';

// Hardcoded fallbacks ensure the app works even if GitHub Secrets are not set
const FALLBACK_URL = 'https://irmxvpltmhdeuovlfgnk.supabase.co';
const FALLBACK_KEY = 'sb_publishable_fpYrkB8e71lSXLdRIjFMZw_9jEWaBQo';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || FALLBACK_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[SUPABASE] Missing configuration!');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
