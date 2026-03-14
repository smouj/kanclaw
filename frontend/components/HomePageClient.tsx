'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  Cable,
  Command as CommandIcon,
  ExternalLink,
  FolderKanban,
  MemoryStick,
  PlugZap,
  Settings,
  Workflow,
} from 'lucide-react';
import { AmbientCanvas } from '@/components/AmbientCanvas';
import { OpenClawConfig } from '@/components/OpenClawConfig';
import { ProjectCreateForm } from '@/components/ProjectCreateForm';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';

interface Project {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  agents: { id: string; name: string }[];
  tasks: { id: string }[];
  runs: { id: string }[];
}

interface WorkspaceInfo {
  openclawWorkspaceRoot: string;
  openclawWorkspaceDetected: boolean;
  kanclawProjectsRoot: string;
  projectFolders: string[];
}

interface HomePageClientProps {
  projects: Project[];
  health: { connected: boolean; status: number };
  githubStatus: { connected: boolean; username: string | null };
  recentRuns: { id: string; title: string; status: string; project: { name: string } }[];
  recentLogs: { id: string; action: string; project: { name: string }; actor: string }[];
  openclawConfig: { httpBase: string; wsBase: string; hasToken: boolean };
  workspaceInfo: WorkspaceInfo;
}

export function HomePageClient({
  projects,
  health,
  githubStatus,
  recentRuns,
  recentLogs,
  openclawConfig,
  workspaceInfo,
}: HomePageClientProps) {
  const [showOpenClawConfig, setShowOpenClawConfig] = useState(false);

  const workspaceFoldersPreview = useMemo(() => workspaceInfo.projectFolders.slice(0, 6), [workspaceInfo.projectFolders]);

  return (
    <main className="relative min-h-screen bg-background text-text-primary">
      <AmbientCanvas className="opacity-65" />

      <div className="relative z-10 mx-auto w-full max-w-[1720px] px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LanguageSelector />
            </div>
            <div className="flex items-center gap-2">
              <a
                href="http://76.13.37.123:18789/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded border border-border bg-surface px-4 py-2 transition-colors hover:bg-surface2"
                title="Abrir OpenClaw del VPS"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="text-sm">OpenClaw</span>
              </a>
              <button
                onClick={() => setShowOpenClawConfig((prev) => !prev)}
                className="flex items-center gap-2 rounded border border-border bg-surface px-4 py-2 transition-colors hover:bg-surface2"
              >
                <Settings className="h-4 w-4" />
                <span className="text-sm">Config</span>
              </button>
            </div>
          </div>

          {/* OpenClaw Config Modal */}
          {showOpenClawConfig && (
            <div className="fixed inset-0 z-50 flex items-center justify-center theme-surface-soft backdrop-blur-sm">
              <div className="w-full max-w-md px-4">
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

          {/* Hero + Create */}
          <section className="kanclaw-panel grid gap-6 p-5 lg:grid-cols-[1.08fr_0.92fr] lg:p-6">
            <div className="relative rounded-[2.4rem] border theme-surface-soft p-6">
              <div className="mb-8 flex items-center gap-4">
                <div className="relative h-20 w-20 flex items-center justify-center">
                  <Image
                    src="/logo-white.png"
                    alt="KanClaw Logo"
                    width={64}
                    height={64}
                    className="w-16 h-16 object-contain"
                    priority
                  />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.32em]" style={{ color: 'var(--kc-text-muted)' }}>Living Workspace OS</p>
                  <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">KanClaw</h1>
                </div>
              </div>

              <div className="max-w-3xl space-y-5">
                <p className="text-base text-zinc-300 sm:text-lg">
                  Workspace operativo para equipos de agentes IA: chat persistente, memoria, delegación y filesystem local-first.
                </p>

                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { icon: FolderKanban, label: 'Projects', value: `${projects.length} activos` },
                    { icon: Workflow, label: 'Workspace folders', value: `${workspaceInfo.projectFolders.length} detectados` },
                    { icon: PlugZap, label: 'OpenClaw', value: health.connected ? 'Conectado' : 'Desconectado' },
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

          {/* Main dashboard row */}
          <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            {/* Projects panel */}
            <div className="kanclaw-panel p-5 lg:p-6">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Workspaces</p>
                  <h2 className="text-2xl font-semibold">Projects</h2>
                </div>
                <div className="rounded-full border border-white/10 px-3 py-2 text-xs text-zinc-500">
                  <CommandIcon className="mr-2 inline h-3.5 w-3.5" />Cmd/Ctrl + K
                </div>
              </div>

              {projects.length === 0 ? (
                <div className="flex min-h-64 flex-col justify-center rounded-[1.8rem] border border-dashed border-white/10 theme-surface-soft p-6">
                  <p className="text-xl font-medium">No projects yet</p>
                  <p className="mt-2 max-w-xl text-sm text-zinc-500">
                    Crea tu primer workspace para activar memoria persistente, agentes y shell local-first.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/project/${project.slug}`}
                      className="group min-h-52 rounded-[1.9rem] border border-white/8 bg-white/[0.03] p-5 transition duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.06]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                          {project.slug}
                        </span>
                        <span className="text-xs text-zinc-500">{project.agents.length} agents</span>
                      </div>
                      <h3 className="mt-6 text-2xl font-semibold">{project.name}</h3>
                      <p className="mt-3 text-sm leading-6 text-zinc-400">{project.description || 'No description yet.'}</p>
                      <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-4 text-sm text-zinc-500">
                        <span>
                          {project.tasks.length} tasks · {project.runs.length} runs
                        </span>
                        <span className="group-hover:text-zinc-100">Open workspace</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Signals panel */}
            <div className="kanclaw-panel p-5 lg:p-6">
              <div className="mb-4">
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Signals</p>
                <h2 className="text-2xl font-semibold">OpenClaw, paths & activity</h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4">
                  <p className={`text-sm font-medium ${health.connected ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {health.connected ? 'Gateway disponible' : `Gateway desconectado (${health.status})`}
                  </p>
                  <p className="mt-2 break-all text-xs text-zinc-500">HTTP: {openclawConfig.httpBase || '(no configurado)'}</p>
                  <p className="mt-1 break-all text-xs text-zinc-500">WS: {openclawConfig.wsBase || '(no configurado)'}</p>
                  {!openclawConfig.hasToken ? (
                    <p className="mt-1 text-xs text-amber-300">Sin bearer token (si tu gateway lo exige, configúralo).</p>
                  ) : null}
                </div>

                <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 text-sm text-zinc-200">
                    <Cable className="h-4 w-4" /> GitHub {githubStatus.connected ? `· ${githubStatus.username}` : '· not configured'}
                  </div>
                  <p className="mt-2 text-sm text-zinc-500">Connect repos to import as new project or linked context.</p>
                </div>

                <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4 sm:col-span-2 xl:col-span-1 2xl:col-span-2">
                  <div className="mb-2 flex items-center gap-2 text-sm text-zinc-200">
                    <FolderKanban className="h-4 w-4" /> Workspace roots detectados
                  </div>
                  <p className="break-all text-xs text-zinc-400">OpenClaw: {workspaceInfo.openclawWorkspaceRoot}</p>
                  <p className="mt-1 break-all text-xs text-zinc-400">Projects: {workspaceInfo.kanclawProjectsRoot}</p>
                  <p className={`mt-2 text-xs ${workspaceInfo.openclawWorkspaceDetected ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {workspaceInfo.openclawWorkspaceDetected ? 'OpenClaw workspace detectado' : 'OpenClaw workspace no detectado'}
                  </p>
                  {workspaceFoldersPreview.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {workspaceFoldersPreview.map((folder) => (
                        <span key={folder} className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-zinc-400">
                          {folder}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-zinc-500">No hay carpetas de proyecto detectadas.</p>
                  )}
                </div>

                <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 text-sm text-zinc-200">
                    <MemoryStick className="h-4 w-4" /> Recent runs
                  </div>
                  <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
                    {recentRuns.length === 0 ? (
                      <p className="text-xs text-zinc-500">Sin runs recientes.</p>
                    ) : (
                      recentRuns.map((run) => (
                        <article key={run.id} className="rounded-[1.2rem] border theme-surface-soft p-3">
                          <p className="text-sm theme-text-strong">{run.title}</p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {run.project.name} · {run.status}
                          </p>
                        </article>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 text-sm text-zinc-200">
                    <Workflow className="h-4 w-4" /> Recent activity
                  </div>
                  <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
                    {recentLogs.length === 0 ? (
                      <p className="text-xs text-zinc-500">Sin actividad reciente.</p>
                    ) : (
                      recentLogs.map((log) => (
                        <article key={log.id} className="rounded-[1.2rem] border theme-surface-soft p-3">
                          <p className="text-sm theme-text-strong">{log.action}</p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {log.project.name} · {log.actor}
                          </p>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
