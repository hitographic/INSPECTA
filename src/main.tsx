
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
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif;">
      <h1>Application Error</h1>
      <p>Failed to load application. Please check:</p>
      <ul>
        <li>Internet connection is stable</li>
        <li>Supabase service is accessible</li>
        <li>Browser console for detailed error messages</li>
      </ul>
      <pre>${error}</pre>
    </div>
  `;
}