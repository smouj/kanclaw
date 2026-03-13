import Image from 'next/image';
import Link from 'next/link';
import { Agent, Project, Task } from '@prisma/client';
import { ArrowLeft, Bot, FolderTree, Radio } from 'lucide-react';

interface ProjectSidebarProps {
  project: Project & { agents: Agent[]; tasks: Task[] };
  health: { connected: boolean; status: number; agents: unknown[] };
}

export function ProjectSidebar({ project, health }: ProjectSidebarProps) {
  return (
    <div className="flex h-full flex-col gap-6 p-5">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-zinc-100" data-testid="back-to-home-link">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>

      <div className="panel-muted space-y-5 p-4">
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            <Image
              src="/kanclaw-logo-light.png"
              alt="KanClaw official logo"
              fill
              sizes="56px"
              className="object-contain p-1 theme-show-light"
            />
            <Image
              src="/kanclaw-logo-dark.png"
              alt="KanClaw official logo"
              fill
              sizes="56px"
              className="object-contain p-1 theme-show-dark"
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted">Workspace</p>
            <h1 className="text-2xl font-semibold" data-testid="project-sidebar-title">{project.name}</h1>
          </div>
        </div>
        <p className="text-sm leading-6 text-zinc-400" data-testid="project-sidebar-description">{project.description || 'Sin descripción todavía.'}</p>
      </div>

      <div className="panel-muted space-y-4 p-4">
        <div className="flex items-center gap-2 text-sm text-zinc-200">
          <Radio className={`h-4 w-4 ${health.connected ? 'text-emerald-300' : 'text-amber-300'}`} />
          <span data-testid="project-openclaw-status">{health.connected ? 'OpenClaw conectado' : 'OpenClaw desconectado'}</span>
        </div>
        <p className="text-sm text-zinc-500">{health.connected ? 'Eventos en tiempo real disponibles.' : 'Comprueba el gateway y vuelve a intentarlo.'}</p>
      </div>

      <div className="panel-muted p-4">
        <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted">
          <Bot className="h-4 w-4" /> Agentes
        </div>
        {project.agents.length === 0 ? (
          <p className="text-sm text-zinc-500" data-testid="empty-agents-state">No hay agentes asignados.</p>
        ) : (
          <ul className="space-y-3">
            {project.agents.map((agent) => (
              <li key={agent.id} className="rounded-2xl border border-white/6 bg-white/[0.03] p-3" data-testid={`agent-list-item-${agent.name.toLowerCase()}`}>
                <p className="text-sm font-medium text-zinc-100">{agent.name}</p>
                <p className="mt-1 text-xs text-zinc-500">{agent.role || 'Sin rol definido'}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="panel-muted p-4">
        <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted">
          <FolderTree className="h-4 w-4" /> Resumen
        </div>
        <dl className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-zinc-500">Tareas</dt>
            <dd data-testid="project-sidebar-task-count">{project.tasks.length}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-zinc-500">Pendientes</dt>
            <dd>{project.tasks.filter((task) => task.status === 'TODO').length}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-zinc-500">En marcha</dt>
            <dd>{project.tasks.filter((task) => task.status === 'RUNNING').length}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}