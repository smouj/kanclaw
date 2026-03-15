'use client';

import { useState, useEffect } from 'react';
import { Settings, Cpu, Check, AlertCircle } from 'lucide-react';

interface ModelConfig {
  effective: {
    provider: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
  };
  defaults: any[];
  available: Array<{
    id: string;
    name: string;
    provider: string;
    emoji: string;
    free: boolean;
  }>;
}

interface SettingsPanelProps {
  projectSlug: string;
}

export function SettingsPanel({ projectSlug }: SettingsPanelProps) {
  const [config, setConfig] = useState<ModelConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/projects/${projectSlug}/settings`)
      .then(res => res.json())
      .then(data => {
        setConfig(data.modelConfig);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [projectSlug]);

  const handleSetDefault = async (modelId: string) => {
    setSaving(true);
    setMessage(null);
    
    try {
      const res = await fetch(`/api/projects/${projectSlug}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setDefault',
          provider: 'kilocode',
          model: modelId
        })
      });
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Modelo actualizado' });
        // Refresh
        const data = await res.json();
        setConfig(data.modelConfig || config);
      } else {
        setMessage({ type: 'error', text: 'Error al actualizar' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión' });
    }
    
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5" />
        <h2 className="text-lg font-semibold">Configuración del Proyecto</h2>
      </div>

      {/* Modelo Actual */}
      <div className="bg-card rounded-lg p-4 border">
        <h3 className="font-medium mb-2 flex items-center gap-2">
          <Cpu className="w-4 h-4" />
          Modelo Actual
        </h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="px-2 py-1 bg-primary/10 rounded">
            {config?.effective.model || 'minimax-m2.5:free'}
          </span>
          {config?.effective.temperature && (
            <span className="text-muted-foreground">
              temp: {config.effective.temperature}
            </span>
          )}
        </div>
      </div>

      {/* Modelos Disponibles */}
      <div className="bg-card rounded-lg p-4 border">
        <h3 className="font-medium mb-3">Modelos Disponibles</h3>
        <div className="space-y-2">
          {config?.available.map((model) => (
            <button
              key={model.id}
              onClick={() => handleSetDefault(model.id)}
              disabled={saving || model.id === config.effective.model}
              className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <div className="flex items-center gap-2">
                <span>{model.emoji}</span>
                <span className="font-medium">{model.name}</span>
                {model.free && (
                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">FREE</span>
                )}
              </div>
              {model.id === config.effective.model && (
                <Check className="w-4 h-4 text-green-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Mensaje */}
      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.type === 'error' && <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}
    </div>
  );
}
