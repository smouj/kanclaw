'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Agent } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ThreadShape {
  id: string;
  title: string;
  scope: string;
  agentId: string | null;
  messages: Array<{ id: string; role: string; actor: string; content: string; targetAgentName: string | null; metadata?: unknown; createdAt: string | Date }>;
  agent?: { name: string } | null;
}

export function AgentChatSurface({ projectSlug, agents, initialThreads, openClawConnected, selectedThreadIdExternal, preferredTargetAgentExternal, onThreadChange }: { projectSlug: string; agents: Agent[]; initialThreads: ThreadShape[]; openClawConnected: boolean; selectedThreadIdExternal?: string; preferredTargetAgentExternal?: string; onThreadChange?: (threadId: string) => void }) {
  const [threads, setThreads] = useState(initialThreads);
  const [selectedThreadId, setSelectedThreadId] = useState(selectedThreadIdExternal || initialThreads[0]?.id || '');
  const [content, setContent] = useState('');
  const [targetAgentName, setTargetAgentName] = useState(preferredTargetAgentExternal || initialThreads[0]?.agent?.name || agents[0]?.name || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setThreads(initialThreads);
  }, [initialThreads]);

  useEffect(() => {
    if (selectedThreadIdExternal) {
      setSelectedThreadId(selectedThreadIdExternal);
    }
  }, [selectedThreadIdExternal]);

  useEffect(() => {
    if (preferredTargetAgentExternal) {
      setTargetAgentName(preferredTargetAgentExternal);
    }
  }, [preferredTargetAgentExternal]);

  const selectedThread = useMemo(() => threads.find((thread) => thread.id === selectedThreadId) || null, [selectedThreadId, threads]);

  async function handleSend() {
    if (!selectedThread || !content.trim()) return;
    setLoading(true);
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectSlug, threadId: selectedThread.id, targetAgentName, content }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      toast.error(data.error || 'No se pudo enviar el mensaje.');
      const refresh = await fetch(`/api/chat?projectSlug=${projectSlug}`);
      const refreshedThreads = await refresh.json();
      setThreads(refreshedThreads);
      return;
    }
    setThreads((current) => current.map((thread) => (thread.id === data.thread.id ? data.thread : thread)));
    setContent('');
  }

  return (
    <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[320px_1fr]">
      <aside className="min-h-0 rounded-[1.8rem] border border-white/8 bg-white/[0.025] p-4">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Conversation fabric</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Chat con agentes</h3>
        </div>
        <div className="space-y-2">
          {threads.map((thread) => (
            <button key={thread.id} type="button" onClick={() => { setSelectedThreadId(thread.id); setTargetAgentName(thread.agent?.name || agents[0]?.name || ''); onThreadChange?.(thread.id); }} className={`w-full rounded-[1.4rem] border px-4 py-3 text-left transition ${selectedThreadId === thread.id ? 'border-white/20 bg-white/[0.06]' : 'border-white/8 bg-black/30 hover:border-white/15'}`} data-testid={`chat-thread-item-${thread.id}`}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-white">{thread.title}</span>
                <span className="text-[10px] uppercase tracking-[0.24em] text-zinc-500">{thread.scope}</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-zinc-500">{thread.messages[thread.messages.length - 1]?.content.slice(0, 90) || 'Sin mensajes aún.'}</p>
            </button>
          ))}
        </div>
      </aside>

      <section className="grid min-h-0 grid-rows-[auto_1fr_auto] overflow-hidden rounded-[1.8rem] border border-white/8 bg-white/[0.025]">
        <div className="border-b border-white/6 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">{selectedThread?.scope === 'TEAM' ? 'Team room' : 'Direct channel'}</p>
              <h3 className="mt-2 text-xl font-semibold text-white">{selectedThread?.title || 'Selecciona un hilo'}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs ${openClawConnected ? 'border-white/15 text-white' : 'border-white/10 text-zinc-500'}`} data-testid="chat-openclaw-state">
                {openClawConnected ? 'OpenClaw online' : 'OpenClaw offline'}
              </span>
              <select value={targetAgentName} onChange={(event) => setTargetAgentName(event.target.value)} className="rounded-full border border-white/10 bg-black px-4 py-2 text-sm text-zinc-200" data-testid="chat-target-agent-select">
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.name}>{agent.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="scrollbar-thin min-h-0 space-y-4 overflow-y-auto px-5 py-5" data-testid="chat-messages-panel">
          {!selectedThread?.messages.length ? <p className="text-sm text-zinc-500">Todavía no hay conversación en este canal.</p> : null}
          {selectedThread?.messages.map((message) => (
            <article key={message.id} className={`max-w-[82%] rounded-[1.5rem] border px-4 py-3 ${message.role === 'human' ? 'ml-auto border-white/12 bg-white text-black' : message.role === 'agent' ? 'border-white/10 bg-white/[0.04] text-white' : 'border-white/8 bg-black/40 text-zinc-300'}`} data-testid={`chat-message-${message.id}`}>
              <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.24em]">
                <span>{message.actor}</span>
                <span>{new Date(message.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{message.content}</p>
            </article>
          ))}
        </div>

        <div className="border-t border-white/6 px-5 py-4">
          <Textarea value={content} onChange={(event) => setContent(event.target.value)} rows={5} placeholder="Habla con tu equipo de agentes. En el Team Room puedes elegir el agente destinatario. Todo queda persistido y vinculado al proyecto." data-testid="chat-composer-textarea" />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-zinc-500">Este chat está conectado al Project OS: runs, delegaciones y memoria quedan visibles.</p>
            <Button type="button" onClick={handleSend} disabled={!content.trim() || !selectedThread || loading || !targetAgentName} className="gap-2" data-testid="chat-send-button">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Enviar mensaje
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}