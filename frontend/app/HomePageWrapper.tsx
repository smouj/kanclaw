'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SetupContent from './SetupContent';

// Demo content component
function DemoContent() {
  const router = useRouter();
  const exitDemo = () => {
    localStorage.removeItem('demo_mode');
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--kc-bg)', color: 'var(--kc-text-primary)' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--kc-border)', backgroundColor: 'var(--kc-surface)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--kc-accent-green)' }}>
            <span className="text-black font-bold text-lg">K</span>
          </div>
          <h1 className="text-xl font-semibold">KanClaw</h1>
          <span className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: 'rgba(51, 255, 51, 0.2)', color: 'var(--kc-accent-green)' }}>
            DEMO
          </span>
        </div>
        <button
          onClick={exitDemo}
          className="px-4 py-2 rounded-lg text-sm font-medium border"
          style={{ borderColor: 'var(--kc-border)', color: 'var(--kc-text-primary)' }}
        >
          Salir del Demo
        </button>
      </header>

      {/* Demo content - showing mock data */}
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Bienvenido a KanClaw Demo</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="rounded-xl border p-6" style={{ borderColor: 'var(--kc-border)', backgroundColor: 'var(--kc-surface)' }}>
              <h3 className="font-semibold mb-2">🎯 Proyectos</h3>
              <p className="text-3xl font-bold" style={{ color: 'var(--kc-accent-green)' }}>3</p>
              <p className="text-sm" style={{ color: 'var(--kc-text-muted)' }}>Proyectos activos</p>
            </div>
            <div className="rounded-xl border p-6" style={{ borderColor: 'var(--kc-border)', backgroundColor: 'var(--kc-surface)' }}>
              <h3 className="font-semibold mb-2">🤖 Agentes</h3>
              <p className="text-3xl font-bold" style={{ color: 'var(--kc-accent-green)' }}>5</p>
              <p className="text-sm" style={{ color: 'var(--kc-text-muted)' }}>Agentes disponibles</p>
            </div>
            <div className="rounded-xl border p-6" style={{ borderColor: 'var(--kc-border)', backgroundColor: 'var(--kc-surface)' }}>
              <h3 className="font-semibold mb-2">💬 Mensajes</h3>
              <p className="text-3xl font-bold" style={{ color: 'var(--kc-accent-green)' }}>127</p>
              <p className="text-sm" style={{ color: 'var(--kc-text-muted)' }}>Mensajes hoy</p>
            </div>
          </div>

          <div className="rounded-xl border p-6" style={{ borderColor: 'var(--kc-border)', backgroundColor: 'var(--kc-surface)' }}>
            <h3 className="font-semibold mb-4">📋 Proyectos Disponibles</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: 'var(--kc-surface2)' }}>
                <div>
                  <p className="font-medium">rpgclaw</p>
                  <p className="text-sm" style={{ color: 'var(--kc-text-muted)' }}>Proyecto demo de ejemplo</p>
                </div>
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: 'var(--kc-accent-green)', color: 'black' }}
                >
                  Abrir
                </button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: 'var(--kc-surface2)' }}>
                <div>
                  <p className="font-medium">flickclaw</p>
                  <p className="text-sm" style={{ color: 'var(--kc-text-muted)' }}>Segundo proyecto demo</p>
                </div>
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: 'var(--kc-accent-green)', color: 'black' }}
                >
                  Abrir
                </button>
              </div>
            </div>
          </div>

          <p className="mt-8 text-center" style={{ color: 'var(--kc-text-muted)' }}>
            Configura tu OpenClaw para usar con tus propios proyectos
          </p>
        </div>
      </main>
    </div>
  );
}

export default function HomePageWrapper() {
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'setup' | 'demo'>('setup');

  useEffect(() => {
    // Check localStorage
    const demoMode = localStorage.getItem('demo_mode') === 'true';
    const hasConfig = localStorage.getItem('openclaw_url') && localStorage.getItem('openclaw_token');
    
    if (demoMode) {
      setMode('demo');
    } else if (!hasConfig) {
      setMode('setup');
    } else {
      // Has config but not demo - could redirect to actual app
      // For now, show setup
      setMode('setup');
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--kc-bg)' }}>
        <div className="animate-pulse" style={{ color: 'var(--kc-text-muted)' }}>Cargando...</div>
      </div>
    );
  }

  if (mode === 'demo') {
    return <DemoContent />;
  }

  return <SetupContent />;
}
