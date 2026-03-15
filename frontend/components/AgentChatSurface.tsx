'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Check, Copy, CornerDownLeft, Image, Loader2, MessageSquare, Paperclip, Quote, Search, Send, Sparkles, Type, X, Zap, DollarSign, Gauge, Pencil, Trash2, Repeat, ThumbsUp, ThumbsDown } from 'lucide-react';
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

function getKindIcon(kind: string | undefined) {
  if (!kind) return null;
  const icons: Record<string, string> = {
    memory: '💾',
    knowledge: '📖',
    decision: '⚖️',
    artifact: '📦',
    task: '✅',
    run: '⚡',
    message: '💬',
    import: '📥',
    snapshot: '📸',
  };
  return <span title={kind}>{icons[kind.toLowerCase()] || '📄'}</span>;
}

function formatTime(date: string | Date, locale = 'es-ES') {
  return new Date(date).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

function formatDay(date: string | Date, locale = 'es-ES') {
  return new Date(date).toLocaleDateString(locale);
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
  let inList = false;
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' = 'ul';

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

  const flushList = () => {
    if (listItems.length === 0) return;
    const listNodes = listItems.map((item, idx) => (
      <li key={idx} className="ml-4 text-sm text-text-primary">{item}</li>
    ));
    if (listType === 'ul') {
      nodes.push(<ul key={`ul-${nodes.length}`} className="my-2 space-y-1">{listNodes}</ul>);
    } else {
      nodes.push(<ol key={`ol-${nodes.length}`} className="my-2 list-decimal list-inside space-y-1">{listNodes}</ol>);
    }
    listItems = [];
    inList = false;
  };

  lines.forEach((line, i) => {
    // Code blocks
    if (line.startsWith('```')) {
      if (inList) flushList();
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

    // Horizontal rule
    if (line.match(/^(-{3,}|\*{3,}|_{3,})$/)) {
      if (inList) flushList();
      nodes.push(<hr key={`hr-${i}`} className="my-4 border-border" />);
      return;
    }

    // Tables
    const tableMatch = line.match(/^\|(.+)\|$/);
    if (tableMatch && lines[i+1]?.match(/^\|[-:| ]+\|$/)) {
      if (inList) flushList();
      const headers = tableMatch[1].split('|').map(h => h.trim());
      const nextLine = lines[i+1];
      const alignments = nextLine.split('|').slice(1, -1).map(cell => {
        if (cell.includes(':') && cell.includes(':')) return 'text-center';
        if (cell.includes(':')) return 'text-right';
        return 'text-left';
      });
      
      const rows: string[][] = [];
      for (let j = i + 2; j < lines.length; j++) {
        const rowMatch = lines[j].match(/^\|(.+)\|$/);
        if (!rowMatch) break;
        rows.push(rowMatch[1].split('|').map(cell => cell.trim()));
      }
      
      nodes.push(
        <div key={`table-${i}`} className="my-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                {headers.map((h, idx) => (
                  <th key={idx} className={`px-3 py-2 text-left font-semibold text-text-primary ${alignments[idx] || ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => (
                <tr key={rowIdx} className="border-b border-border">
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className={`px-3 py-2 text-text-primary ${alignments[cellIdx] || ''}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      return;
    }

    // Unordered list
    const ulMatch = line.match(/^[-*•]\s+(.+)$/);
    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        if (inList) flushList();
        inList = true;
        listType = 'ul';
      }
      listItems.push(ulMatch[1]);
      return;
    }

    // Ordered list
    const olMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (olMatch) {
      if (!inList || listType !== 'ol') {
        if (inList) flushList();
        inList = true;
        listType = 'ol';
      }
      listItems.push(olMatch[2]);
      return;
    }

    // Flush list if we hit a non-list line
    if (inList) {
      flushList();
    }

    // Images
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

    // Headers
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

    // Empty line
    if (line.trim() === '') {
      nodes.push(<div key={`sp-${i}`} className="h-2" />);
      return;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      nodes.push(<blockquote key={`q-${i}`} className="my-2 border-l-2 border-border pl-3 text-sm italic text-text-secondary">{line.slice(2)}</blockquote>);
      return;
    }

    // Inline formatting
    const inline = line.split(/(`[^`]+`|\*\*[^*]+\*\*|~~[^~]+~~|\*[^*]+\*|_[^_]+_)/g).map((part, idx) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={idx} className="rounded border border-border bg-surface2 px-1.5 py-0.5 text-xs text-amber-400">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('~~') && part.endsWith('~~')) {
        return <del key={idx} className="line-through">{part.slice(2, -2)}</del>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={idx}>{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('_') && part.endsWith('_')) {
        return <em key={idx}>{part.slice(1, -1)}</em>;
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
  if (inList) flushList();
  return nodes;
}

function MarkdownToolbar({ onInsert, onFileUpload }: { onInsert: (syntax: string, wrap?: boolean) => void; onFileUpload?: (files: FileList) => void }) {
  return (
    <div className="flex items-center justify-between border-b border-border px-3 py-2">
      <div className="flex items-center gap-1">
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
        {onFileUpload && (
          <label className="cursor-pointer rounded p-1.5 text-text-muted hover:bg-surface2 hover:text-text-primary" title="Adjuntar imagen">
            <Paperclip className="h-4 w-4" />
            <input type="file" multiple accept="image/*,.txt,.md,.json,.js,.ts,.py" className="hidden" onChange={(e) => e.target.files && onFileUpload(e.target.files)} />
          </label>
        )}
      </div>
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
  const { t, locale } = useI18n();
  const [threads, setThreads] = useState(initialThreads);
  const [selectedThreadId, setSelectedThreadId] = useState(selectedThreadIdExternal || initialThreads[0]?.id || '');
  const [selectedMessageId, setSelectedMessageId] = useState('');
  const [content, setContent] = useState('');
  const [targetAgentName, setTargetAgentName] = useState(
    preferredTargetAgentExternal || initialThreads[0]?.agent?.name || agents[0]?.name || ''
  );
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [contextLoading, setContextLoading] = useState(false);
  const [contextResults, setContextResults] = useState<ContextItem[]>([]);
  const [selectedContext, setSelectedContext] = useState<ContextItem[]>([]);
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<{name: string; type: string; data: string}[]>([]);
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
      const day = formatDay(msg.createdAt, locale);
      if (day !== currentDay) {
        currentDay = day;
        groups.push({ day, messages: [] });
      }
      groups[groups.length - 1].messages.push(msg);
    });
    return groups;
  }, [selectedThread, locale]);

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

  const handleFileUpload = async (files: FileList) => {
    const newFiles: {name: string; type: string; data: string}[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        newFiles.push({ name: file.name, type: 'image', data: dataUrl });
      } else {
        const text = await file.text();
        const isImage = /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(file.name);
        newFiles.push({ 
          name: file.name, 
          type: isImage ? 'image' : 'file', 
          data: isImage ? `data:${file.type};base64,${Buffer.from(text).toString('base64')}` : text 
        });
      }
    }
    setAttachedFiles(prev => [...prev, ...newFiles]);
    toast.success(`${newFiles.length} archivo(s) adjuntado(s)`);
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
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
      <aside className="hidden md:block w-72 flex-shrink-0 border-r border-border bg-surface2/60">
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
            const isTeamRoom = thread.scope === 'TEAM';
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
                <div className="flex items-center gap-2">
                  {isTeamRoom ? (
                    <span className="text-accent-green" title="Team Room">👥</span>
                  ) : thread.agent?.name ? (
                    <Bot className="h-3.5 w-3.5 text-text-muted" />
                  ) : (
                    <MessageSquare className="h-3.5 w-3.5 text-text-muted" />
                  )}
                  <span className="truncate text-sm font-medium">{thread.title}</span>
                  {isTeamRoom && <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent-green/20 text-accent-green">Team</span>}
                </div>
                <p className="mt-1.5 line-clamp-1 text-xs text-text-muted">{lastText || t('chat.noMessagesShort')}</p>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main */}
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface/70 px-5 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold truncate">{selectedThread?.title || t('chat.selectThread')}</h3>
              {selectedThread?.scope === 'TEAM' && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-accent-green/20 text-accent-green">Team Room</span>
              )}
            </div>
            <p className="text-xs text-text-muted truncate">
              {selectedThread?.messages.length || 0} mensajes
            </p>
            <div className="mt-2 md:hidden">
              <select
                value={selectedThreadId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setSelectedThreadId(nextId);
                  const nextThread = threads.find((t) => t.id === nextId);
                  if (nextThread?.agent?.name) setTargetAgentName(nextThread.agent.name);
                  onThreadChange?.(nextId);
                }}
                className="w-full border border-border bg-surface2 px-2 py-1.5 text-xs text-text-primary"
                aria-label="Select conversation thread"
              >
                {threads.map((thread) => (
                  <option key={thread.id} value={thread.id}>
                    {thread.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedThread?.scope === 'TEAM' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="flex items-center gap-2 border border-border bg-surface2 px-3 py-2 text-sm text-text-primary hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/50"
                aria-label="Search messages"
                type="button"
              >
                <Search className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowAgentSelector((prev) => !prev)}
                className="flex items-center gap-2 border border-border bg-surface2 px-3 py-2 text-sm text-text-primary hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/50"
                aria-label="Toggle team agent selector"
                aria-expanded={showAgentSelector}
                type="button"
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
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-text-muted">Seleccionar agente activo</p>
              <p className="text-[10px] text-text-muted">{agents.length} disponibles</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => {
                    setTargetAgentName(agent.name);
                    setShowAgentSelector(false);
                  }}
                  className={`border p-3 text-left transition-all ${
                    targetAgentName === agent.name
                      ? 'border-accent-green bg-accent-green/10'
                      : 'border-border hover:border-text-muted'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Bot className={`h-4 w-4 ${(agent as any).isOfficial ? 'text-accent-green' : 'text-text-muted'}`} />
                    <span className="text-sm font-medium">{agent.name}</span>
                    {(agent as any).isOfficial && <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent-green/20 text-accent-green">official</span>}
                  </div>
                  {agent.role && <p className="text-[10px] text-text-muted mt-1">{agent.role}</p>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Messages */}
        {showSearch && (
          <div className="border-b border-border bg-surface2/60 px-5 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar mensajes..."
                className="w-full border border-border bg-surface pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted"
                autoFocus
              />
            </div>
            {searchQuery && (
              <p className="mt-2 text-xs text-text-muted">
                {selectedThread?.messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase())).length || 0} resultados
              </p>
            )}
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
                          <div className={`group relative max-w-[78%] ${selected ? 'ring-2 ring-text-primary/25' : ''}`}>
                            <button
                              type="button"
                              onClick={() => setSelectedMessageId(message.id)}
                              className={`border px-4 py-3 text-left transition-all ${
                                isSystem
                                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-100'
                                  : isHuman
                                  ? 'border-border bg-surface2 text-text-primary'
                                  : 'border-border bg-surface text-text-primary'
                              } ${selected ? '' : 'hover:-translate-y-0.5'} `}
                            >
                              <div className="mb-1 flex items-center justify-between gap-3 text-[10px] uppercase tracking-wider text-text-muted">
                                <span>{isHuman ? t('chat.you') : message.actor}</span>
                                <span>{formatTime(message.createdAt, locale)}</span>
                              </div>
                              <div className="space-y-1 text-sm leading-relaxed">{renderMarkdown(message.content, t)}</div>
                            </button>
                            {/* Message Actions */}
                            {selected && (
                              <div className="absolute -top-8 right-0 flex gap-1 bg-surface border border-border rounded p-1 shadow-lg">
                                <button onClick={() => navigator.clipboard.writeText(message.content)} className="p-1.5 hover:bg-surface2 rounded" title="Copy">
                                  <Copy className="h-3 w-3" />
                                </button>
                                {isHuman && (
                                  <button onClick={() => { setEditingMessageId(message.id); setEditContent(message.content); }} className="p-1.5 hover:bg-surface2 rounded" title="Edit">
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                )}
                                {isHuman && (
                                  <button className="p-1.5 hover:bg-surface2 rounded" title="Retry">
                                    <Repeat className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
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
          {/* Attached Files */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2">
              <Paperclip className="h-4 w-4 text-text-muted" />
              <span className="text-xs text-text-muted">Adjuntos</span>
              {attachedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-1 border border-border bg-surface2 px-2 py-1 text-xs">
                  {file.type === 'image' ? <Image className="h-3 w-3" /> : <Paperclip className="h-3 w-3" />}
                  <span className="max-w-[100px] truncate">{file.name}</span>
                  <button onClick={() => removeAttachedFile(idx)} className="text-text-muted hover:text-red-400">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {contextResults.length > 0 && (
            <div className="border-b border-border px-4 py-2">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-text-muted" />
                <span className="text-xs text-text-muted font-medium">Contexto detectado</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {contextResults.slice(0, 6).map((item) => {
                  const active = selectedContext.some((ctx) => ctx.id === item.id);
                  const kindIcon = getKindIcon(item.kind);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleContext(item)}
                      className={`flex items-center gap-1.5 border px-2.5 py-1.5 text-xs transition-all ${
                        active
                          ? 'border-text-primary bg-text-primary text-background'
                          : 'border-border bg-surface2 text-text-muted hover:text-text-primary hover:border-text-muted'
                      }`}
                    >
                      {kindIcon}
                      <span className="truncate max-w-[120px]">{item.title}</span>
                      <span className={`text-[9px] px-1 rounded ${active ? 'bg-background/20' : 'bg-surface'}`}>{item.kind}</span>
                      {active && <X className="h-3 w-3" />}
                    </button>
                  );
                })}
                {contextLoading && <Loader2 className="h-3 w-3 animate-spin text-text-muted" />}
              </div>
              {selectedContext.length > 0 && (
                <p className="mt-2 text-[10px] text-accent-green">
                  {selectedContext.length} item(s) seleccionado(s) como contexto
                </p>
              )}
            </div>
          )}

          {/* Quick Intents */}
          <div className="border-b border-border px-4 py-2 flex items-center gap-2 overflow-x-auto">
            <span className="text-xs text-text-muted whitespace-nowrap">Intento:</span>
            {[
              { label: 'Plan', icon: '📋', prefix: 'Plan: ' },
              { label: 'Build', icon: '🔨', prefix: 'Build: ' },
              { label: 'Research', icon: '🔍', prefix: 'Research: ' },
              { label: 'QA', icon: '✅', prefix: 'QA: ' },
              { label: 'Repo', icon: '📚', prefix: 'Repo: ' },
              { label: 'Memory', icon: '💾', prefix: 'Memory: ' },
            ].map((intent) => (
              <button
                key={intent.label}
                onClick={() => {
                  setContent(prev => prev + intent.prefix);
                  textareaRef.current?.focus();
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs border border-border rounded hover:bg-surface2 hover:border-accent-green/50 transition-colors whitespace-nowrap"
              >
                <span>{intent.icon}</span>
                <span>{intent.label}</span>
              </button>
            ))}
          </div>

          <MarkdownToolbar onInsert={insertMarkdown} onFileUpload={handleFileUpload} />

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

      <aside className="hidden lg:block w-60 flex-shrink-0 border-l border-border bg-surface2/50">
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
            <div className="border border-border bg-surface p-3 text-xs text-text-muted space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-text-primary uppercase tracking-wider">Inspector</p>
                <span className={`text-[10px] px-2 py-0.5 rounded ${selectedMessage.role === 'human' ? 'bg-blue-500/20 text-blue-400' : selectedMessage.role === 'system' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {selectedMessage.role}
                </span>
              </div>
              
              <div className="space-y-1">
                <p className="text-text-muted">{selectedMessage.role === 'human' ? t('chat.you') : selectedMessage.actor}</p>
                <p className="text-[10px] text-text-muted">{new Date(selectedMessage.createdAt).toLocaleString(locale)}</p>
              </div>

              {/* Run Info */}
              {selectedMessageMetadata && 'runId' in selectedMessageMetadata && (
                <div className="pt-2 border-t border-border">
                  <p className="text-[10px] font-semibold text-text-primary mb-1">Run</p>
                  <p className="font-mono text-[9px] break-all text-accent-green">{String((selectedMessageMetadata as any).runId)}</p>
                </div>
              )}

              {/* External Task ID */}
              {selectedMessageMetadata && 'externalTaskId' in selectedMessageMetadata && (
                <div className="pt-2 border-t border-border">
                  <p className="text-[10px] font-semibold text-text-primary mb-1">Task ID</p>
                  <p className="font-mono text-[9px] break-all">{String((selectedMessageMetadata as any).externalTaskId)}</p>
                </div>
              )}

              {/* Executed Actions */}
              {selectedMessageMetadata && 'executedActions' in selectedMessageMetadata && (
                <div className="pt-2 border-t border-border">
                  <p className="text-[10px] font-semibold text-text-primary mb-1">Acciones ejecutadas</p>
                  <div className="space-y-1">
                    {(() => {
                      const actions = (selectedMessageMetadata as any).executedActions;
                      if (!actions || !Array.isArray(actions) || actions.length === 0) {
                        return <p className="text-[9px] text-text-muted">Sin acciones</p>;
                      }
                      return actions.slice(0, 5).map((action: any, idx: number) => (
                        <div key={idx} className="text-[9px] bg-surface2 px-2 py-1 rounded truncate">
                          {action.type || 'action'}: {action.summary || JSON.stringify(action).slice(0, 30)}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* Context Used */}
              {selectedMessageMetadata && 'contextItems' in selectedMessageMetadata && (
                <div className="pt-2 border-t border-border">
                  <p className="text-[10px] font-semibold text-text-primary mb-1">Contexto usado</p>
                  <div className="space-y-1">
                    {(() => {
                      const ctx = (selectedMessageMetadata as any).contextItems;
                      if (!ctx || !Array.isArray(ctx) || ctx.length === 0) {
                        return <p className="text-[9px] text-text-muted">Sin contexto</p>;
                      }
                      return ctx.slice(0, 4).map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-1 text-[9px]">
                          <span className="px-1 py-0.5 rounded bg-surface2 text-text-muted">{item.kind || 'item'}</span>
                          <span className="truncate">{item.title || item.id}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* Token Usage Display */}
              <div className="pt-2 border-t border-border">
                <div className="flex items-center gap-1 mb-2">
                  <Gauge className="h-3 w-3" />
                  <span className="text-[10px] font-semibold text-text-primary">Usage</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-surface2 p-2 rounded">
                    <p className="text-lg font-semibold text-accent-green">
                      {selectedMessageMetadata && 'usage' in selectedMessageMetadata 
                        ? String((selectedMessageMetadata as any).usage?.input || 0) 
                        : selectedMessage.content.length > 100 ? Math.round(selectedMessage.content.length / 4) : 0}
                    </p>
                    <p className="text-[9px]">input tokens</p>
                  </div>
                  <div className="bg-surface2 p-2 rounded">
                    <p className="text-lg font-semibold text-accent-blue">
                      {selectedMessageMetadata && 'usage' in selectedMessageMetadata 
                        ? String((selectedMessageMetadata as any).usage?.output || selectedMessage.content.length) 
                        : selectedMessage.role === 'human' ? 0 : Math.round(selectedMessage.content.length / 4)}
                    </p>
                    <p className="text-[9px]">output tokens</p>
                  </div>
                </div>
                {/* Cost Estimate */}
                <div className="mt-2 flex items-center gap-1 bg-surface2 p-2 rounded">
                  <DollarSign className="h-3 w-3 text-amber-400" />
                  <span className="text-[10px]">Costo:</span>
                  <span className="font-semibold text-amber-400">
                    {'$'}
                    {selectedMessageMetadata && 'usage' in selectedMessageMetadata 
                      ? String(((Number((selectedMessageMetadata as any).usage?.input || 0) * 0.00001) + (Number((selectedMessageMetadata as any).usage?.output || 0) * 0.00003)).toFixed(6))
                      : selectedMessage.role === 'human' 
                        ? '0.000000' 
                        : String((selectedMessage.content.length / 4 * 0.00003).toFixed(6))}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-border bg-surface p-3 text-xs text-text-muted">
              <p className="text-[11px] font-semibold text-text-primary uppercase tracking-wider mb-2">Inspector</p>
              <p className="text-text-muted">Selecciona un mensaje para ver detalles</p>
              <div className="mt-4 pt-3 border-t border-border">
                <div className="grid grid-cols-2 gap-2">
                  <div className="border border-border bg-surface2 p-2 rounded text-center">
                    <p className="text-lg font-semibold">{stats.total}</p>
                    <p className="text-[9px]">total</p>
                  </div>
                  <div className="border border-border bg-surface2 p-2 rounded text-center">
                    <p className="text-lg font-semibold text-accent-green">{stats.agent}</p>
                    <p className="text-[9px]">agente</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
