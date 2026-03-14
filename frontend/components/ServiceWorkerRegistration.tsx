'use client';

import { useEffect, useState } from 'react';

export function ServiceWorkerRegistration() {
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('ServiceWorker registered:', registration.scope);
          setRegistered(true);
        })
        .catch((error) => {
          console.error('ServiceWorker registration failed:', error);
        });
    }
  }, []);

  return null;
}
