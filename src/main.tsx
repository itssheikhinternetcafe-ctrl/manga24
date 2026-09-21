import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

try {
  if (localStorage.getItem('manhwa24_pwa_cleanup_v1') !== 'done') {
    localStorage.setItem('manhwa24_pwa_cleanup_v1', 'done');
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => void registration.unregister());
      });
    }
    void caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => void caches.delete(cacheName));
    });
  }
} catch {
  // Cleanup is best effort when browser storage is unavailable.
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
