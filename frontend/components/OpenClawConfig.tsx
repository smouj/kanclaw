'use client';

import { useEffect, useState } from 'react';
import { Settings, Wifi, WifiOff, Key, RefreshCw, Loader2, Eye, EyeOff, Plug, Check, X } from 'lucide-react';

interface OpenClawConfigProps {
  onSave?: () => void;
}

export function OpenClawConfig({ onSave }: OpenClawConfigProps) {
  const [httpUrl, setHttpUrl] = useState('');
  const [wsUrl, setWsUrl] = useState('');
  const [bearerToken, setBearerToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch('/api/openclaw/config');
        const config = await response.json();
        setHttpUrl(config.httpUrl || '');
        setWsUrl(config.wsUrl || '');
        setBearerToken(config.bearerToken || '');
      } catch (e) {
        console.error('Failed to load OpenClaw config');
      }
    })();
  }, []);

  async function handleSave() {
    setLoading(true);
    const config = { httpUrl, wsUrl, bearerToken };
    const response = await fetch('/api/openclaw/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!response.ok) {
      setLoading(false);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    if (onSave) onSave();
    setLoading(false);
  }

  async function handleTest() {
    setTesting(true);
    try {
      const response = await fetch('/api/health', { cache: 'no-store' });
      setStatus(response.ok ? 'connected' : 'disconnected');
    } catch {
      setStatus('disconnected');
    }
    setTesting(false);
  }

  return (
    <div 
      className="rounded-xl border p-6"
      style={{ 
        backgroundColor: 'var(--kc-surface)', 
        borderColor: 'var(--kc-border)' 
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'var(--kc-accent-green)' }}
        >
          <Plug className="w-5 h-5 text-black" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Configurar OpenClaw</h3>
          <p className="text-xs" style={{ color: 'var(--kc-text-muted)' }}>
            Conecta tu gateway de OpenClaw
          </p>
        </div>
      </div>

      {/* Status Indicator */}
      <div 
        className="flex items-center gap-3 p-3 rounded-lg mb-5"
        style={{ backgroundColor: 'var(--kc-surface2)' }}
      >
        {status === 'connected' ? (
          <>
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(51, 255, 51, 0.2)' }}>
              <Wifi className="w-4 h-4" style={{ color: 'var(--kc-accent-green)' }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--kc-accent-green)' }}>Conectado</p>
              <p className="text-xs" style={{ color: 'var(--kc-text-muted)' }}>Gateway activo</p>
            </div>
          </>
        ) : status === 'disconnected' ? (
          <>
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 51, 51, 0.2)' }}>
              <WifiOff className="w-4 h-4" style={{ color: '#ff3333' }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: '#ff3333' }}>Desconectado</p>
              <p className="text-xs" style={{ color: 'var(--kc-text-muted)' }}>Revisa la configuración</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--kc-surface)' }}>
              <Wifi className="w-4 h-4" style={{ color: 'var(--kc-text-muted)' }} />
            </div>
            <div>
              <p className="text-sm font-medium">Sin probar</p>
              <p className="text-xs" style={{ color: 'var(--kc-text-muted)' }}>Configura y prueba la conexión</p>
            </div>
          </>
        )}
        <button 
          onClick={handleTest}
          disabled={testing}
          className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
          style={{ borderColor: 'var(--kc-border)', color: 'var(--kc-text-primary)' }}
        >
          {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Probar'}
        </button>
      </div>

      {/* HTTP URL */}
      <div className="space-y-2 mb-4">
        <label className="text-sm font-medium flex items-center gap-2">
          <Key className="w-4 h-4" style={{ color: 'var(--kc-text-muted)' }} />
          HTTP Endpoint
        </label>
        <input 
          type="url"
          value={httpUrl}
          onChange={(e) => setHttpUrl(e.target.value)}
          placeholder="http://127.0.0.1:18789"
          className="w-full px-4 py-3 rounded-lg border text-sm"
          style={{ 
            backgroundColor: 'var(--kc-surface2)', 
            borderColor: 'var(--kc-border)',
            color: 'var(--kc-text-primary)'
          }}
        />
      </div>

      {/* WebSocket URL */}
      <div className="space-y-2 mb-4">
        <label className="text-sm font-medium flex items-center gap-2">
          <Settings className="w-4 h-4" style={{ color: 'var(--kc-text-muted)' }} />
          WebSocket Endpoint
        </label>
        <input 
          type="url"
          value={wsUrl}
          onChange={(e) => setWsUrl(e.target.value)}
          placeholder="ws://127.0.0.1:18789/events"
          className="w-full px-4 py-3 rounded-lg border text-sm"
          style={{ 
            backgroundColor: 'var(--kc-surface2)', 
            borderColor: 'var(--kc-border)',
            color: 'var(--kc-text-primary)'
          }}
        />
      </div>

      {/* Bearer Token */}
      <div className="space-y-2 mb-5">
        <label className="text-sm font-medium flex items-center gap-2">
          <Key className="w-4 h-4" style={{ color: 'var(--kc-text-muted)' }} />
          Bearer Token
        </label>
        <div className="relative">
          <input 
            type={showToken ? "text" : "password"}
            value={bearerToken}
            onChange={(e) => setBearerToken(e.target.value)}
            placeholder="Tu token de API"
            className="w-full px-4 py-3 rounded-lg border text-sm pr-12"
            style={{ 
              backgroundColor: 'var(--kc-surface2)', 
              borderColor: 'var(--kc-border)',
              color: 'var(--kc-text-primary)'
            }}
          />
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--kc-text-muted)' }}
          >
            {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Save Button */}
      <button 
        onClick={handleSave} 
        disabled={loading}
        className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
        style={{ 
          backgroundColor: saved ? 'var(--kc-accent-green)' : 'var(--kc-accent-green)',
          color: 'black'
        }}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Guardando...
          </>
        ) : saved ? (
          <>
            <Check className="w-4 h-4" />
            ¡Guardado! Recarga para aplicar
          </>
        ) : (
          <>
            <Settings className="w-4 h-4" />
            Guardar configuración
          </>
        )}
      </button>
    </div>
  );
}
