'use client';

import { useState, useEffect } from 'react';
import { 
  Eye, RefreshCw, ExternalLink, Clock, 
  CheckCircle2, XCircle, Play, FileText, 
  GitBranch, MessageSquare, Archive
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProjectPreviewProps {
  projectSlug: string;
}

interface ProjectState {
  lastRun?: { id: string; title: string; status: string; createdAt: string };
  activeTasks: Array<{ id: string; title: string; status: string }>;
  recentThreads: Array<{ id: string; title: string; lastMessage: string; updatedAt: string }>;
  recentArtifacts: Array<{ id: string; name: string; type: string; createdAt: string }>;
  stats: { runs: number; tasks: number; threads: number; artifacts: number };
}

export function ProjectPreview({ projectSlug }: ProjectPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<ProjectState | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'artifacts'>('overview');

  useEffect(() => {
    loadProjectState();
  }, [projectSlug]);

  async function loadProjectState() {
    setLoading(true);
    try {
      const [runsRes, tasksRes, threadsRes, artifactsRes] = await Promise.all([
        fetch(`/api/runs?projectSlug=${projectSlug}&limit=5`),
        fetch(`/api/tasks?projectSlug=${projectSlug}&status=pending&limit=5`),
        fetch(`/api/projects/${projectSlug}/threads?limit=5`),
        fetch(`/api/artifacts?projectSlug=${projectSlug}&limit=5`),
      ]);

      const runs = await runsRes.json();
      const tasks = await tasksRes.json();
      const threads = await threadsRes.json();
      const artifacts = await artifactsRes.json();

      setState({
        lastRun: runs[0] ? { id: runs[0].id, title: runs[0].title, status: runs[0].status, createdAt: runs[0].createdAt } : undefined,
        activeTasks: tasks.slice(0, 5),
        recentThreads: threads.slice(0, 5),
        recentArtifacts: artifacts.slice(0, 8),
        stats: {
          runs: runs.length || 0,
          tasks: tasks.length || 0,
          threads: threads.length || 0,
          artifacts: artifacts.length || 0,
        }
      });
    } catch (error) {
      console.error('Failed to load project state:', error);
    }
    setLoading(false);
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'running': return <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-zinc-400" />;
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Eye className="w-5 h-5 text-zinc-400" />
          <h2 className="text-lg font-semibold">Vista previa del proyecto</h2>
        </div>
        <Button variant="outline" size="sm" onClick={loadProjectState}>
          <RefreshCw className="w-4 h-4 mr-1" />
          Actualizar
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-surface2/30">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 text-xs rounded-lg transition ${
            activeTab === 'overview' ? 'bg-surface text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Resumen
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-3 py-1.5 text-xs rounded-lg transition ${
            activeTab === 'activity' ? 'bg-surface text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Actividad reciente
        </button>
        <button
          onClick={() => setActiveTab('artifacts')}
          className={`px-3 py-1.5 text-xs rounded-lg transition ${
            activeTab === 'artifacts' ? 'bg-surface text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Resultados
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 bg-surface2 rounded-lg border border-border">
                <div className="flex items-center gap-2 text-zinc-400 mb-1">
                  <Play className="w-4 h-4" />
                  <span className="text-xs">Runs</span>
                </div>
                <p className="text-2xl font-semibold">{state?.stats.runs || 0}</p>
              </div>
              <div className="p-3 bg-surface2 rounded-lg border border-border">
                <div className="flex items-center gap-2 text-zinc-400 mb-1">
                  <GitBranch className="w-4 h-4" />
                  <span className="text-xs">Tareas</span>
                </div>
                <p className="text-2xl font-semibold">{state?.stats.tasks || 0}</p>
              </div>
              <div className="p-3 bg-surface2 rounded-lg border border-border">
                <div className="flex items-center gap-2 text-zinc-400 mb-1">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-xs">Chats</span>
                </div>
                <p className="text-2xl font-semibold">{state?.stats.threads || 0}</p>
              </div>
              <div className="p-3 bg-surface2 rounded-lg border border-border">
                <div className="flex items-center gap-2 text-zinc-400 mb-1">
                  <Archive className="w-4 h-4" />
                  <span className="text-xs">Artifacts</span>
                </div>
                <p className="text-2xl font-semibold">{state?.stats.artifacts || 0}</p>
              </div>
            </div>

            {/* Last Run */}
            {state?.lastRun && (
              <div className="p-4 bg-surface2 rounded-xl border border-border">
                <h3 className="text-sm font-medium mb-3">Última ejecución</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(state.lastRun.status)}
                    <span className="text-sm">{state.lastRun.title}</span>
                  </div>
                  <span className="text-xs text-zinc-500">{formatDate(state.lastRun.createdAt)}</span>
                </div>
              </div>
            )}

            {/* Active Tasks */}
            {state?.activeTasks && state.activeTasks.length > 0 && (
              <div className="p-4 bg-surface2 rounded-xl border border-border">
                <h3 className="text-sm font-medium mb-3">Tareas activas</h3>
                <div className="space-y-2">
                  {state.activeTasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between text-sm">
                      <span className="truncate">{task.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        task.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                        task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-zinc-500/20 text-zinc-400'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!state?.lastRun && (!state?.activeTasks || state.activeTasks.length === 0) && (
              <div className="text-center py-12 text-zinc-500">
                <Eye className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm">No hay actividad reciente</p>
                <p className="text-xs mt-1">Inicia una conversación para ver actividad</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-2">
            {state?.recentThreads && state.recentThreads.length > 0 ? (
              state.recentThreads.map(thread => (
                <div key={thread.id} className="p-3 bg-surface2 rounded-lg border border-border flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-zinc-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{thread.title}</p>
                    <p className="text-xs text-zinc-500 truncate">{thread.lastMessage}</p>
                  </div>
                  <span className="text-xs text-zinc-500">{formatDate(thread.updatedAt)}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-zinc-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm">No hay conversaciones</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'artifacts' && (
          <div className="space-y-2">
            {state?.recentArtifacts && state.recentArtifacts.length > 0 ? (
              <div className="grid gap-2">
                {state.recentArtifacts.map(artifact => (
                  <div key={artifact.id} className="p-3 bg-surface2 rounded-lg border border-border flex items-center gap-3">
                    <FileText className="w-4 h-4 text-zinc-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{artifact.name}</p>
                      <p className="text-xs text-zinc-500">{artifact.type}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-zinc-500" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-500">
                <Archive className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm">No hay artifacts</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
