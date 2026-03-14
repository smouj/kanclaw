'use client';

import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <div className="mb-6 rounded-full bg-red-500/10 p-4">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="mb-2 text-xl font-semibold">Something went wrong</h2>
          <p className="mb-6 max-w-md text-text-muted">
            {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 rounded-lg bg-accent-green px-4 py-2 text-sm font-medium text-black hover:bg-accent-green/90"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface2"
            >
              <Home className="h-4 w-4" />
              Go Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to trigger error boundary
export function useErrorHandler() {
  const [, setError] = useState<Error | null>(null);
  
  return (error: Error) => {
    console.error('Error caught by hook:', error);
    setError(() => {
      throw error;
    });
  };
}

import { useState } from 'react';
