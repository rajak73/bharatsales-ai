import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SyncEngine } from './sync/syncEngine'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const swUrl = import.meta.env.DEV ? '/dev-sw.js?dev-sw' : '/sw.js';
      const registration = await navigator.serviceWorker.register(swUrl, { 
        type: import.meta.env.DEV ? 'module' : 'classic' 
      });
      console.log('SW registered:', registration);
      
      // Request background sync permission if available
      if ('sync' in registration) {
        try {
          await (registration as any).sync.register('bharatsales-sync');
          console.log('Background Sync registered');
        } catch (err) {
          console.warn('Background Sync registration skipped (Permission denied). This is normal in local dev or until the PWA is installed.', err);
        }
      }
    } catch (err) {
      console.error('SW registration failed:', err);
    }
  });

  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'TRIGGER_SYNC') {
      console.log('Received TRIGGER_SYNC from SW');
      SyncEngine.triggerSync();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
