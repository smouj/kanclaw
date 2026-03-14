'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Shield, Zap, Check, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

interface ConfigFormData {
  openclawUrl: string;
  openclawToken: string;
  authToken: string;
}

export default function SetupPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const [formData, setFormData] = useState<ConfigFormData>({
    openclawUrl: typeof window !== 'undefined' ? localStorage.getItem('openclaw_url') || '' : '',
    openclawToken: typeof window !== 'undefined' ? localStorage.getItem('openclaw_token') || '' : '',
    authToken: typeof window !== 'undefined' ? localStorage.getItem('kanclaw_auth_token') || '' : '',
  });

  const handleSave = async () => {
    setSaving(true);
    localStorage.setItem('openclaw_url', formData.openclawUrl);
    localStorage.setItem('openclaw_token', formData.openclawToken);
    localStorage.setItem('kanclaw_auth_token', formData.authToken);
    localStorage.removeItem('demo_mode');
    
    // Simulate save delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setSaving(false);
    setSaved(true);
    
    // Redirect to home after short delay
    setTimeout(() => {
      router.push('/');
    }, 1000);
  };

  const testConnection = async () => {
    if (!formData.openclawUrl) return;
    
    setTesting(true);
    setTestResult(null);
    try {
      const response = await fetch(`${formData.openclawUrl}/api/health`, {
        headers: formData.openclawToken 
          ? { 'Authorization': `Bearer ${formData.openclawToken}` }
          : {},
      });
      if (response.ok) {
        setTestResult({ success: true, message: '¡Conexión exitosa!' });
      } else {
        setTestResult({ success: false, message: `Error: ${response.status}` });
      }
    } catch {
      setTestResult({ success: false, message: 'No se pudo conectar. Verifica la URL.' });
    }
    setTesting(false);
  };

  const enterDemo = () => {
    localStorage.setItem('demo_mode', 'true');
    localStorage.removeItem('openclaw_url');
    localStorage.removeItem('openclaw_token');
    localStorage.removeItem('kanclaw_auth_token');
    router.push('/');
  };

  const isConfigured = formData.openclawUrl && formData.openclawToken;

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ backgroundColor: 'var(--kc-bg)', color: 'var(--kc-text-primary)' }}>
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: 'var(--kc-border)', backgroundColor: 'var(--kc-surface)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--kc-accent-green)' }}>
          <span className="text-black font-bold text-lg">K</span>
        </div>
        <h1 className="text-xl font-semibold">KanClaw</h1>
      </header>

      <div className="max-w-xl mx-auto px-6 py-12">
        {/* Demo Mode */}
        <div className="rounded-xl border p-6 mb-8" style={{ borderColor: 'var(--kc-border)', backgroundColor: 'var(--kc-surface)' }}>
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-6 h-6" style={{ color: 'var(--kc-accent-green)' }} />
            <h2 className="text-xl font-semibold">Modo Demo</h2>
          </div>
          <p className="mb-6" style={{ color: 'var(--kc-text-muted)' }}>
            Explora KanClaw con datos de ejemplo - ¡sin configuración necesaria!
          </p>
          <button
            onClick={enterDemo}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all"
            style={{ backgroundColor: 'var(--kc-accent-green)', color: 'black' }}
          >
            <Zap className="w-5 h-5" />
            Entrar en Modo Demo
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--kc-border)' }} />
          <span className="text-sm" style={{ color: 'var(--kc-text-muted)' }}>o</span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--kc-border)' }} />
        </div>

        {/* OpenClaw Configuration */}
        <div className="rounded-xl border p-6" style={{ borderColor: 'var(--kc-border)', backgroundColor: 'var(--kc-surface)' }}>
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6" style={{ color: 'var(--kc-accent-green)' }} />
            <h2 className="text-xl font-semibold">Configurar OpenClaw</h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">
                URL de OpenClaw
              </label>
              <input
                type="url"
                value={formData.openclawUrl}
                onChange={(e) => setFormData({ ...formData, openclawUrl: e.target.value })}
                placeholder="http://localhost:3001"
                className="w-full px-4 py-3 rounded-lg border text-foreground"
                style={{ 
                  backgroundColor: 'var(--kc-surface2)', 
                  borderColor: 'var(--kc-border)',
                  color: 'var(--kc-text-primary)'
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Token de OpenClaw
              </label>
              <input
                type="password"
                value={formData.openclawToken}
                onChange={(e) => setFormData({ ...formData, openclawToken: e.target.value })}
                placeholder="Tu token de API"
                className="w-full px-4 py-3 rounded-lg border text-foreground"
                style={{ 
                  backgroundColor: 'var(--kc-surface2)', 
                  borderColor: 'var(--kc-border)',
                  color: 'var(--kc-text-primary)'
                }}
              />
            </div>

            <button
              onClick={testConnection}
              disabled={testing || !formData.openclawUrl}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all disabled:opacity-50"
              style={{ borderColor: 'var(--kc-border)', color: 'var(--kc-text-primary)' }}
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {testing ? 'Probando...' : 'Probar Conexión'}
            </button>

            {testResult && (
              <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                testResult.success 
                  ? '' 
                  : ''
              }`}
              style={{ 
                backgroundColor: testResult.success ? 'rgba(51, 255, 51, 0.1)' : 'rgba(255, 51, 51, 0.1)',
                color: testResult.success ? 'var(--kc-accent-green)' : '#ff3333'
              }}>
                {testResult.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {testResult.message}
              </div>
            )}
          </div>
        </div>

        {/* Auth Token (Optional) */}
        <div className="rounded-xl border p-6 mt-6" style={{ borderColor: 'var(--kc-border)', backgroundColor: 'var(--kc-surface)' }}>
          <h3 className="text-lg font-semibold mb-2">Protección con Auth (opcional)</h3>
          <p className="mb-4 text-sm" style={{ color: 'var(--kc-text-muted)' }}>
            Establece un token para proteger el acceso a KanClaw.
          </p>

          <div>
            <label className="block text-sm font-medium mb-2">
              Token de autenticación
            </label>
            <input
              type="password"
              value={formData.authToken}
              onChange={(e) => setFormData({ ...formData, authToken: e.target.value })}
              placeholder="Dejar vacío para acceso público"
              className="w-full px-4 py-3 rounded-lg border text-foreground"
              style={{ 
                backgroundColor: 'var(--kc-surface2)', 
                borderColor: 'var(--kc-border)',
                color: 'var(--kc-text-primary)'
              }}
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving || !isConfigured}
          className="flex items-center justify-center gap-2 w-full mt-8 px-6 py-4 rounded-xl font-semibold text-lg transition-all disabled:opacity-50"
          style={{ backgroundColor: 'var(--kc-accent-green)', color: 'black' }}
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Guardando...
            </>
          ) : saved ? (
            <>
              <Check className="w-5 h-5" />
              ¡Guardado! Redirecting...
            </>
          ) : (
            <>
              <Settings className="w-5 h-5" />
              Guardar y Continuar
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
