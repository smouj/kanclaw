'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SetupContent from './SetupContent';

export default function HomePageWrapper() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is configured (has OpenClaw URL or is in demo mode)
    const hasConfig = 
      localStorage.getItem('demo_mode') === 'true' ||
      (localStorage.getItem('openclaw_url') && localStorage.getItem('openclaw_token'));
    
    if (!hasConfig) {
      setIsConfigured(false);
    } else {
      setIsConfigured(true);
      // Redirect to first project if configured
      router.push('/project/demo');
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--kc-bg)' }}>
        <div className="animate-pulse" style={{ color: 'var(--kc-text-muted)' }}>Cargando...</div>
      </div>
    );
  }

  if (!isConfigured) {
    return <SetupContent />;
  }

  return null;
}
