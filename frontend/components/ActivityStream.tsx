'use client';

import { useEffect } from 'react';
import type { ActivityLog } from '@prisma/client';
import { useProjectStore } from '@/store/useProjectStore';

interface ActivityStreamProps {
  projectSlug: string;
  initialLogs: ActivityLog[];
  openClawConnected: boolean;
}

function normalizeDetails(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function ActivityStream({ projectSlug, initialLogs, openClawConnected }: ActivityStreamProps) {
  const { logs, hydrateLogs, pushLog, activityState, setActivityState } = useProjectStore();

  useEffect(() => {
    hydrateLogs(
      initialLogs.map((log) => ({
        id: log.id,
        actor: log.actor,
        action: log.action,
        timestamp: log.timestamp.toISOString(),
        details: normalizeDetails(log.details),
      })),
    );
  }, [hydrateLogs, initialLogs]);

  useEffect(() => {
    if (!openClawConnected) {
      setActivityState('disconnected');
      return;
    }

    const source = new EventSource(`/api/events?projectSlug=${projectSlug}`);
    setActivityState('reconnecting');

    source.onopen = () => setActivityState('connected');
    source.onerror = () => setActivityState('disconnected');
    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'error') {
          setActivityState('disconnected');
          source.close();
        }
        pushLog({
          id: `${payload.timestamp}-${payload.type}`,
          actor: payload.agentName || 'OpenClaw',
          action: payload.type,
          timestamp: payload.timestamp,
          details: payload.message || payload,
        });
      } catch {
        setActivityState('reconnecting');
      }
    };

    return () => {
      source.close();
      setActivityState('disconnected');
    };
  }, [openClawConnected, projectSlug, pushLog, setActivityState]);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Realtime feed</p>
          <h2 className="text-2xl font-semibold">Actividad</h2>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300" data-testid="activity-connection-state">{activityState}</span>
      </div>

      {logs.length === 0 ? (
        <div className="flex h-full min-h-48 items-center justify-center rounded-3xl border border-dashed border-white/10 bg-black/10 px-6 text-center text-sm text-zinc-500" data-testid="empty-activity-state">
          Todavía no hay actividad para este proyecto.
        </div>
      ) : (
        <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto pr-1">
          {logs.map((log) => (
            <article key={log.id} className="rounded-3xl border border-white/6 bg-white/[0.03] p-4" data-testid={`activity-item-${log.id}`}>
              <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.16em] text-zinc-500">
                <span>{log.actor}</span>
                <time>{new Date(log.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</time>
              </div>
              <p className="mt-3 text-sm font-medium text-zinc-100">{log.action}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}