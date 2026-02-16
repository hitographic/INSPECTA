// Environment configuration
// For GitHub Pages deployment, these values are embedded at build time

export const ENV_CONFIG = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://smgykukpclxbgbqgyslv.supabase.co',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtZ3lrdWtwY2x4YmdicWd5c2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTIzODEsImV4cCI6MjA4MDM4ODM4MX0.Fpea0d3KMUpVw0GxYOg7cMTACS1tAUlvzCUGO-93AfE'
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
