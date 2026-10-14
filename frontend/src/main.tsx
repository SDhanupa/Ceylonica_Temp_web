import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'
import { cleanMojibake, sanitizeObject } from './utils/mojibake'

// Auto-clean any stale mojibake from browser storage on app startup
try {
  [localStorage, sessionStorage].forEach((storage) => {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (!key) continue;
      const val = storage.getItem(key);
      if (val && (val.includes('α') || val.includes('Γ') || val.includes('«'))) {
        try {
          const parsed = JSON.parse(val);
          storage.setItem(key, JSON.stringify(sanitizeObject(parsed)));
        } catch {
          storage.setItem(key, cleanMojibake(val));
        }
      }
    }
  });
} catch {
  // Ignore storage access errors
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
