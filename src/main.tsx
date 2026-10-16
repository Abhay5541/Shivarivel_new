import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Purge legacy local mock/test cache so the application purely reflects Supabase cloud data
try {
  const isPurged = localStorage.getItem('shivarivel_test_cache_purged_v3');
  if (!isPurged) {
    const legacyKeys = [
      'shivarivel_projects',
      'shivarivel_purchases',
      'shivarivel_employees',
      'shivarivel_suppliers',
      'shivarivel_daily_wages',
      'shivarivel_attendance',
      'shivarivel_advances',
      'shivarivel_materials',
      'shivarivel_supplier_payments',
    ];
    legacyKeys.forEach((key) => localStorage.removeItem(key));
    localStorage.setItem('shivarivel_test_cache_purged_v3', 'true');
  }
} catch (e) {
  console.warn('Cache purge notice:', e);
}

// Automatic recovery for stale Vite dynamic chunk imports across deployments/reloads
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload error encountered, reloading page...', event);
  window.location.reload();
});

// Top-level error safety net for mobile devices
window.addEventListener('error', (event) => {
  const root = document.getElementById('root');
  if (root && (!root.innerHTML || root.innerHTML.trim() === '')) {
    console.error('Uncaught top-level error during app mount:', event.error);
    root.innerHTML = `
      <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;background-color:#F7F5F0;font-family:sans-serif;text-align:center;">
        <div style="max-width:360px;background:#fff;border:1px solid #E2DDD5;border-radius:16px;padding:24px;box-shadow:0 4px 12px rgba(0,0,0,0.06);">
          <div style="width:48px;height:48px;border-radius:50%;background:#FCEEEE;color:#9E2A2B;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:24px;font-weight:bold;">!</div>
          <h2 style="font-size:18px;font-weight:bold;color:#242424;margin-bottom:8px;">App Reload Required</h2>
          <p style="font-size:13px;color:#6B6B6B;margin-bottom:16px;line-height:1.5;">A new version of the app was updated or a cached asset needs refreshing.</p>
          <button onclick="window.location.reload(true)" style="background:#4A0E0E;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-weight:600;font-size:14px;cursor:pointer;width:100%;">Refresh App</button>
        </div>
      </div>
    `;
  }
});

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
// Register PWA Service Worker
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('Shivarivel PWA Service Worker registered:', reg.scope);
      })
      .catch((err) => {
        console.warn('Shivarivel PWA SW registration failed:', err);
      });
  });
}


