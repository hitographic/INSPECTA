// Environment configuration
// For GitHub Pages deployment, these values are embedded at build time

export const ENV_CONFIG = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://kugvoxhacfbjweqsqgdx.supabase.co',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'sb_publishable_0TntBHuHVOyLGpkp5Sd43w_AkpI0c-c'
};

// Validate configuration
if (!ENV_CONFIG.SUPABASE_URL || !ENV_CONFIG.SUPABASE_ANON_KEY) {
  console.error('[CONFIG] Missing environment variables!');
  console.error('[CONFIG] SUPABASE_URL:', ENV_CONFIG.SUPABASE_URL ? 'Present' : 'Missing');
  console.error('[CONFIG] SUPABASE_ANON_KEY:', ENV_CONFIG.SUPABASE_ANON_KEY ? 'Present' : 'Missing');
}

console.log('[CONFIG] Environment configuration loaded');
console.log('[CONFIG] SUPABASE_URL:', ENV_CONFIG.SUPABASE_URL);
console.log('[CONFIG] SUPABASE_ANON_KEY:', ENV_CONFIG.SUPABASE_ANON_KEY ? 'Present' : 'Missing');
