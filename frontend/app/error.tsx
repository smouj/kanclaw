'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-8 text-center">
      <div className="mb-6 rounded-full bg-red-500/10 p-4">
        <AlertTriangle className="h-12 w-12 text-red-500" />
      </div>
      
      <h2 className="mb-2 text-2xl font-bold">Something went wrong!</h2>
      
      <p className="mb-2 max-w-md text-text-muted">
        An unexpected error occurred.
      </p>
      
      {error?.message && (
        <p className="mb-6 max-w-lg rounded border border-red-500/20 bg-red-500/5 px-4 py-2 text-sm text-red-400">
          {error.message}
        </p>
      )}
      
      {error?.digest && (
        <p className="mb-6 text-xs text-text-muted">
          Error ID: {error.digest}
        </p>
      )}
      
      <div className="flex gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-lg bg-accent-green px-6 py-3 text-sm font-medium text-black hover:bg-accent-green/90"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
        
        <button
          onClick={() => window.location.href = '/'}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium hover:bg-surface2"
        >
          <Home className="h-4 w-4" />
          Go Home
        </button>
      </div>
    </div>
  );
}
