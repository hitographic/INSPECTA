// Environment configuration
// For GitHub Pages deployment, these values are embedded at build time

export const ENV_CONFIG = {
  GOOGLE_APPS_SCRIPT_URL: import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || '',
  GOOGLE_DRIVE_FOLDER_ID: import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID || '1w4aVxlfSxRAPRGEojRTFOWM9JKUFnnj_',
  GOOGLE_SHEET_ID: import.meta.env.VITE_GOOGLE_SHEET_ID || '1lUiErGiafpnFV4OsCGZwytTMiOIsBbMvkX_FDd2GWX4'
};

// Validate configuration
if (!ENV_CONFIG.GOOGLE_APPS_SCRIPT_URL) {
  console.error('[CONFIG] Missing VITE_GOOGLE_APPS_SCRIPT_URL environment variable!');
}

console.log('[CONFIG] Environment configuration loaded');
console.log('[CONFIG] Google Apps Script URL:', ENV_CONFIG.GOOGLE_APPS_SCRIPT_URL ? 'Set' : 'Missing');
console.log('[CONFIG] Google Sheet ID:', ENV_CONFIG.GOOGLE_SHEET_ID ? 'Set' : 'Missing');
