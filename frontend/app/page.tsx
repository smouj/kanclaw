import Image from 'next/image';
import Link from 'next/link';
import { FolderKanban, Workflow, PlugZap } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getOpenClawHealth } from '@/lib/openclaw';
import { ProjectCreateForm } from '@/components/ProjectCreateForm';

async function getProjects() {
  return prisma.project.findMany({
    include: { agents: true, tasks: true },
    orderBy: { createdAt: 'desc' },
  });
}

export default async function HomePage() {
  const [projects, health] = await Promise.all([getProjects(), getOpenClawHealth()]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-8 px-4 py-6 sm:px-6 lg:px-10">
      <section className="panel grid gap-8 overflow-hidden p-6 lg:grid-cols-[1.4fr_0.9fr] lg:p-10">
        <div className="grid-glow relative rounded-[2rem] border border-white/5 bg-black/30 p-6">
          <div className="mb-10 flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-white/10 bg-black">
              <Image src="/kanclaw-logo-dark.png" alt="KanClaw" fill className="object-cover" sizes="48px" priority />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-muted">Living Workspace OS</p>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">KanClaw</h1>
            </div>
          </div>

          <div className="max-w-3xl space-y-5">
            <p className="text-base text-zinc-300 sm:text-lg">
              Un workspace premium para equipos de agentes IA con memoria persistente, tablero Kanban, actividad viva y filesystem real por proyecto.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { icon: FolderKanban, label: 'Proyectos aislados', value: `${projects.length} activos` },
                { icon: Workflow, label: 'Tareas persistentes', value: `${projects.reduce((acc, project) => acc + project.tasks.length, 0)} registradas` },
                { icon: PlugZap, label: 'OpenClaw', value: health.connected ? 'Conectado' : 'Desconectado' },
              ].map((item) => (
                <div key={item.label} className="panel-muted animate-rise p-4" data-testid={`home-metric-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                  <item.icon className="mb-4 h-5 w-5 text-zinc-200" />
                  <p className="text-xs uppercase tracking-[0.24em] text-muted">{item.label}</p>
                  <p className="mt-2 text-lg font-medium text-text">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <ProjectCreateForm />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.5fr_0.7fr]">
        <div className="panel p-6 lg:p-8" data-testid="projects-dashboard-panel">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Workspaces</p>
              <h2 className="text-2xl font-semibold">Proyectos</h2>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="panel-muted flex min-h-64 flex-col justify-center p-6" data-testid="empty-projects-state">
              <p className="text-xl font-medium">No hay proyectos todavía</p>
              <p className="mt-2 max-w-xl text-sm text-muted">
                Crea el primer workspace para generar agentes, memoria y estructura real de archivos en tu máquina.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/project/${project.slug}`}
                  className="panel-muted group min-h-48 p-5 transition duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.06]"
                  data-testid={`project-card-${project.slug}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted">
                      {project.slug}
                    </span>
                    <span className="text-xs text-muted">{project.agents.length} agentes</span>
                  </div>
                  <h3 className="mt-6 text-2xl font-semibold">{project.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">
                    {project.description || 'Sin descripción todavía.'}
                  </p>
                  <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-4 text-sm text-muted">
                    <span data-testid={`project-card-task-count-${project.slug}`}>{project.tasks.length} tareas</span>
                    <span className="group-hover:text-zinc-100">Abrir workspace</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="panel flex flex-col gap-4 p-6" data-testid="home-connection-panel">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Gateway</p>
            <h2 className="text-2xl font-semibold">Estado de OpenClaw</h2>
          </div>
          <div className="panel-muted p-4" data-testid="openclaw-connection-status">
            <p className={`text-sm font-medium ${health.connected ? 'text-emerald-300' : 'text-amber-300'}`}>
              {health.connected ? 'Conexión disponible' : 'Gateway desconectado'}
            </p>
            <p className="mt-2 text-sm text-muted">
              {health.connected
                ? 'Se detectó /health y el listado de agentes del gateway.'
                : 'Revisa OPENCLAW_HTTP, OPENCLAW_WS y OPENCLAW_BEARER_TOKEN en tu entorno local.'}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}