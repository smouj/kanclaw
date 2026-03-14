'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Check, Copy, CornerDownLeft, Loader2, MessageSquare, Quote, Send, Sparkles, Type, X, Zap } from 'lucide-react';
import { toast } from 'sonner';
import type { Agent } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/components/LanguageProvider';

interface ThreadShape {
  id: string;
  title: string;
  scope: string;
  agentId: string | null;
  messages: Array<{
    id: string;
    role: string;
    actor: string;
    content: string;
    targetAgentName: string | null;
    metadata?: unknown;
    createdAt: string | Date;
  }>;
  agent?: { name: string } | null;
}

interface ContextItem {
  id: string;
  kind: string;
  title: string;
  snippet?: string;
  path?: string;
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

function formatTime(date: string | Date) {
  return new Date(date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function formatDay(date: string | Date) {
  return new Date(date).toLocaleDateString('es-ES');
}

function CopyButton({ text }: { text: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t('chat.copyError'));
    }
  };

  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 rounded border border-border bg-surface2 px-2 py-1 text-xs text-text-muted hover:text-text-primary"
      type="button"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? t('chat.copied') : t('chat.copy')}
    </button>
  );
}

function renderMarkdown(content: string, t: (key: string, fallback?: string) => string) {
  const lines = content.split('\n');
  const nodes: React.ReactNode[] = [];
  let inCode = false;
  let codeLang = '';
  let code = '';

  const flushCode = () => {
    if (!code) return;
    nodes.push(
      <div key={`code-${nodes.length}`} className="my-3 overflow-hidden rounded border border-border bg-surface2">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-xs text-text-muted">{codeLang || t('chat.code')}</span>
          <CopyButton text={code} />
        </div>
        <pre className="overflow-x-auto p-3 text-xs leading-6 text-text-primary">
          <code>{code}</code>
        </pre>
      </div>
    );
    code = '';
    codeLang = '';
  };

  lines.forEach((line, i) => {
    if (line.startsWith('```')) {
      if (inCode) {
        flushCode();
        inCode = false;
      } else {
        inCode = true;
        codeLang = line.replace('```', '').trim();
      }
      return;
    }

    if (inCode) {
      code += (code ? '\n' : '') + line;
      return;
    }

    const imageMatch = line.match(/!\[(.*?)\]\((https?:\/\/[^\s)]+)\)/);
    if (imageMatch) {
      nodes.push(
        <figure key={`img-${i}`} className="my-3 overflow-hidden rounded border border-border bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageMatch[2]} alt={imageMatch[1] || 'image'} className="max-h-80 w-full object-contain" />
          {imageMatch[1] ? <figcaption className="px-3 py-2 text-xs text-text-muted">{imageMatch[1]}</figcaption> : null}
        </figure>
      );
      return;
    }

    if (line.startsWith('### ')) {
      nodes.push(<h3 key={`h3-${i}`} className="mt-3 mb-1 text-base font-semibold text-text-primary">{line.slice(4)}</h3>);
      return;
    }
    if (line.startsWith('## ')) {
      nodes.push(<h2 key={`h2-${i}`} className="mt-3 mb-1 text-lg font-semibold text-text-primary">{line.slice(3)}</h2>);
      return;
    }
    if (line.startsWith('# ')) {
      nodes.push(<h1 key={`h1-${i}`} className="mt-3 mb-1 text-xl font-bold text-text-primary">{line.slice(2)}</h1>);
      return;
    }

    if (line.trim() === '') {
      nodes.push(<div key={`sp-${i}`} className="h-2" />);
      return;
    }

    if (line.startsWith('> ')) {
      nodes.push(<blockquote key={`q-${i}`} className="my-2 border-l-2 border-border pl-3 text-sm italic text-text-secondary">{line.slice(2)}</blockquote>);
      return;
    }

    const inline = line.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, idx) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={idx} className="rounded border border-border bg-surface2 px-1.5 py-0.5 text-xs text-amber-400">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    nodes.push(
      <p key={`p-${i}`} className="text-sm leading-relaxed text-text-primary">
        {inline}
      </p>
    );
  });

  if (inCode) flushCode();
  return nodes;
}

function MarkdownToolbar({ onInsert }: { onInsert: (syntax: string, wrap?: boolean) => void }) {
  return (
    <div className="flex items-center gap-1 border-b border-border px-3 py-2">
      <button type="button" className="rounded p-1.5 text-text-muted hover:bg-surface2 hover:text-text-primary" onClick={() => onInsert('**', true)} title="Bold">
        <span className="text-xs font-bold">B</span>
      </button>
      <button type="button" className="rounded p-1.5 text-text-muted hover:bg-surface2 hover:text-text-primary" onClick={() => onInsert('`', true)} title="Code inline">
        <Type className="h-4 w-4" />
      </button>
      <button type="button" className="rounded p-1.5 text-text-muted hover:bg-surface2 hover:text-text-primary" onClick={() => onInsert('```', true)} title="Code block">
        <CornerDownLeft className="h-4 w-4" />
      </button>
      <button type="button" className="rounded p-1.5 text-text-muted hover:bg-surface2 hover:text-text-primary" onClick={() => onInsert('\n> ')} title="Quote">
        <Quote className="h-4 w-4" />
      </button>
    </div>
  );
}

export function AgentChatSurface({
  projectSlug,
  agents,
  initialThreads,
  openClawConnected,
  selectedThreadIdExternal,
  preferredTargetAgentExternal,
  onThreadChange,
}: {
  projectSlug: string;
  agents: Agent[];
  initialThreads: ThreadShape[];
  openClawConnected: boolean;
  selectedThreadIdExternal?: string;
  preferredTargetAgentExternal?: string;
  onThreadChange?: (threadId: string) => void;
}) {
  const { t } = useI18n();
  const [threads, setThreads] = useState(initialThreads);
  const [selectedThreadId, setSelectedThreadId] = useState(selectedThreadIdExternal || initialThreads[0]?.id || '');
  const [selectedMessageId, setSelectedMessageId] = useState('');
  const [content, setContent] = useState('');
  const [targetAgentName, setTargetAgentName] = useState(
    preferredTargetAgentExternal || initialThreads[0]?.agent?.name || agents[0]?.name || ''
  );
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextResults, setContextResults] = useState<ContextItem[]>([]);
  const [selectedContext, setSelectedContext] = useState<ContextItem[]>([]);
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setThreads(initialThreads), [initialThreads]);
  useEffect(() => { if (selectedThreadIdExternal) setSelectedThreadId(selectedThreadIdExternal); }, [selectedThreadIdExternal]);
  useEffect(() => { if (preferredTargetAgentExternal) setTargetAgentName(preferredTargetAgentExternal); }, [preferredTargetAgentExternal]);

  const selectedThread = useMemo(() => threads.find((t) => t.id === selectedThreadId) || null, [threads, selectedThreadId]);

  useEffect(() => {
    if (!selectedThread) return;
    const last = selectedThread.messages[selectedThread.messages.length - 1];
    if (last) setSelectedMessageId(last.id);
  }, [selectedThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedThread?.messages.length, thinking]);

  useEffect(() => {
    if (!selectedThreadId || !openClawConnected) return;
    const interval = window.setInterval(async () => {
      if (document.hidden) return;
      const response = await fetch(`/api/chat?projectSlug=${projectSlug}`);
      if (!response.ok) return;
      const refreshed = await response.json();
      setThreads(refreshed);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [selectedThreadId, openClawConnected, projectSlug]);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (!content.trim()) {
        setContextResults([]);
        return;
      }
      setContextLoading(true);
      const response = await fetch(
        `/api/chat/search?projectSlug=${projectSlug}&query=${encodeURIComponent(content)}&targetAgentName=${encodeURIComponent(targetAgentName)}`
      );
      const data = await response.json().catch(() => ({ items: [] }));
      if (response.ok) setContextResults(data.items || []);
      setContextLoading(false);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [content, projectSlug, targetAgentName]);

  const groupedMessages = useMemo(() => {
    if (!selectedThread) return [] as Array<{ day: string; messages: ThreadShape['messages'] }>;
    const groups: Array<{ day: string; messages: ThreadShape['messages'] }> = [];
    let currentDay = '';
    selectedThread.messages.forEach((msg) => {
      const day = formatDay(msg.createdAt);
      if (day !== currentDay) {
        currentDay = day;
        groups.push({ day, messages: [] });
      }
      groups[groups.length - 1].messages.push(msg);
    });
    return groups;
  }, [selectedThread]);

  const stats = useMemo(() => {
    if (!selectedThread) return { total: 0, human: 0, agent: 0 };
    const total = selectedThread.messages.length;
    const human = selectedThread.messages.filter((m) => m.role === 'human').length;
    const agent = selectedThread.messages.filter((m) => m.role !== 'human').length;
    return { total, human, agent };
  }, [selectedThread]);

  const selectedMessage = useMemo(() => {
    if (!selectedThread) return null;
    return selectedThread.messages.find((m) => m.id === selectedMessageId) || null;
  }, [selectedThread, selectedMessageId]);

  const selectedMessageMetadata = parseMetadata(selectedMessage?.metadata);

  const insertMarkdown = (syntax: string, wrap = false) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end);

    let next = content;
    if (syntax === '```') {
      const block = '\n```text\n\n```\n';
      next = content.slice(0, start) + block + content.slice(end);
      setContent(next);
      requestAnimationFrame(() => {
        textarea.focus();
        const cursor = start + '\n```text\n'.length;
        textarea.setSelectionRange(cursor, cursor);
      });
      return;
    }

    if (wrap) {
      next = content.slice(0, start) + syntax + selected + syntax + content.slice(end);
      setContent(next);
      requestAnimationFrame(() => {
        const pos = selected ? end + syntax.length * 2 : start + syntax.length;
        textarea.focus();
        textarea.setSelectionRange(pos, pos);
      });
      return;
    }

    next = content.slice(0, start) + syntax + content.slice(end);
    setContent(next);
  };

  const toggleContext = (item: ContextItem) => {
    setSelectedContext((prev) =>
      prev.some((entry) => entry.id === item.id)
        ? prev.filter((entry) => entry.id !== item.id)
        : [...prev, item]
    );
  };

  const handleSend = async () => {
    if (!selectedThread || !content.trim()) return;
    setLoading(true);
    setThinking(true);

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectSlug,
        threadId: selectedThread.id,
        targetAgentName,
        content,
        contextItems: selectedContext,
      }),
    });

    const data = await response.json().catch(() => ({}));
    setLoading(false);
    setThinking(false);

    if (!response.ok) {
      toast.error((data as any).error || t('chat.sendError'));
      return;
    }

    setThreads((prev) => prev.map((t) => (t.id === (data as any).thread.id ? (data as any).thread : t)));
    setContent('');
    setSelectedContext([]);
  };

  return (
    <div className="flex h-full min-h-0 bg-surface text-text-primary">
      {/* Left threads */}
      <aside className="w-72 flex-shrink-0 border-r border-border bg-surface2/60">
        <div className="border-b border-border p-4">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${openClawConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-xs text-text-muted">{openClawConnected ? t('chat.connected') : t('chat.disconnected')}</span>
          </div>
          <h3 className="mt-3 text-sm font-medium text-text-primary">{t('chat.conversations')}</h3>
        </div>
        <div className="h-[calc(100%-80px)] overflow-y-auto p-2">
          {threads.map((thread) => {
            const active = selectedThreadId === thread.id;
            const lastText = thread.messages[thread.messages.length - 1]?.content || '';
            return (
              <button
                key={thread.id}
                onClick={() => {
                  setSelectedThreadId(thread.id);
                  setTargetAgentName(thread.agent?.name || agents[0]?.name || '');
                  setSelectedContext([]);
                  onThreadChange?.(thread.id);
                }}
                className={`mb-2 w-full border px-3 py-3 text-left transition-all ${
                  active ? 'border-border bg-surface' : 'border-transparent hover:border-border hover:bg-surface'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{thread.title}</span>
                  <span className="text-[10px] uppercase tracking-wider text-text-muted">{thread.scope}</span>
                </div>
                <p className="mt-1 line-clamp-1 text-xs text-text-muted">{lastText || t('chat.noMessagesShort')}</p>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main */}
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface/70 px-5 py-3">
          <div>
            <h3 className="text-base font-semibold">{selectedThread?.title || t('chat.selectThread')}</h3>
            <p className="text-xs text-text-muted">
              {selectedThread?.messages.length || 0} {t('chat.messages')} · {selectedThread?.scope === 'TEAM' ? t('chat.teamRoom') : t('chat.agentRoom')}
            </p>
          </div>

          {selectedThread?.scope === 'TEAM' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAgentSelector((prev) => !prev)}
                className="flex items-center gap-2 border border-border bg-surface2 px-3 py-2 text-sm text-text-primary hover:bg-surface"
              >
                <Bot className="h-4 w-4" />
                {targetAgentName}
                <Sparkles className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 border border-border bg-surface2 px-3 py-1.5 text-xs text-text-muted">
              <Bot className="h-3.5 w-3.5" />
              {targetAgentName}
            </div>
          )}
        </header>

        {showAgentSelector && selectedThread?.scope === 'TEAM' && (
          <div className="border-b border-border bg-surface2/60 px-5 py-3">
            <p className="mb-2 text-xs text-text-muted">{t('chat.selectAgent')}</p>
            <div className="flex flex-wrap gap-2">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => {
                    setTargetAgentName(agent.name);
                    setShowAgentSelector(false);
                  }}
                  className={`border px-3 py-1.5 text-sm transition-colors ${
                    targetAgentName === agent.name
                      ? 'border-text-primary bg-text-primary text-background'
                      : 'border-border bg-surface text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {agent.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!selectedThread?.messages.length ? (
            <div className="flex h-full flex-col items-center justify-center text-text-muted">
              <MessageSquare className="mb-4 h-10 w-10 opacity-40" />
              <p className="text-base">{t('chat.noMessages')}</p>
              <p className="mt-1 text-sm">{t('chat.startConversation')}</p>
            </div>
          ) : (
            <div className="space-y-5">
              {groupedMessages.map((group) => (
                <div key={group.day}>
                  <div className="mb-3 flex justify-center">
                    <span className="border border-border bg-surface2 px-3 py-1 text-[11px] text-text-muted">{group.day}</span>
                  </div>
                  <div className="space-y-2">
                    {group.messages.map((message) => {
                      const isHuman = message.role === 'human';
                      const isSystem = message.role === 'system';
                      const selected = selectedMessageId === message.id;
                      return (
                        <div key={message.id} className={`flex ${isHuman ? 'justify-end' : 'justify-start'}`}>
                          <button
                            type="button"
                            onClick={() => setSelectedMessageId(message.id)}
                            className={`max-w-[78%] border px-4 py-3 text-left transition-all ${
                              isSystem
                                ? 'border-amber-500/40 bg-amber-500/10 text-amber-100'
                                : isHuman
                                ? 'border-border bg-surface2 text-text-primary'
                                : 'border-border bg-surface text-text-primary'
                            } ${selected ? 'ring-2 ring-white/20' : 'hover:border-white/20 hover:-translate-y-0.5'} `}
                          >
                            <div className="mb-1 flex items-center justify-between gap-3 text-[10px] uppercase tracking-wider text-text-muted">
                              <span>{isHuman ? t('chat.you') : message.actor}</span>
                              <span>{formatTime(message.createdAt)}</span>
                            </div>
                            <div className="space-y-1 text-sm leading-relaxed">{renderMarkdown(message.content, t)}</div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {thinking && (
                <div className="flex items-center gap-3 border border-border bg-surface2 px-4 py-3 text-text-muted">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs">{t('chat.thinking')}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <footer className="border-t border-border bg-surface/70">
          {contextResults.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2">
              <Sparkles className="h-4 w-4 text-text-muted" />
              <span className="text-xs text-text-muted">{t('chat.context')}</span>
              {contextResults.slice(0, 4).map((item) => {
                const active = selectedContext.some((ctx) => ctx.id === item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleContext(item)}
                    className={`flex items-center gap-1 border px-2 py-1 text-xs ${
                      active
                        ? 'border-text-primary bg-text-primary text-background'
                        : 'border-border bg-surface2 text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {item.title}
                    {active && <X className="h-3 w-3" />}
                  </button>
                );
              })}
              {contextLoading ? <Loader2 className="h-3 w-3 animate-spin text-text-muted" /> : null}
            </div>
          )}

          <MarkdownToolbar onInsert={insertMarkdown} />

          <div className="flex gap-3 px-4 py-4">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              rows={4}
              placeholder={t('chat.writePrompt')}
              className="min-h-[110px] resize-none border-border bg-surface2 text-text-primary placeholder:text-text-muted"
            />
            <Button
              type="button"
              onClick={handleSend}
              disabled={!content.trim() || !selectedThread || loading}
              className="gap-2 self-end border border-border bg-text-primary px-5 text-background hover:bg-white"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {t('chat.send')}
            </Button>
          </div>
        </footer>
      </section>

      <aside className="w-60 flex-shrink-0 border-l border-border bg-surface2/50">
        <div className="border-b border-border p-4">
          <h3 className="text-sm font-medium">{t('chat.stats')}</h3>
        </div>
        <div className="space-y-3 p-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="border border-border bg-surface p-3 text-center">
              <p className="text-lg font-semibold">{stats.total}</p>
              <p className="text-[10px] text-text-muted">{t('chat.total')}</p>
            </div>
            <div className="border border-border bg-surface p-3 text-center">
              <p className="text-lg font-semibold">{stats.human}</p>
              <p className="text-[10px] text-text-muted">{t('chat.human')}</p>
            </div>
          </div>
          <div className="border border-border bg-surface p-3 text-center">
            <p className="text-lg font-semibold text-emerald-400">{stats.agent}</p>
            <p className="text-[10px] text-text-muted">{t('chat.agent')}</p>
          </div>

          {selectedMessage ? (
            <div className="border border-border bg-surface p-3 text-xs text-text-muted">
              <p className="text-[11px] font-semibold text-text-primary">{t('chat.selectedMessage')}</p>
              <p className="mt-1">{selectedMessage.role === 'human' ? t('chat.you') : selectedMessage.actor}</p>
              <p>{new Date(selectedMessage.createdAt).toLocaleString('es-ES')}</p>
              {selectedMessageMetadata && 'runId' in selectedMessageMetadata ? (
                <p className="mt-2 break-all">Run: {String((selectedMessageMetadata as any).runId)}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
