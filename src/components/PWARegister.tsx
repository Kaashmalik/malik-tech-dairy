'use client';
import { useEffect } from 'react';
export function PWARegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
        })
        .catch(error => {
        });
    }
  }, []);
  return null;
}