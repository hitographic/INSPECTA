import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// Support both key names: ANON_KEY (used in GitHub Actions deploy) and PUBLISHABLE_DEFAULT_KEY (used locally)
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[SUPABASE] Missing configuration!', {
    url: supabaseUrl ? 'Present' : 'Missing',
    key: supabaseKey ? 'Present' : 'Missing',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing',
    publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY ? 'Present' : 'Missing',
  });
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
