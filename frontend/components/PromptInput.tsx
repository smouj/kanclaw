'use client';

import { useState } from 'react';
import type { Agent } from '@prisma/client';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface PromptInputProps {
  projectSlug: string;
  agents: Agent[];
  openClawConnected: boolean;
}

export function PromptInput({ projectSlug, agents, openClawConnected }: PromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const [agentName, setAgentName] = useState(agents[0]?.name || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    setError('');
    setLoading(true);
    const response = await fetch('/api/send-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectSlug, agentName, prompt }),
    });

    setLoading(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: 'No se pudo enviar la tarea.' }));
      setError(body.error || 'No se pudo enviar la tarea.');
      return;
    }

    setPrompt('');
    toast.success('Tarea enviada a OpenClaw.');
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted">Dispatch</p>
        <h2 className="text-2xl font-semibold">Enviar tarea</h2>
      </div>

      {!openClawConnected ? (
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200" data-testid="openclaw-disconnected-state">
          OpenClaw está desconectado. Revisa las variables OPENCLAW_HTTP, OPENCLAW_WS y el token Bearer antes de enviar tareas.
        </div>
      ) : null}

      {agents.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-black/10 p-4 text-sm text-zinc-500" data-testid="empty-agents-prompt-state">
          Este proyecto no tiene agentes disponibles.
        </div>
      ) : (
        <>
          <label className="space-y-2 text-sm text-zinc-300">
            <span>Agente</span>
            <select value={agentName} onChange={(event) => setAgentName(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3" data-testid="prompt-agent-select">
              {agents.map((agent) => (
                <option key={agent.id} value={agent.name}>{agent.name}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-1 flex-col gap-2 text-sm text-zinc-300">
            <span>Prompt</span>
            <Textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={12} placeholder="Describe el siguiente objetivo para el agente..." className="flex-1" data-testid="prompt-textarea" />
          </label>
        </>
      )}

      {error ? <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200" data-testid="prompt-inline-error">{error}</p> : null}

      <Button type="button" onClick={handleSend} disabled={!prompt.trim() || !agentName || loading || !openClawConnected} className="gap-2 self-start" data-testid="prompt-send-button">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Enviar a OpenClaw
      </Button>
    </div>
  );
}