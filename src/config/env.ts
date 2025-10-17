// Environment configuration
// For GitHub Pages deployment, these values are embedded at build time

export const ENV_CONFIG = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://reisfwzfbbhcahtfpojq.supabase.co',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlaXNmd3pmYmJoY2FodGZwb2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMDk3NjAsImV4cCI6MjA3NTY4NTc2MH0.O4q1ngvPkxbGZmNbdZTeb5esEiaDIZcKY9gP4H9wa5c'
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
