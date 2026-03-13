'use client';

import { useEffect, useState } from 'react';
import { Settings, Wifi, WifiOff, Key, RefreshCw, Loader2, Eye, EyeOff, Plug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
    setTimeout(() => setSaved(false), 2000);
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
    <div className="panel-muted p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Plug className="w-5 h-5" />
        <h3 className="text-lg font-semibold">OpenClaw Connection</h3>
      </div>
      
      <p className="text-sm text-text-muted">
        Configure OpenClaw at server level for KanClaw (stored in ~/.kanclaw/config/openclaw.json).
      </p>

      {/* Status */}
      <div className="flex items-center gap-3 p-3 rounded border border-border bg-surface">
        {status === 'connected' ? (
          <>
            <Wifi className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-500">Connected</span>
          </>
        ) : status === 'disconnected' ? (
          <>
            <WifiOff className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-500">Disconnected</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="text-sm text-text-muted">Not tested</span>
          </>
        )}
        <button 
          onClick={handleTest}
          disabled={testing}
          className="ml-auto text-xs text-text-muted hover:text-text-primary"
        >
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test'}
        </button>
      </div>

      {/* HTTP URL */}
      <div className="space-y-2">
        <label className="text-sm text-text-secondary">HTTP Endpoint</label>
        <Input 
          value={httpUrl}
          onChange={(e) => setHttpUrl(e.target.value)}
          placeholder="http://127.0.0.1:18789"
          className="bg-surface border-border"
        />
      </div>

      {/* WebSocket URL */}
      <div className="space-y-2">
        <label className="text-sm text-text-secondary">WebSocket Endpoint</label>
        <Input 
          value={wsUrl}
          onChange={(e) => setWsUrl(e.target.value)}
          placeholder="ws://127.0.0.1:18789/events"
          className="bg-surface border-border"
        />
      </div>

      {/* Bearer Token */}
      <div className="space-y-2">
        <label className="text-sm text-text-secondary">Bearer Token (optional)</label>
        <div className="relative">
          <Input 
            type={showToken ? "text" : "password"}
            value={bearerToken}
            onChange={(e) => setBearerToken(e.target.value)}
            placeholder="Your bearer token"
            className="bg-surface border-border pr-10"
          />
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
          >
            {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Save Button */}
      <Button 
        onClick={handleSave} 
        disabled={loading}
        className="w-full"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        {saved ? 'Guardado. Recarga dashboard para ver estado.' : 'Guardar configuración'}
      </Button>
    </div>
  );
}
