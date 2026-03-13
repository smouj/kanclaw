'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Cable, ChevronDown, ChevronRight, Command as CommandIcon, FolderKanban, MemoryStick, PlugZap, Workflow, Settings } from 'lucide-react';
import { AmbientCanvas } from '@/components/AmbientCanvas';
import { ProjectCreateForm } from '@/components/ProjectCreateForm';
import { ThemeToggle } from '@/components/ThemeToggle';
import { OpenClawConfig } from '@/components/OpenClawConfig';

// Collapsible Panel for Dashboard
function CollapsiblePanel({ title, defaultOpen = true, children, icon: Icon }: { title: string; defaultOpen?: boolean; children: React.ReactNode; icon?: React.ElementType }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-border bg-surface rounded">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-3 hover:bg-surface2 transition-colors">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-text-muted" />}
          <span className="text-sm font-medium">{title}</span>
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-3 pt-0">{children}</div>
      </div>
    </div>
  );
}

interface Project {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  agents: { id: string; name: string }[];
  tasks: { id: string }[];
  runs: { id: string }[];
}

interface HomePageClientProps {
  projects: Project[];
  health: { connected: boolean; status: number };
  githubStatus: { connected: boolean; username: string | null };
  recentRuns: { id: string; title: string; status: string; project: { name: string } }[];
  recentLogs: { id: string; action: string; project: { name: string }; actor: string }[];
}

export function HomePageClient({ projects, health, githubStatus, recentRuns, recentLogs }: HomePageClientProps) {
  const [showOpenClawConfig, setShowOpenClawConfig] = useState(false);

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-text-primary">
      <AmbientCanvas className="opacity-80" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1720px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <ThemeToggle />
          <button
            onClick={() => setShowOpenClawConfig(!showOpenClawConfig)}
            className="flex items-center gap-2 px-4 py-2 rounded border border-border bg-surface hover:bg-surface2 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">OpenClaw</span>
          </button>
        </div>

        {/* OpenClaw Config Modal */}
        {showOpenClawConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center theme-surface-soft backdrop-blur-sm">
            <div className="w-full max-w-md">
              <OpenClawConfig onSave={() => setShowOpenClawConfig(false)} />
              <button
                onClick={() => setShowOpenClawConfig(false)}
                className="mt-4 w-full text-center text-sm text-text-muted hover:text-text-primary"
              >
                Close
              </button>
            </div>
          </div>
        )}

        <section className="kanclaw-panel grid gap-8 overflow-hidden p-6 lg:grid-cols-[1.25fr_0.75fr] lg:p-10">
          <div className="relative rounded-[2.4rem] border theme-surface-soft p-6">
            <div className="mb-10 flex items-center gap-4">
              {/* Official Logo - Cat with mechanical arm (theme-aware) */}
              <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-white/15 bg-white/[0.02] shadow-lg">
                <Image
                  src="/kanclaw-logo-light.png"
                  alt="KanClaw official logo"
                  fill
                  sizes="64px"
                  className="object-contain p-1 theme-show-light"
                  priority
                />
                <Image
                  src="/kanclaw-logo-dark.png"
                  alt="KanClaw official logo"
                  fill
                  sizes="64px"
                  className="object-contain p-1 theme-show-dark"
                  priority
                />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-zinc-500">Living Workspace OS</p>
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">KanClaw</h1>
              </div>
            </div>

            <div className="max-w-3xl space-y-5">
              <p className="text-base text-zinc-300 sm:text-lg">
                Premium workspace OS for AI agent teams: persistent chat, memory hub, delegation, GitHub import, and VSCode-like file explorer.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { icon: FolderKanban, label: 'Projects', value: `${projects.length} active` },
                  { icon: Workflow, label: 'Recent Runs', value: `${recentRuns.length} visible` },
                  { icon: PlugZap, label: 'OpenClaw', value: health.connected ? 'Connected' : 'Disconnected' },
                ].map((item) => (
                  <div key={item.label} className="rounded-[1.7rem] border border-white/8 bg-white/[0.03] p-4">
                    <item.icon className="mb-4 h-5 w-5 text-zinc-200" />
                    <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{item.label}</p>
                    <p className="mt-2 text-lg font-medium">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <ProjectCreateForm />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="kanclaw-panel p-6 lg:p-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Workspaces</p>
                <h2 className="text-2xl font-semibold">Projects</h2>
              </div>
              <div className="rounded-full border border-white/10 px-3 py-2 text-xs text-zinc-500"><CommandIcon className="mr-2 inline h-3.5 w-3.5" />Cmd/Ctrl + K</div>
            </div>

            {projects.length === 0 ? (
              <div className="flex min-h-64 flex-col justify-center rounded-[1.8rem] border border-dashed border-white/10 theme-surface-soft p-6">
                <p className="text-xl font-medium">No projects yet</p>
                <p className="mt-2 max-w-xl text-sm text-zinc-500">Create your first workspace to activate persistent agents, memory, and local-first shell.</p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {projects.map((project) => (
                  <Link key={project.id} href={`/project/${project.slug}`} className="group min-h-52 rounded-[1.9rem] border border-white/8 bg-white/[0.03] p-5 transition duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.06]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-zinc-500">{project.slug}</span>
                      <span className="text-xs text-zinc-500">{project.agents.length} agents</span>
                    </div>
                    <h3 className="mt-6 text-2xl font-semibold">{project.name}</h3>
                    <p className="mt-3 text-sm leading-6 text-zinc-400">{project.description || 'No description yet.'}</p>
                    <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-4 text-sm text-zinc-500">
                      <span>{project.tasks.length} tasks · {project.runs.length} runs</span>
                      <span className="group-hover:text-zinc-100">Open workspace</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="kanclaw-panel flex flex-col gap-4 p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Signals</p>
              <h2 className="text-2xl font-semibold">OpenClaw, GitHub & Activity</h2>
            </div>
            <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4">
              <p className={`text-sm font-medium ${health.connected ? 'text-emerald-300' : 'text-amber-300'}`}>{health.connected ? 'Gateway available' : 'Gateway disconnected'}</p>
              <p className="mt-2 text-sm text-zinc-500">{health.connected ? 'OpenClaw responds and can power the workspace.' : 'UI maintains honest state when gateway is down.'}</p>
            </div>
            <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-sm text-zinc-200"><Cable className="h-4 w-4" /> GitHub {githubStatus.connected ? `· ${githubStatus.username}` : '· not configured'}</div>
              <p className="mt-2 text-sm text-zinc-500">Connect repos to import as new project or linked context.</p>
            </div>
            <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-sm text-zinc-200"><MemoryStick className="h-4 w-4" /> Recent runs</div>
              <div className="mt-3 space-y-3">
                {recentRuns.map((run) => (
                  <article key={run.id} className="rounded-[1.2rem] border theme-surface-soft p-3">
                    <p className="text-sm theme-text-strong">{run.title}</p>
                    <p className="mt-1 text-xs text-zinc-500">{run.project.name} · {run.status}</p>
                  </article>
                ))}
              </div>
            </div>
            <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-sm text-zinc-200"><Workflow className="h-4 w-4" /> Recent activity</div>
              <div className="mt-3 space-y-3">
                {recentLogs.map((log) => (
                  <article key={log.id} className="rounded-[1.2rem] border theme-surface-soft p-3">
                    <p className="text-sm theme-text-strong">{log.action}</p>
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
