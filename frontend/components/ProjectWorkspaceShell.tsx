'use client';

import { useMemo, useState } from 'react';
import { Bot, BrainCircuit, Cable, Command as CommandIcon, FolderTree, LayoutGrid, MessageSquareText, RefreshCcw, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Agent, Project, Task } from '@prisma/client';
import { AgentChatSurface } from '@/components/AgentChatSurface';
import { AmbientCanvas } from '@/components/AmbientCanvas';
import { CommandPalette, type CommandItem } from '@/components/CommandPalette';
import { FileExplorer } from '@/components/FileExplorer';
import { GitHubConnectorPanel } from '@/components/GitHubConnectorPanel';
import { KanbanBoard } from '@/components/KanbanBoard';
import { ProjectMemoryHub } from '@/components/ProjectMemoryHub';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type ViewKey = 'overview' | 'chat' | 'board' | 'memory' | 'files' | 'connectors';

interface ProjectWorkspaceShellProps {
  project: Project & { agents: Agent[]; tasks: Task[] };
  health: { connected: boolean; status: number; agents: unknown[] };
  githubStatus: { connected: boolean; mode: string; username: string | null };
  files: WorkspaceNodePreview[];
  model: {
    projectMemory: string;
    knowledge: Array<{ name: string; path: string; updatedAt: string }>;
    decisions: Array<{ name: string; path: string; updatedAt: string }>;
    artifacts: Array<{ name: string; path: string; updatedAt: string }>;
    runs: Array<{ id: string; title: string; status: string; createdAt: string | Date }>;
    logs: Array<{ id: string; actor: string; action: string; timestamp: string | Date; details?: unknown }>;
    delegations: Array<{ id: string; actor: string; action: string; timestamp: string | Date; details?: unknown }>;
    agentSurfaces: Array<{ id: string; name: string; role: string; status: string; soul: string; tools: string; memory: string }>;
    snapshots: Array<{ id: string; title: string; summary: string; createdAt: string | Date }>;
    imports: Array<{ id: string; provider: string; label: string; status: string; summary?: string | null }>;
    threads: Array<{ id: string; title: string; scope: string; agentId: string | null; agent?: { name: string } | null; messages: Array<{ id: string; role: string; actor: string; content: string; targetAgentName: string | null; createdAt: string | Date; metadata?: unknown }> }>;
  };
}

interface WorkspaceNodePreview {
  name: string;
  path: string;
  kind: 'directory' | 'file';
  editable?: boolean;
  children?: WorkspaceNodePreview[];
}

const viewMeta: Array<{ key: ViewKey; label: string; icon: typeof LayoutGrid }> = [
  { key: 'overview', label: 'Overview', icon: LayoutGrid },
  { key: 'chat', label: 'Chat', icon: MessageSquareText },
  { key: 'board', label: 'Board', icon: FolderTree },
  { key: 'memory', label: 'Memory', icon: BrainCircuit },
  { key: 'files', label: 'Files', icon: FolderTree },
  { key: 'connectors', label: 'Connectors', icon: Cable },
];

export function ProjectWorkspaceShell({ project, health, githubStatus, files, model }: ProjectWorkspaceShellProps) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<ViewKey>('chat');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState(model.threads[0]?.id || '');
  const [preferredTargetAgent, setPreferredTargetAgent] = useState(model.threads[0]?.agent?.name || project.agents[0]?.name || '');
  const [agentName, setAgentName] = useState('');
  const [agentRole, setAgentRole] = useState('');
  const [decision, setDecision] = useState('');
  const [knowledgePath, setKnowledgePath] = useState('knowledge/notes.md');
  const [knowledgeContent, setKnowledgeContent] = useState('');
  const [busy, setBusy] = useState(false);

  const teamThreadId = model.threads.find((thread) => thread.scope === 'TEAM')?.id || model.threads[0]?.id || '';

  async function createSnapshot() {
    setBusy(true);
    const response = await fetch('/api/snapshots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectSlug: project.slug, title: `Snapshot · ${project.name}` }),
    });
    setBusy(false);
    if (!response.ok) {
      toast.error('No se pudo crear el snapshot.');
      return;
    }
    toast.success('Snapshot creado.');
    router.refresh();
  }

  async function createAgent() {
    if (!agentName.trim()) return;
    setBusy(true);
    const response = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectSlug: project.slug, name: agentName, role: agentRole }),
    });
    setBusy(false);
    if (!response.ok) {
      toast.error('No se pudo crear el agente.');
      return;
    }
    setAgentName('');
    setAgentRole('');
    toast.success('Agente creado.');
    router.refresh();
  }

  async function appendToFile(path: string, content: string) {
    const existingResponse = await fetch(`/api/files?projectSlug=${project.slug}&path=${encodeURIComponent(path)}`);
    const existing = existingResponse.ok ? ((await existingResponse.json()).content as string) : '';
    const response = await fetch('/api/files', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectSlug: project.slug, path, content: `${existing}${content}` }),
    });
    return response.ok;
  }

  async function appendDecision() {
    if (!decision.trim()) return;
    setBusy(true);
    const ok = await appendToFile('decisions/decision-log.md', `\n- ${decision}`);
    setBusy(false);
    if (!ok) {
      toast.error('No se pudo guardar la decisión.');
      return;
    }
    setDecision('');
    toast.success('Decisión añadida.');
    router.refresh();
  }

  async function appendKnowledge() {
    if (!knowledgePath.trim() || !knowledgeContent.trim()) return;
    setBusy(true);
    const ok = await appendToFile(knowledgePath, `\n${knowledgeContent}\n`);
    setBusy(false);
    if (!ok) {
      toast.error('No se pudo guardar el conocimiento.');
      return;
    }
    setKnowledgeContent('');
    toast.success('Knowledge actualizado.');
    router.refresh();
  }

  const commands = useMemo<CommandItem[]>(() => [
    { id: 'overview', label: 'Abrir overview del proyecto', hint: 'Project OS summary', onSelect: () => setActiveView('overview') },
    { id: 'chat-team', label: 'Hablar con el team room', hint: 'Chat compartido', onSelect: () => { setActiveView('chat'); setSelectedThreadId(teamThreadId); setPreferredTargetAgent(project.agents[0]?.name || ''); } },
    { id: 'board', label: 'Abrir tablero Kanban', hint: 'Tareas y delegación', onSelect: () => setActiveView('board') },
    { id: 'memory', label: 'Abrir Memory Hub', hint: 'Knowledge, decisions, runs', onSelect: () => setActiveView('memory') },
    { id: 'files', label: 'Abrir filesystem', hint: 'Workspace real en disco', onSelect: () => setActiveView('files') },
    { id: 'connectors', label: 'Abrir connectors', hint: 'GitHub y local folder', onSelect: () => setActiveView('connectors') },
    { id: 'snapshot', label: 'Crear snapshot', hint: 'Estado exportable', onSelect: () => void createSnapshot() },
    { id: 'reconnect-openclaw', label: 'Refrescar OpenClaw', hint: 'Releer shell', onSelect: () => router.refresh() },
    ...project.agents.map((agent) => ({
      id: `agent-${agent.id}`,
      label: `Hablar con ${agent.name}`,
      hint: agent.role || 'Agente del proyecto',
      onSelect: () => {
        const thread = model.threads.find((item) => item.agentId === agent.id);
        setActiveView('chat');
        setSelectedThreadId(thread?.id || teamThreadId);
        setPreferredTargetAgent(agent.name);
      },
    })),
  ], [model.threads, project.agents, router, teamThreadId]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020202] text-white">
      <AmbientCanvas className="opacity-70" />
      <CommandPalette open={paletteOpen} setOpen={setPaletteOpen} items={commands} />

      <div className="relative z-10 mx-auto grid min-h-screen max-w-[1880px] gap-4 p-4 xl:grid-cols-[280px_minmax(0,1fr)_360px] xl:p-5">
        <aside className="kanclaw-panel flex flex-col gap-5 p-5" data-testid="project-os-left-rail">
          <div>
            <p className="text-[11px] uppercase tracking-[0.34em] text-zinc-500">KanClaw Project OS</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight" data-testid="project-shell-title">{project.name}</h1>
            <p className="mt-3 text-sm leading-7 text-zinc-500">{project.description || 'Un sistema operativo vivo para este proyecto.'}</p>
          </div>

          <div className="grid gap-2">
            {viewMeta.map((item) => (
              <button key={item.key} type="button" onClick={() => setActiveView(item.key)} className={`flex items-center gap-3 rounded-[1.2rem] px-4 py-3 text-sm transition ${activeView === item.key ? 'bg-white text-black' : 'bg-white/[0.025] text-zinc-400 hover:bg-white/[0.05] hover:text-white'}`} data-testid={`workspace-nav-${item.key}`}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>

          <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Signals</p>
            <div className="mt-4 space-y-3 text-sm">
              <SignalRow label="OpenClaw" value={health.connected ? 'Online' : 'Disconnected'} />
              <SignalRow label="GitHub" value={githubStatus.connected ? `Connected · ${githubStatus.username}` : 'Not configured'} />
              <SignalRow label="Agents" value={String(project.agents.length)} />
              <SignalRow label="Runs" value={String(model.runs.length)} />
              <SignalRow label="Imports" value={String(model.imports.length)} />
            </div>
          </div>

          <button type="button" onClick={() => setPaletteOpen(true)} className="mt-auto flex items-center justify-between rounded-[1.4rem] border border-white/8 bg-white/[0.025] px-4 py-3 text-sm text-zinc-400 hover:border-white/15 hover:text-white" data-testid="open-command-palette-button">
            <span className="flex items-center gap-2"><CommandIcon className="h-4 w-4" /> Command Palette</span>
            <span className="text-xs">⌘K / Ctrl K</span>
          </button>
        </aside>

        <main className="kanclaw-panel flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden" data-testid="project-os-main-panel">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/6 px-5 py-5">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-zinc-500">{activeView}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">{activeView === 'chat' ? 'Shared Agent Conversation Layer' : activeView === 'memory' ? 'Persistent Project Memory Hub' : activeView === 'connectors' ? 'Connector & Import Layer' : 'Project Workspace'}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" onClick={() => router.refresh()} data-testid="workspace-refresh-button"><RefreshCcw className="mr-2 h-4 w-4" />Refrescar</Button>
              <Button type="button" onClick={() => void createSnapshot()} disabled={busy} data-testid="workspace-create-snapshot-button"><Sparkles className="mr-2 h-4 w-4" />Snapshot</Button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {activeView === 'overview' ? (
              <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                <section className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    {[
                      ['Chat threads', String(model.threads.length)],
                      ['Delegations', String(model.delegations.length)],
                      ['Snapshots', String(model.snapshots.length)],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="rounded-[1.7rem] border border-white/8 bg-white/[0.025] p-5" data-testid={`overview-card-${String(label).toLowerCase().replace(/\s+/g, '-')}`}>
                        <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{label}</p>
                        <p className="mt-3 text-3xl font-semibold">{value}</p>
                      </div>
                    ))}
                  </div>

                  <section className="rounded-[1.8rem] border border-white/8 bg-white/[0.025] p-5">
                    <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Recent runs</p>
                    <div className="mt-4 space-y-3">
                      {model.runs.slice(0, 6).map((run) => (
                        <article key={run.id} className="rounded-[1.3rem] border border-white/7 bg-black/35 p-4" data-testid={`overview-run-${run.id}`}>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-white">{run.title}</p>
                            <span className="text-xs text-zinc-500">{run.status}</span>
                          </div>
                          <p className="mt-2 text-xs text-zinc-500">{new Date(run.createdAt).toLocaleString('es-ES')}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                </section>

                <section className="rounded-[1.8rem] border border-white/8 bg-white/[0.025] p-5">
                  <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Recent activity</p>
                  <div className="mt-4 space-y-3">
                    {model.logs.slice(0, 8).map((log) => (
                      <article key={log.id} className="rounded-[1.3rem] border border-white/7 bg-black/35 p-4" data-testid={`overview-log-${log.id}`}>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-white">{log.action}</p>
                          <time className="text-xs text-zinc-500">{new Date(log.timestamp).toLocaleString('es-ES')}</time>
                        </div>
                        <p className="mt-2 text-xs text-zinc-500">{log.actor}</p>
                      </article>
                    ))}
                  </div>
                </section>
              </div>
            ) : null}

            {activeView === 'chat' ? <AgentChatSurface projectSlug={project.slug} agents={project.agents} initialThreads={model.threads} openClawConnected={health.connected} selectedThreadIdExternal={selectedThreadId} preferredTargetAgentExternal={preferredTargetAgent} onThreadChange={setSelectedThreadId} /> : null}
            {activeView === 'board' ? <KanbanBoard projectSlug={project.slug} initialTasks={project.tasks} agents={project.agents} /> : null}
            {activeView === 'memory' ? <ProjectMemoryHub {...model} /> : null}
            {activeView === 'files' ? <FileExplorer projectSlug={project.slug} initialTree={files} /> : null}
            {activeView === 'connectors' ? <GitHubConnectorPanel initialStatus={githubStatus} projectSlug={project.slug} /> : null}
          </div>
        </main>

        <aside className="kanclaw-panel flex min-h-[calc(100vh-2rem)] flex-col gap-4 overflow-y-auto p-5" data-testid="project-os-right-rail">
          <section className="rounded-[1.7rem] border border-white/8 bg-white/[0.025] p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Quick Ops</p>
            <div className="mt-4 space-y-3">
              <Input value={agentName} onChange={(event) => setAgentName(event.target.value)} placeholder="Nombre del agente" data-testid="quick-create-agent-name-input" />
              <Input value={agentRole} onChange={(event) => setAgentRole(event.target.value)} placeholder="Rol del agente" data-testid="quick-create-agent-role-input" />
              <Button type="button" variant="outline" onClick={() => void createAgent()} disabled={busy || !agentName} data-testid="quick-create-agent-button"><Bot className="mr-2 h-4 w-4" />Crear agente</Button>
              <Textarea value={decision} onChange={(event) => setDecision(event.target.value)} rows={3} placeholder="Append decision..." data-testid="quick-decision-textarea" />
              <Button type="button" variant="outline" onClick={() => void appendDecision()} disabled={busy || !decision} data-testid="quick-append-decision-button">Guardar decisión</Button>
              <Input value={knowledgePath} onChange={(event) => setKnowledgePath(event.target.value)} data-testid="quick-knowledge-path-input" />
              <Textarea value={knowledgeContent} onChange={(event) => setKnowledgeContent(event.target.value)} rows={4} placeholder="Append knowledge..." data-testid="quick-knowledge-textarea" />
              <Button type="button" variant="outline" onClick={() => void appendKnowledge()} disabled={busy || !knowledgeContent} data-testid="quick-append-knowledge-button">Guardar knowledge</Button>
            </div>
          </section>

          <section className="rounded-[1.7rem] border border-white/8 bg-white/[0.025] p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Agents</p>
            <div className="mt-4 space-y-3">
              {model.agentSurfaces.map((agent) => (
                <article key={agent.id} className="rounded-[1.3rem] border border-white/7 bg-black/35 p-4" data-testid={`right-rail-agent-${agent.name.toLowerCase()}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">{agent.name}</p>
                    <span className="text-xs text-zinc-500">{agent.status}</span>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">{agent.role || 'Sin rol'}</p>
                  <p className="mt-3 text-xs leading-6 text-zinc-400">{agent.memory.slice(0, 180) || 'Sin memoria todavía.'}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[1.7rem] border border-white/8 bg-white/[0.025] p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Snapshots & Imports</p>
            <div className="mt-4 space-y-3">
              {model.snapshots.slice(0, 4).map((snapshot) => (
                <article key={snapshot.id} className="rounded-[1.3rem] border border-white/7 bg-black/35 p-4" data-testid={`snapshot-card-${snapshot.id}`}>
                  <p className="text-sm font-medium text-white">{snapshot.title}</p>
                  <p className="mt-2 text-xs leading-5 text-zinc-500">{snapshot.summary}</p>
                </article>
              ))}
              {model.imports.map((item) => (
                <article key={item.id} className="rounded-[1.3rem] border border-white/7 bg-black/35 p-4" data-testid={`import-card-${item.id}`}>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="mt-2 text-xs leading-5 text-zinc-500">{item.provider} · {item.status}</p>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function SignalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right text-zinc-200">{value}</span>
    </div>
  );
}