'use client';

import { useEffect, useRef } from 'react';
import { logger } from './logger';

// Track page navigation time
export function usePagePerformance() {
  const startTime = useRef(typeof performance !== 'undefined' ? performance.now() : 0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const navigationTime = performance.now() - startTime.current;
    
    logger.info('Page navigation', { 
      value: Math.round(navigationTime), 
      unit: 'ms',
      url: window.location.href 
    });

    // Log memory usage if available
    if ('memory' in performance) {
      const mem = (performance as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
      if (mem) {
        logger.info('Memory usage', {
          used: Math.round(mem.usedJSHeapSize / 1024 / 1024),
          total: Math.round(mem.totalJSHeapSize / 1024 / 1024),
          unit: 'MB'
        });
      }
    }
  }, []);
}

// Lightweight performance hook
export function usePerformance() {
  usePagePerformance();
}
