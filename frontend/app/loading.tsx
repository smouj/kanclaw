import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-accent-green" />
        <p className="mt-4 text-text-muted">Loading...</p>
      </div>
    </div>
  );
}
