
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
  console.log('[APP] Environment variables check:');
  console.log('[APP] - VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'Present' : 'Missing');
  console.log('[APP] - VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing');
  console.log('[APP] - URL Value:', import.meta.env.VITE_SUPABASE_URL);
  
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
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif;">
      <h1>Application Error</h1>
      <p>Failed to load application. Please check:</p>
      <ul>
        <li>Environment variables are set correctly</li>
        <li>VITE_SUPABASE_URL is configured</li>
        <li>VITE_SUPABASE_ANON_KEY is configured</li>
        <li>Internet connection is stable</li>
        <li>Supabase service is accessible</li>
      </ul>
      <p><strong>Current environment variables:</strong></p>
      <ul>
        <li>VITE_SUPABASE_URL: ${import.meta.env.VITE_SUPABASE_URL || 'Not set'}</li>
        <li>VITE_SUPABASE_ANON_KEY: ${import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Not set'}</li>
      </ul>
      <pre>${error}</pre>
    </div>
  `;
}