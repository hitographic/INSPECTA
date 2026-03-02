
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './index.css'

// Register service worker
registerSW({
  onNeedRefresh() {
    console.log('[PWA] New content available, please refresh.')
  },
  onOfflineReady() {
    console.log('[PWA] App ready to work offline')
  },
})

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

try {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  )
  
  console.log('[APP] App rendered successfully');
  console.log('[APP] Base URL:', import.meta.env.BASE_URL);
  console.log('[APP] Mode:', import.meta.env.MODE);
  
  // Test localStorage
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    console.log('[APP] localStorage is working');
  } catch (error) {
    console.error('[APP] localStorage is not working:', error);
  }
} catch (error) {
  console.error('[APP] Failed to render app:', error);
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : '';

  document.body.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif; max-width: 800px; margin: 50px auto;">
      <div style="background: #fee; border: 2px solid #f00; border-radius: 8px; padding: 20px;">
        <h1 style="color: #c00; margin-top: 0;">⚠️ Application Error</h1>
        <p style="font-size: 16px; line-height: 1.5;">Failed to load INSPECTA application.</p>

        <h3>Error Details:</h3>
        <pre style="background: #fff; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 12px;">${errorMessage}</pre>

        <h3>Troubleshooting:</h3>
        <ul style="line-height: 1.8;">
          <li>Check your internet connection</li>
          <li>Try hard refresh: <strong>Ctrl+Shift+R</strong> (Windows) or <strong>Cmd+Shift+R</strong> (Mac)</li>
          <li>Clear browser cache and reload</li>
          <li>Try different browser (Chrome, Firefox, Safari)</li>
          <li>Check browser console (F12) for detailed errors</li>
        </ul>

        <details style="margin-top: 20px;">
          <summary style="cursor: pointer; font-weight: bold;">Show Stack Trace</summary>
          <pre style="background: #fff; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 11px; margin-top: 10px;">${errorStack || 'No stack trace available'}</pre>
        </details>

        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ccc;">
          <p><strong>Environment:</strong></p>
          <ul style="font-size: 14px;">
            <li>Base URL: ${import.meta.env.BASE_URL || '/'}</li>
            <li>Mode: ${import.meta.env.MODE || 'unknown'}</li>
            <li>Supabase URL: ${import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Not Set'}</li>
            <li>Supabase Key: ${import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not Set'}</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}