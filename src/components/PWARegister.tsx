'use client';
import { useEffect } from 'react';
export function PWARegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // In development, proactively unregister any existing service workers
      // to avoid 404 errors for build manifests like app-build-manifest.json
      if (process.env.NODE_ENV === 'development') {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          for (const registration of registrations) {
            registration.unregister();
            console.log('MTK Dairy: Service worker unregistered in development mode');
          }
        });
        return;
      }

      // Register service worker in production
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => { })
        .catch(error => { });
    }
  }, []);
  return null;
}
