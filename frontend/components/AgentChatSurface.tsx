'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileSearch, Loader2, Link2, Sparkles } from 'lucide-react';
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

interface ContextItem {
  id: string;
  kind: string;
  title: string;
  snippet?: string;
  path?: string;
  runId?: string;
  taskId?: string;
  threadId?: string;
}

function parseMetadata(value: unknown) {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return { raw: value };
    }
  }
  return value as Record<string, unknown>;
}

export function AgentChatSurface({ projectSlug, agents, initialThreads, openClawConnected, selectedThreadIdExternal, preferredTargetAgentExternal, onThreadChange }: { projectSlug: string; agents: Agent[]; initialThreads: ThreadShape[]; openClawConnected: boolean; selectedThreadIdExternal?: string; preferredTargetAgentExternal?: string; onThreadChange?: (threadId: string) => void }) {
  const [threads, setThreads] = useState(initialThreads);
  const [selectedThreadId, setSelectedThreadId] = useState(selectedThreadIdExternal || initialThreads[0]?.id || '');
  const [selectedMessageId, setSelectedMessageId] = useState(initialThreads[0]?.messages[initialThreads[0]?.messages.length - 1]?.id || '');
  const [content, setContent] = useState('');
  const [targetAgentName, setTargetAgentName] = useState(preferredTargetAgentExternal || initialThreads[0]?.agent?.name || agents[0]?.name || '');
  const [loading, setLoading] = useState(false);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextResults, setContextResults] = useState<ContextItem[]>([]);
  const [selectedContext, setSelectedContext] = useState<ContextItem[]>([]);

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

  useEffect(() => {
    setSelectedMessageId(initialThreads[0]?.messages[initialThreads[0]?.messages.length - 1]?.id || '');
  }, [selectedThreadId, initialThreads]);

  useEffect(() => {
    if (!selectedThreadId || !openClawConnected) {
      return;
    }

    const interval = window.setInterval(async () => {
      if (document.hidden) return;
      const response = await fetch(`/api/chat?projectSlug=${projectSlug}`);
      if (!response.ok) return;
      const refreshedThreads = await response.json();
      setThreads(refreshedThreads);
    }, 6000);

    return () => window.clearInterval(interval);
  }, [openClawConnected, projectSlug, selectedThreadId]);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setContextLoading(true);
      const params = new URLSearchParams({ projectSlug, query: content, targetAgentName });
      const response = await fetch(`/api/chat/search?${params.toString()}`, { signal: controller.signal });
      const data = await response.json().catch(() => ({ items: [] }));
      if (response.ok) {
        setContextResults(data.items || []);
      }
      setContextLoading(false);
    }, 260);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [content, projectSlug, targetAgentName]);

  const selectedThread = useMemo(() => threads.find((thread) => thread.id === selectedThreadId) || null, [selectedThreadId, threads]);
  const selectedMessage = useMemo(() => selectedThread?.messages.find((message) => message.id === selectedMessageId) || selectedThread?.messages[selectedThread.messages.length - 1] || null, [selectedMessageId, selectedThread]);
  const selectedMessageMetadata = parseMetadata(selectedMessage?.metadata);

  function toggleContextItem(item: ContextItem) {
    setSelectedContext((current) => (current.some((entry) => entry.id === item.id) ? current.filter((entry) => entry.id !== item.id) : [...current, item]));
  }

  async function handleSend() {
    if (!selectedThread || !content.trim()) return;
    setLoading(true);
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectSlug, threadId: selectedThread.id, targetAgentName, content, contextItems: selectedContext }),
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
    setSelectedContext([]);
    setSelectedMessageId(data.thread.messages[data.thread.messages.length - 1]?.id || '');
  }

  return (
    <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[300px_minmax(0,1fr)_320px]">
      <aside className="min-h-0 rounded-[1.8rem] border theme-surface-soft p-4">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Conversation fabric</p>
          <h3 className="mt-2 text-xl font-semibold theme-text-strong">Chat con agentes</h3>
        </div>
        <div className="space-y-2">
          {threads.map((thread) => (
            <button key={thread.id} type="button" onClick={() => { setSelectedThreadId(thread.id); setTargetAgentName(thread.agent?.name || agents[0]?.name || ''); setSelectedContext([]); onThreadChange?.(thread.id); }} className={`w-full rounded-[1.4rem] border px-4 py-3 text-left transition ${selectedThreadId === thread.id ? 'border-white/20 bg-white/[0.06]' : 'border-white/8 bg-surface2/70 hover:border-white/15'}`} data-testid={`chat-thread-item-${thread.id}`}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium theme-text-strong">{thread.title}</span>
                <span className="text-[10px] uppercase tracking-[0.24em] text-zinc-500">{thread.scope}</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-zinc-500">{thread.messages[thread.messages.length - 1]?.content.slice(0, 90) || 'Sin mensajes aún.'}</p>
            </button>
          ))}
        </div>
      </aside>

      <section className="grid min-h-0 grid-rows-[auto_1fr_auto] overflow-hidden rounded-[1.8rem] border theme-surface-soft backdrop-blur-[1px]">
        <div className="border-b border-white/6 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">{selectedThread?.scope === 'TEAM' ? 'Team room' : 'Direct channel'}</p>
              <h3 className="mt-2 text-xl font-semibold theme-text-strong">{selectedThread?.title || 'Selecciona un hilo'}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs ${openClawConnected ? 'border-white/15 text-white' : 'border-white/10 text-zinc-500'}`} data-testid="chat-openclaw-state">
                {openClawConnected ? 'OpenClaw online' : 'OpenClaw offline'}
              </span>
              <select value={targetAgentName} onChange={(event) => setTargetAgentName(event.target.value)} className="rounded-full border border-white/10 bg-surface px-4 py-2 text-sm text-text-primary" data-testid="chat-target-agent-select">
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
            <article key={message.id} onClick={() => setSelectedMessageId(message.id)} className={`max-w-[82%] cursor-pointer rounded-[1.5rem] border px-4 py-3 ${message.role === 'human' ? 'ml-auto border-white/12 bg-white text-black' : message.role === 'agent' ? 'border-white/10 bg-white/[0.04] text-white' : 'border-white/8 bg-black/40 text-zinc-300'} ${selectedMessage?.id === message.id ? 'ring-1 ring-white/30' : ''}`} data-testid={`chat-message-${message.id}`}>
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
          <div className="mt-3 rounded-[1.3rem] border theme-surface-soft p-3" data-testid="chat-context-panel">
            <div className="flex items-center justify-between gap-3 text-xs text-zinc-500">
              <span className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5" />Contexto automático del proyecto</span>
              {contextLoading ? <span>Cargando…</span> : <span>{contextResults.length} señales</span>}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {contextResults.slice(0, 6).map((item) => {
                const active = selectedContext.some((entry) => entry.id === item.id);
                return (
                  <button key={item.id} type="button" onClick={() => toggleContextItem(item)} className={`rounded-full border px-3 py-1.5 text-xs transition ${active ? 'border-white bg-white text-black' : 'border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-100'}`} data-testid={`chat-context-item-${item.id.replace(/[^a-zA-Z0-9]+/g, '-')}`}>
                    {item.title}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-zinc-500">Este chat está conectado al Project OS: runs, delegaciones y memoria quedan visibles.</p>
            <Button type="button" onClick={handleSend} disabled={!content.trim() || !selectedThread || loading || !targetAgentName} className="gap-2" data-testid="chat-send-button">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Enviar mensaje
            </Button>
          </div>
        </div>
      </section>

      <aside className="rounded-[1.8rem] border theme-surface-soft p-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-zinc-500"><FileSearch className="h-4 w-4" /> Chat intelligence</div>
        <div className="mt-4 rounded-[1.4rem] border theme-surface-soft p-4" data-testid="chat-selected-message-inspector">
          <p className="text-sm font-medium theme-text-strong">Mensaje seleccionado</p>
          {selectedMessage ? (
            <>
              <p className="mt-3 text-xs uppercase tracking-[0.24em] text-zinc-500">{selectedMessage.actor}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-zinc-300">{selectedMessage.content}</p>
            </>
          ) : <p className="mt-3 text-sm text-zinc-500">Selecciona un mensaje para ver sus vínculos.</p>}
        </div>

        <div className="mt-4 rounded-[1.4rem] border theme-surface-soft p-4" data-testid="chat-linked-resources-panel">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-zinc-500"><Link2 className="h-3.5 w-3.5" /> Contexto y provenance</div>
          <div className="mt-3 space-y-3">
            {Array.isArray(selectedMessageMetadata?.contextItems) && selectedMessageMetadata?.contextItems.length ? (selectedMessageMetadata.contextItems as ContextItem[]).slice(0, 6).map((item) => (
              <article key={item.id} className="rounded-[1.1rem] border border-white/7 bg-white/[0.03] p-3" data-testid={`linked-context-${item.id.replace(/[^a-zA-Z0-9]+/g, '-')}`}>
                <p className="text-sm theme-text-strong">{item.title}</p>
                <p className="mt-1 text-xs text-zinc-500">{item.kind}{item.path ? ` · ${item.path}` : ''}</p>
              </article>
            )) : <p className="text-sm text-zinc-500">Este mensaje todavía no tiene contexto vinculado.</p>}
            {Array.isArray(selectedMessageMetadata?.executedActions) && selectedMessageMetadata?.executedActions.length ? (selectedMessageMetadata.executedActions as Array<Record<string, unknown>>).map((item, index) => (
              <article key={`${index}-${String(item.label || item.kind || 'action')}`} className="rounded-[1.1rem] border border-white/7 bg-white/[0.03] p-3" data-testid={`linked-action-${index}`}>
                <p className="text-sm theme-text-strong">{String(item.label || item.kind || 'action')}</p>
                <p className="mt-1 text-xs text-zinc-500">{String(item.path || item.taskId || item.agentName || '')}</p>
              </article>
            )) : null}
            {selectedMessageMetadata?.runId ? <p className="text-xs text-zinc-500">Run vinculado: {String(selectedMessageMetadata.runId)}</p> : null}
          </div>
        </div>
      </aside>
    </div>
  );
}