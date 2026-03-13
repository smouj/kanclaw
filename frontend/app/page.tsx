import Image from 'next/image';
import Link from 'next/link';
import { Cable, Command as CommandIcon, FolderKanban, MemoryStick, PlugZap, Workflow } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getGitHubStatus } from '@/lib/github';
import { getOpenClawHealth } from '@/lib/openclaw';
import { AmbientCanvas } from '@/components/AmbientCanvas';
import { ProjectCreateForm } from '@/components/ProjectCreateForm';
import { ThemeToggle } from '@/components/ThemeToggle';

async function getProjects() {
  return prisma.project.findMany({
    include: { agents: true, tasks: true, runs: true, snapshots: true, imports: true },
    orderBy: { createdAt: 'desc' },
  });
}

export default async function HomePage() {
  const [projects, health, githubStatus, recentRuns, recentLogs] = await Promise.all([
    getProjects(),
    getOpenClawHealth(),
    getGitHubStatus(),
    prisma.run.findMany({ orderBy: { createdAt: 'desc' }, take: 6, include: { project: true } }),
    prisma.activityLog.findMany({ orderBy: { timestamp: 'desc' }, take: 8, include: { project: true } }),
  ]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020202] text-white">
      <AmbientCanvas className="opacity-80" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1720px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        {/* Header with Theme Toggle */}
        <div className="flex justify-end">
          <ThemeToggle />
        </div>
        
        <section className="kanclaw-panel grid gap-8 overflow-hidden p-6 lg:grid-cols-[1.25fr_0.75fr] lg:p-10">
          <div className="relative rounded-[2.4rem] border border-white/6 bg-black/45 p-6">
            <div className="mb-10 flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-white/10 bg-black">
                <Image src="/kanclaw-logo-dark.png" alt="KanClaw" fill className="object-cover" sizes="48px" priority />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-zinc-500">Living Workspace OS</p>
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">KanClaw</h1>
              </div>
            </div>

            <div className="max-w-3xl space-y-5">
              <p className="text-base text-zinc-300 sm:text-lg">
                Un sistema operativo premium para proyectos de agentes IA: chat persistente con agentes, memoria viva, delegación visible, imports reales y filesystem grounded en tu máquina.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { icon: FolderKanban, label: 'Proyectos aislados', value: `${projects.length} activos` },
                  { icon: Workflow, label: 'Runs recientes', value: `${recentRuns.length} visibles` },
                  { icon: PlugZap, label: 'OpenClaw', value: health.connected ? 'Conectado' : 'Desconectado' },
                ].map((item) => (
                  <div key={item.label} className="rounded-[1.7rem] border border-white/8 bg-white/[0.03] p-4" data-testid={`home-metric-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                    <item.icon className="mb-4 h-5 w-5 text-zinc-200" />
                    <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{item.label}</p>
                    <p className="mt-2 text-lg font-medium">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                <span className="rounded-full border border-white/10 px-3 py-2">Pure black shell</span>
                <span className="rounded-full border border-white/10 px-3 py-2">Chat persistente con agentes</span>
                <span className="rounded-full border border-white/10 px-3 py-2">Cmd/Ctrl + K dentro del workspace</span>
              </div>
            </div>
          </div>

          <ProjectCreateForm />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="kanclaw-panel p-6 lg:p-8" data-testid="projects-dashboard-panel">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Workspaces</p>
                <h2 className="text-2xl font-semibold">Proyectos</h2>
              </div>
              <div className="rounded-full border border-white/10 px-3 py-2 text-xs text-zinc-500"><CommandIcon className="mr-2 inline h-3.5 w-3.5" />Cmd/Ctrl + K</div>
            </div>

            {projects.length === 0 ? (
              <div className="flex min-h-64 flex-col justify-center rounded-[1.8rem] border border-dashed border-white/10 bg-black/25 p-6" data-testid="empty-projects-state">
                <p className="text-xl font-medium">No hay proyectos todavía</p>
                <p className="mt-2 max-w-xl text-sm text-zinc-500">Crea el primer workspace para activar agentes persistentes, memoria y shell local-first.</p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {projects.map((project) => (
                  <Link key={project.id} href={`/project/${project.slug}`} className="group min-h-52 rounded-[1.9rem] border border-white/8 bg-white/[0.03] p-5 transition duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.06]" data-testid={`project-card-${project.slug}`}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-zinc-500">{project.slug}</span>
                      <span className="text-xs text-zinc-500">{project.agents.length} agentes</span>
                    </div>
                    <h3 className="mt-6 text-2xl font-semibold">{project.name}</h3>
                    <p className="mt-3 text-sm leading-6 text-zinc-400">{project.description || 'Sin descripción todavía.'}</p>
                    <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-4 text-sm text-zinc-500">
                      <span data-testid={`project-card-task-count-${project.slug}`}>{project.tasks.length} tareas · {project.runs.length} runs</span>
                      <span className="group-hover:text-zinc-100">Abrir workspace</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="kanclaw-panel flex flex-col gap-4 p-6" data-testid="home-connection-panel">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Signals</p>
              <h2 className="text-2xl font-semibold">OpenClaw, GitHub y actividad</h2>
            </div>
            <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4" data-testid="openclaw-connection-status">
              <p className={`text-sm font-medium ${health.connected ? 'text-emerald-300' : 'text-amber-300'}`}>{health.connected ? 'Conexión disponible' : 'Gateway desconectado'}</p>
              <p className="mt-2 text-sm text-zinc-500">{health.connected ? 'OpenClaw responde y puede alimentar el workspace.' : 'La UI mantiene un estado honesto y no simula actividad cuando el gateway está caído.'}</p>
            </div>
            <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4" data-testid="github-home-status">
              <div className="flex items-center gap-2 text-sm text-zinc-200"><Cable className="h-4 w-4" /> GitHub {githubStatus.connected ? `· ${githubStatus.username}` : '· no configurado'}</div>
              <p className="mt-2 text-sm text-zinc-500">Conecta repositorios para importarlos como proyecto nuevo o contexto vinculado.</p>
            </div>
            <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4" data-testid="home-recent-runs-panel">
              <div className="flex items-center gap-2 text-sm text-zinc-200"><MemoryStick className="h-4 w-4" /> Recent runs</div>
              <div className="mt-3 space-y-3">
                {recentRuns.map((run) => (
                  <article key={run.id} className="rounded-[1.2rem] border border-white/7 bg-black/35 p-3" data-testid={`home-run-${run.id}`}>
                    <p className="text-sm text-white">{run.title}</p>
                    <p className="mt-1 text-xs text-zinc-500">{run.project.name} · {run.status}</p>
                  </article>
                ))}
              </div>
            </div>
            <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4" data-testid="home-recent-activity-panel">
              <div className="flex items-center gap-2 text-sm text-zinc-200"><Workflow className="h-4 w-4" /> Recent activity</div>
              <div className="mt-3 space-y-3">
                {recentLogs.map((log) => (
                  <article key={log.id} className="rounded-[1.2rem] border border-white/7 bg-black/35 p-3" data-testid={`home-log-${log.id}`}>
                    <p className="text-sm text-white">{log.action}</p>
                    <p className="mt-1 text-xs text-zinc-500">{log.project.name} · {log.actor}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}