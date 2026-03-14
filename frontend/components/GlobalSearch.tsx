'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Folder, Bot, CheckSquare, Play, FileText, X } from 'lucide-react';
import { useI18n } from '@/components/LanguageProvider';

interface SearchResult {
  type: 'project' | 'agent' | 'task' | 'run' | 'file';
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
  projects: Array<{ id: string; slug: string; name: string; agents: Array<{ id: string; name: string }> }>;
}

export function GlobalSearch({ open, onClose, projects }: GlobalSearchProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    
    const q = query.toLowerCase();
    const items: SearchResult[] = [];
    
    // Search projects
    projects.forEach(p => {
      if (p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)) {
        items.push({
          type: 'project',
          id: p.id,
          title: p.name,
          subtitle: p.slug,
          href: `/project/${p.slug}`
        });
      }
      // Search agents
      p.agents.forEach(a => {
        if (a.name.toLowerCase().includes(q)) {
          items.push({
            type: 'agent',
            id: a.id,
            title: a.name,
            subtitle: p.name,
            href: `/project/${p.slug}`
          });
        }
      });
    });
    
    return items.slice(0, 8);
  }, [query, projects]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  const handleSelect = (result: SearchResult) => {
    router.push(result.href);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => (i + 1) % Math.max(1, results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => (i - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  const icons = {
    project: <Folder className="h-4 w-4 text-emerald-400" />,
    agent: <Bot className="h-4 w-4 text-blue-400" />,
    task: <CheckSquare className="h-4 w-4 text-amber-400" />,
    run: <Play className="h-4 w-4 text-purple-400" />,
    file: <FileText className="h-4 w-4 text-zinc-400" />,
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-[12vh] backdrop-blur-sm" onClick={onClose}>
      <div className="kanclaw-panel w-full max-w-xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <Search className="h-5 w-5 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('search.placeholder', 'Buscar proyectos, agentes, tareas...')}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-500"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-zinc-500 hover:text-zinc-300">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && query && (
            <p className="px-3 py-6 text-center text-sm text-zinc-500">
              No se encontraron resultados
            </p>
          )}
          
          {results.length === 0 && !query && (
            <p className="px-3 py-6 text-center text-sm text-zinc-500">
              Escribe para buscar...
            </p>
          )}

          {results.map((result, index) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleSelect(result)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                index === selectedIndex ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
            >
              {icons[result.type]}
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">{result.title}</p>
                {result.subtitle && (
                  <p className="truncate text-xs text-zinc-500">{result.subtitle}</p>
                )}
              </div>
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-500">
                {result.type}
              </span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 px-4 py-2 text-xs text-zinc-500">
          <div className="flex gap-3">
            <span><kbd className="rounded bg-white/10 px-1.5 py-0.5">↑↓</kbd> navegar</span>
            <span><kbd className="rounded bg-white/10 px-1.5 py-0.5">↵</kbd> seleccionar</span>
            <span><kbd className="rounded bg-white/10 px-1.5 py-0.5">esc</kbd> cerrar</span>
          </div>
        </div>
      </div>
    </div>
  );
}
