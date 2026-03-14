'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  Check,
  Copy,
  CornerDownLeft,
  FileImage,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  Link2,
  Loader2,
  MessageSquare,
  MoreVertical,
  Quote,
  RefreshCcw,
  Send,
  Sparkles,
  Strikethrough,
  Table,
  Trash2,
  Type,
  X,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Agent } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

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

function formatRelativeTime(date: string | Date) {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'ahora';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}

function formatTime(date: string | Date) {
  return new Date(date).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Simple markdown parser
function parseMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeContent = '';
  let codeLanguage = '';
  let currentList: string[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="my-2 space-y-1 pl-6 list-disc">
          {currentList.map((item, i) => (
            <li key={i} className="text-sm text-zinc-200">{item}</li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <div key={`code-${elements.length}`} className="my-3 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-700 px-3 py-2">
              <span className="text-xs text-zinc-500">{codeLanguage || 'code'}</span>
              <CopyButton text={codeContent} />
            </div>
            <pre className="overflow-x-auto p-4">
              <code className="text-sm font-mono text-zinc-300">{codeContent}</code>
            </pre>
          </div>
        );
        codeContent = '';
        codeLanguage = '';
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
        codeLanguage = line.slice(3).trim() || '';
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent += (codeContent ? '\n' : '') + line;
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      flushList();
      elements.push(<h3 key={`h3-${i}`} className="mt-4 mb-2 text-lg font-semibold text-zinc-100">{line.slice(4)}</h3>);
      continue;
    }
    if (line.startsWith('## ')) {
      flushList();
      elements.push(<h2 key={`h2-${i}`} className="mt-5 mb-2 text-xl font-bold text-zinc-100">{line.slice(3)}</h2>);
      continue;
    }
    if (line.startsWith('# ')) {
      flushList();
      elements.push(<h1 key={`h1-${i}`} className="mt-5 mb-2 text-2xl font-bold text-zinc-100">{line.slice(2)}</h1>);
      continue;
    }

    // Code inline
    if (line.includes('`')) {
      const parts = line.split(/(`[^`]+`)/);
      elements.push(
        <p key={`p-${i}`} className="my-1 text-sm leading-relaxed text-zinc-200">
          {parts.map((part, j) => {
            if (part.startsWith('`') && part.endsWith('`')) {
              return (
                <code key={j} className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-amber-300">
                  {part.slice(1, -1)}
                </code>
              );
            }
            // Bold
            const boldParts = part.split(/(\*\*[^*]+\*\*)/);
            return boldParts.map((bp, k) => {
              if (bp.startsWith('**') && bp.endsWith('**')) {
                return <strong key={k} className="font-bold text-zinc-100">{bp.slice(2, -2)}</strong>;
              }
              return bp;
            });
          })}
        </p>
      );
      continue;
    }

    // List items
    if (line.match(/^[-*]\s/)) {
      currentList.push(line.slice(2));
      continue;
    }
    if (line.match(/^\d+\.\s/)) {
      currentList.push(line.replace(/^\d+\.\s/, ''));
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      flushList();
      elements.push(
        <blockquote key={`bq-${i}`} className="my-2 border-l-2 border-zinc-600 pl-4 italic text-zinc-400">
          {line.slice(2)}
        </blockquote>
      );
      continue;
    }

    // Horizontal rule
    if (line.match(/^[-*_]{3,}$/)) {
      flushList();
      elements.push(<hr key={`hr-${i}`} className="my-4 border-zinc-700" />);
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      flushList();
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(<p key={`p-${i}`} className="my-1 text-sm leading-relaxed text-zinc-200">{line}</p>);
  }

  flushList();
  return elements;
}

// Copy button component
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// Message bubble component
function MessageBubble({
  message,
  isSelected,
  onClick,
}: {
  message: ThreadShape['messages'][0];
  isSelected: boolean;
  onClick: () => void;
}) {
  const isHuman = message.role === 'human';
  const isSystem = message.role === 'system';

  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer transition-all ${
        isHuman ? 'justify-end' : 'justify-start'
      } flex`}
    >
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isHuman
            ? 'bg-gradient-to-br from-zinc-100 to-zinc-200 text-zinc-900'
            : isSystem
            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-200'
            : 'bg-gradient-to-br from-zinc-800 to-zinc-850 border border-zinc-700/50 text-zinc-100'
        } ${
          isSelected ? 'ring-2 ring-white/30' : ''
        } hover:shadow-lg`}
      >
        <div className="mb-1 flex items-center justify-between gap-4 text-[10px] uppercase tracking-wider opacity-60">
          <span className="font-medium">
            {isHuman ? 'Tú' : message.actor}
          </span>
          <span>{formatTime(message.createdAt)}</span>
        </div>
        <div className="text-sm leading-relaxed">
          {parseMarkdown(message.content)}
        </div>
      </div>
    </div>
  );
}

// Agent button selector
function AgentSelector({
  agents,
  selected,
  onChange,
}: {
  agents: Agent[];
  selected: string;
  onChange: (name: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {agents.map((agent) => (
        <button
          key={agent.id}
          onClick={() => onChange(agent.name)}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
            selected === agent.name
              ? 'bg-white text-zinc-900 shadow-lg shadow-white/20'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
          }`}
        >
          <Bot className="h-4 w-4" />
          {agent.name}
        </button>
      ))}
    </div>
  );
}

// Markdown toolbar
function MarkdownToolbar({ onInsert }: { onInsert: (syntax: string, wrap?: boolean) => void }) {
  return (
    <div className="flex items-center gap-1 border-t border-zinc-700 px-3 py-2">
      <button
        type="button"
        onClick={() => onInsert('**', true)}
        className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
        title="Bold"
      >
        <span className="font-bold text-xs">B</span>
      </button>
      <button
        type="button"
        onClick={() => onInsert('*', true)}
        className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
        title="Italic"
      >
        <span className="italic text-xs">I</span>
      </button>
      <button
        type="button"
        onClick={() => onInsert('`', true)}
        className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
        title="Code"
      >
        <Type className="h-4 w-4" />
      </button>
      <div className="mx-1 h-4 w-px bg-zinc-700" />
      <button
        type="button"
        onClick={() => onInsert('```', true)}
        className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
        title="Code Block"
      >
        <CornerDownLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onInsert('\n- ')}
        className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
        title="List"
      >
        <Link2 className="h-4 w-4 rotate-90" />
      </button>
      <button
        type="button"
        onClick={() => onInsert('\n> ')}
        className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
        title="Quote"
      >
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
  const [threads, setThreads] = useState(initialThreads);
  const [selectedThreadId, setSelectedThreadId] = useState(
    selectedThreadIdExternal || initialThreads[0]?.id || ''
  );
  const [selectedMessageId, setSelectedMessageId] = useState('');
  const [content, setContent] = useState('');
  const [targetAgentName, setTargetAgentName] = useState(
    preferredTargetAgentExternal ||
      initialThreads[0]?.agent?.name ||
      agents[0]?.name ||
      ''
  );
  const [loading, setLoading] = useState(false);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextResults, setContextResults] = useState<ContextItem[]>([]);
  const [selectedContext, setSelectedContext] = useState<ContextItem[]>([]);
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setThreads(initialThreads);
  }, [initialThreads]);

  useEffect(() => {
    if (selectedThreadIdExternal) setSelectedThreadId(selectedThreadIdExternal);
  }, [selectedThreadIdExternal]);

  useEffect(() => {
    if (preferredTargetAgentExternal) setTargetAgentName(preferredTargetAgentExternal);
  }, [preferredTargetAgentExternal]);

  useEffect(() => {
    const thread = threads.find((t) => t.id === selectedThreadId);
    if (thread?.messages.length) {
      setSelectedMessageId(thread.messages[thread.messages.length - 1].id);
    }
  }, [selectedThreadId, threads]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threads, selectedThreadId]);

  useEffect(() => {
    if (!selectedThreadId || !openClawConnected) return;
    const interval = setInterval(async () => {
      if (document.hidden) return;
      const res = await fetch(`/api/chat?projectSlug=${projectSlug}`);
      if (res.ok) {
        const data = await res.json();
        setThreads(data);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [openClawConnected, projectSlug, selectedThreadId]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!content.trim()) return;
      setContextLoading(true);
      const res = await fetch(
        `/api/chat/search?projectSlug=${projectSlug}&query=${encodeURIComponent(content)}&targetAgentName=${encodeURIComponent(targetAgentName)}`
      );
      const data = await res.json().catch(() => ({ items: [] }));
      if (res.ok) setContextResults(data.items || []);
      setContextLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [content, projectSlug, targetAgentName]);

  const selectedThread = useMemo(
    () => threads.find((t) => t.id === selectedThreadId) || null,
    [selectedThreadId, threads]
  );

  const selectedMessage = useMemo(() => {
    if (!selectedThread) return null;
    return (
      selectedThread.messages.find((m) => m.id === selectedMessageId) ||
      selectedThread.messages[selectedThread.messages.length - 1] ||
      null
    );
  }, [selectedThread, selectedMessageId]);

  const selectedMessageMetadata = parseMetadata(selectedMessage?.metadata);

  const groupedMessages = useMemo(() => {
    if (!selectedThread) return [];
    const groups: { date: string; messages: typeof selectedThread.messages }[] = [];
    let currentDate = '';

    for (const msg of selectedThread.messages) {
      const msgDate = new Date(msg.createdAt).toLocaleDateString('es-ES');
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: currentDate, messages: [] });
      }
      groups[groups.length - 1].messages.push(msg);
    }
    return groups;
  }, [selectedThread]);

  const stats = useMemo(() => {
    if (!selectedThread) return { total: 0, human: 0, agent: 0 };
    const msgs = selectedThread.messages;
    return {
      total: msgs.length,
      human: msgs.filter((m) => m.role === 'human').length,
      agent: msgs.filter((m) => m.role === 'agent').length,
    };
  }, [selectedThread]);

  function toggleContext(item: ContextItem) {
    setSelectedContext((prev) =>
      prev.some((e) => e.id === item.id)
        ? prev.filter((e) => e.id !== item.id)
        : [...prev, item]
    );
  }

  function insertMarkdown(syntax: string, wrap?: boolean) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    let newText: string;
    let newCursorPos: number;

    if (wrap && selectedText) {
      newText = content.substring(0, start) + syntax + selectedText + syntax + content.substring(end);
      newCursorPos = end + syntax.length * 2;
    } else if (wrap) {
      newText = content.substring(0, start) + syntax + syntax + content.substring(end);
      newCursorPos = start + syntax.length;
    } else {
      newText = content.substring(0, start) + syntax + content.substring(end);
      newCursorPos = start + syntax.length;
    }

    setContent(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }

  async function handleSend() {
    if (!selectedThread || !content.trim()) return;
    setLoading(true);
    const res = await fetch('/api/chat', {
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
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error || 'Error al enviar');
      const refresh = await fetch(`/api/chat?projectSlug=${projectSlug}`);
      if (refresh.ok) setThreads(await refresh.json());
      return;
    }
    setThreads((prev) =>
      prev.map((t) => (t.id === data.thread.id ? data.thread : t))
    );
    setContent('');
    setSelectedContext([]);
  }

  return (
    <div className="flex h-full w-full bg-zinc-950">
      {/* Left - Thread List */}
      <div className="w-64 flex-shrink-0 border-r border-zinc-800 bg-zinc-900/50">
        <div className="border-b border-zinc-800 p-4">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                openClawConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="text-xs text-zinc-400">
              {openClawConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          <h3 className="mt-3 text-sm font-medium text-zinc-200">Conversaciones</h3>
        </div>
        <div className="overflow-y-auto p-2">
          {threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => {
                setSelectedThreadId(thread.id);
                setTargetAgentName(thread.agent?.name || agents[0]?.name || '');
                setSelectedContext([]);
                onThreadChange?.(thread.id);
              }}
              className={`mb-1 w-full rounded-xl p-3 text-left transition ${
                selectedThreadId === thread.id
                  ? 'bg-white/10 border border-white/20'
                  : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-200 truncate">
                  {thread.title}
                </span>
                <span className="text-[10px] text-zinc-600">{thread.scope}</span>
              </div>
              <p className="mt-1 line-clamp-1 text-xs text-zinc-500">
                {thread.messages[thread.messages.length - 1]?.content.slice(0, 40) ||
                  'Sin mensajes'}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Center - Messages */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/30 px-6 py-3">
          <div>
            <h3 className="text-base font-semibold text-zinc-100">
              {selectedThread?.title || 'Selecciona un hilo'}
            </h3>
            <p className="text-xs text-zinc-500">
              {selectedThread?.messages.length || 0} mensajes ·{' '}
              {selectedThread?.scope === 'TEAM' ? 'Sala grupal' : 'Canal directo'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAgentSelector(!showAgentSelector)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                showAgentSelector
                  ? 'bg-white text-zinc-900'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              <Bot className="h-4 w-4" />
              {targetAgentName}
              <Sparkles className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Agent Selector Dropdown */}
        {showAgentSelector && (
          <div className="border-b border-zinc-800 bg-zinc-900/80 px-6 py-4">
            <p className="mb-3 text-xs text-zinc-500">Selecciona un agente:</p>
            <AgentSelector
              agents={agents}
              selected={targetAgentName}
              onChange={(name) => {
                setTargetAgentName(name);
                setShowAgentSelector(false);
              }}
            />
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!selectedThread?.messages.length ? (
            <div className="flex h-full flex-col items-center justify-center text-zinc-500">
              <MessageSquare className="mb-4 h-12 w-12 opacity-30" />
              <p className="text-lg font-medium">Sin conversación aún</p>
              <p className="mt-1 text-sm">
                Envía un mensaje para empezar
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedMessages.map((group) => (
                <div key={group.date}>
                  <div className="mb-3 flex justify-center">
                    <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-500">
                      {group.date}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {group.messages.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        isSelected={selectedMessageId === msg.id}
                        onClick={() => setSelectedMessageId(msg.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-zinc-800 bg-zinc-900/50">
          {/* Context chips */}
          {contextResults.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 px-6 py-2">
              <Sparkles className="h-4 w-4 text-zinc-500" />
              <span className="text-xs text-zinc-500">Contexto:</span>
              {contextResults.slice(0, 4).map((item) => {
                const active = selectedContext.some((e) => e.id === item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleContext(item)}
                    className={`flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition ${
                      active
                        ? 'border-white bg-white text-zinc-900'
                        : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                    }`}
                  >
                    {item.title}
                    {active && <X className="h-3 w-3" />}
                  </button>
                );
              })}
              {contextLoading && (
                <Loader2 className="h-3 w-3 animate-spin text-zinc-500" />
              )}
            </div>
          )}

          {/* Markdown Toolbar */}
          <MarkdownToolbar onInsert={insertMarkdown} />

          {/* Input */}
          <div className="flex gap-3 px-6 py-4">
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={4}
                placeholder="Escribe tu mensaje... (Shift+Enter para nueva línea)"
                className="min-h-[100px] resize-none rounded-xl bg-zinc-900 border-zinc-700 text-zinc-200 placeholder-zinc-600 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!content.trim() || !selectedThread || loading}
              className="shrink-0 gap-2 rounded-xl bg-white px-6 text-zinc-900 hover:bg-zinc-200"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Enviar
            </Button>
          </div>
        </div>
      </div>

      {/* Right - Stats */}
      <div className="w-56 flex-shrink-0 border-l border-zinc-800 bg-zinc-900/30">
        <div className="border-b border-zinc-800 p-4">
          <h3 className="text-sm font-medium text-zinc-300">Estadísticas</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
              <p className="text-xl font-bold text-zinc-200">{stats.total}</p>
              <p className="text-[10px] text-zinc-500">Total</p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
              <p className="text-xl font-bold text-zinc-200">{stats.human}</p>
              <p className="text-[10px] text-zinc-500">Tuyos</p>
            </div>
            <div className="col-span-2 rounded-lg bg-zinc-800/50 p-3 text-center">
              <p className="text-xl font-bold text-emerald-400">{stats.agent}</p>
              <p className="text-[10px] text-zinc-500">Del agente</p>
            </div>
          </div>

          {selectedMessage && (
            <div className="mt-4">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Mensaje
              </p>
              <div className="mt-2 rounded-lg bg-zinc-800/30 p-3">
                <p className="text-xs text-zinc-400">
                  {selectedMessage.role === 'human' ? 'Tú' : selectedMessage.actor}
                </p>
                <p className="mt-1 text-xs text-zinc-600">
                  {formatRelativeTime(selectedMessage.createdAt)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
