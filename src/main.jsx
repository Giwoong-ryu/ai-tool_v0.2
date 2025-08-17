// src/main.jsx — Clerk 적용 버전 (Vite + React 18)
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './app.jsx';
import { register as registerSW, precacheResources } from './utils/serviceWorker.js';
import { ClerkProvider } from '@clerk/clerk-react';
import { koKR } from '@clerk/localizations';

// Web Vitals 콘솔 출력(선택)
if (typeof window !== 'undefined') {
  function sendToAnalytics(metric) {
    console.log('Performance metric:', metric);
  }
  const reportWebVitals = (onPerfEntry) => {
    if (onPerfEntry && typeof onPerfEntry === 'function') {
      if ('PerformanceObserver' in window) {
        try {
          const lcpObserver = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            onPerfEntry({ name: 'LCP', value: lastEntry.startTime, id: 'largest-contentful-paint' });
          });
          lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        } catch {}
        try {
          const fidObserver = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach((entry) => {
              onPerfEntry({ name: 'FID', value: entry.processingStart - entry.startTime, id: 'first-input-delay' });
            });
          });
          fidObserver.observe({ type: 'first-input', buffered: true });
        } catch {}
        try {
          const clsObserver = new PerformanceObserver((entryList) => {
            let clsValue = 0;
            const entries = entryList.getEntries();
            entries.forEach((entry) => { if (!entry.hadRecentInput) clsValue += entry.value; });
            onPerfEntry({ name: 'CLS', value: clsValue, id: 'cumulative-layout-shift' });
          });
          clsObserver.observe({ type: 'layout-shift', buffered: true });
        } catch {}      }
    }
  };
  reportWebVitals(sendToAnalytics);
}

// Clerk Publishable Key (Vite)
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// 루트 렌더
const container = document.getElementById('root');
const root = createRoot(container);

// 키가 없으면 Clerk 없이 렌더(개발 편의)
if (!PUBLISHABLE_KEY) {
  console.warn('VITE_CLERK_PUBLISHABLE_KEY가 없습니다. Clerk 없이 앱을 렌더링합니다.');
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} else {
  root.render(
    <StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} localization={koKR}>
        <App />
      </ClerkProvider>
    </StrictMode>
  );
}

// Service Worker
registerSW({
  onSuccess: () => {
    console.log('Service Worker registered successfully');
    precacheResources(['/favicon.png', '/manifest.json']);
  },
  onUpdate: () => {
    console.log('New service worker available');
  },
});

// 핵심 폰트 프리로드(선택)
if (typeof window !== 'undefined') {
  const fontLink = document.createElement('link');
  fontLink.rel = 'preload';
  fontLink.href = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/PretendardVariable.woff2';
  fontLink.as = 'font';
  fontLink.type = 'font/woff2';
  fontLink.crossOrigin = 'anonymous';
  document.head.appendChild(fontLink);
}