'use client';

import { useMemo } from 'react';
import { Play, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

interface Run {
  id: string;
  title: string;
  status: string;
  createdAt: string | Date;
  metadata?: {
    agent?: string;
    duration?: string;
    error?: string;
  } | unknown;
}

interface RunTimelineProps {
  runs: Run[];
  limit?: number;
}

export function RunTimeline({ runs, limit = 10 }: RunTimelineProps) {
  const sortedRuns = useMemo(() => {
    return [...runs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }, [runs, limit]);

  const statusConfig: Record<string, { icon: typeof Play; color: string; bg: string; animate?: boolean }> = {
    success: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
    running: { icon: Loader2, color: 'text-blue-400', bg: 'bg-blue-400/10', animate: true },
    pending: { icon: Clock, color: 'text-zinc-400', bg: 'bg-zinc-400/10' },
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    
    if (diff < 60000) return 'Hace un momento';
    if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)}h`;
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  if (runs.length === 0) {
    return (
      <div className="kanclaw-panel rounded-[1.6rem] p-6 text-center">
        <p className="text-sm text-zinc-500">No hay ejecuciones todavía</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sortedRuns.map((run, index) => {
        const status = statusConfig[run.status as keyof typeof statusConfig] || statusConfig.pending;
        const Icon = status.icon;
        
        return (
          <div
            key={run.id}
            className="group relative flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition hover:bg-white/[0.05]"
          >
            {/* Timeline line */}
            {index < sortedRuns.length - 1 && (
              <div className="absolute left-[14px] top-8 h-full w-px -translate-x-1/2 bg-white/10" />
            )}
            
            {/* Status icon */}
            <div className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${status.bg}`}>
              <Icon className={`h-4 w-4 ${status.color} ${status.animate ? 'animate-spin' : ''}`} />
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">{run.title}</p>
              <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                {typeof run.metadata === 'object' && run.metadata !== null && 'agent' in run.metadata && (
                  <span className="rounded-full border border-white/10 px-1.5 py-0.5">
                    {(run.metadata as { agent?: string }).agent}
                  </span>
                )}
                {typeof run.metadata === 'object' && run.metadata !== null && 'duration' in run.metadata && (
                  <span>{(run.metadata as { duration?: string }).duration}</span>
                )}
                <span>·</span>
                <span>{formatDate(run.createdAt)}</span>
              </div>
              {typeof run.metadata === 'object' && run.metadata !== null && 'error' in run.metadata && (
                <p className="mt-1 truncate text-xs text-red-400">{(run.metadata as { error?: string }).error}</p>
              )}
            </div>
            
            {/* Status badge */}
            <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
              run.status === 'success' ? 'border-emerald-500/30 text-emerald-400' :
              run.status === 'failed' ? 'border-red-500/30 text-red-400' :
              run.status === 'running' ? 'border-blue-500/30 text-blue-400' :
              'border-zinc-500/30 text-zinc-400'
            }`}>
              {run.status}
            </span>
          </div>
        );
      })}
      
      {runs.length > limit && (
        <p className="text-center text-xs text-zinc-500">
          + {runs.length - limit} más
        </p>
      )}
    </div>
  );
}
