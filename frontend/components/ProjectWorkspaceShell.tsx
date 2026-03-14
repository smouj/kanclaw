'use client';

import { useCallback, useMemo, useState } from 'react';
import { ArrowLeft, Bot, BrainCircuit, Cable, Camera, CheckCircle2, ChevronDown, ChevronRight, Command as CommandIcon, FolderTree, LayoutGrid, MessageSquare, MessageSquareText, RefreshCcw, Sparkles, Zap } from 'lucide-react';
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
import { ThemeToggle } from '@/components/ThemeToggle';

type ViewKey = 'overview' | 'chat' | 'board' | 'memory' | 'files' | 'connectors';

interface ProjectWorkspaceShellProps {
  project: Project & { agents: Agent[]; tasks: Task[] };
  health: { connected: boolean; status: number; agents: unknown[] };
  githubStatus: { connected: boolean; mode: string; username: string | null };
  files: WorkspaceNodePreview[];
  model: {
    project: {
      tasks: Array<any>;
    };
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

function SignalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-muted">{label}</span>
      <span className="text-text-primary font-medium">{value}</span>
    </div>
  );
}

// Collapsible Panel Component
function CollapsiblePanel({ 
  title, 
  defaultOpen = true, 
  children,
  icon: Icon 
}: { 
  title: string; 
  defaultOpen?: boolean; 
  children: React.ReactNode;
  icon?: React.ElementType;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border border-border bg-surface rounded overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 hover:bg-surface2 transition-colors"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-text-muted" />}
          <span className="text-sm font-medium">{title}</span>
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-3 pt-0">
          {children}
        </div>
      </div>
    </div>
  );
}

// Tab Button with Animation
function AnimatedTab({ 
  active, 
  onClick, 
  icon: Icon, 
  label 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ElementType; 
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm transition-all duration-200 border-b-2 ${
        active 
          ? 'border-accent-green text-text-primary bg-surface' 
          : 'border-transparent text-text-muted hover:text-text-primary hover:bg-surface2'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

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
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  const teamThreadId = model.threads.find((thread) => thread.scope === 'TEAM')?.id || model.threads[0]?.id || '';

  const createSnapshot = useCallback(async () => {
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
  }, [project.name, project.slug, router]);

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
  ], [createSnapshot, model.threads, project.agents, router, teamThreadId]);

  return (
    <div className="relative h-screen overflow-hidden bg-background text-text-primary">
      <AmbientCanvas className="opacity-28" />
      <CommandPalette open={paletteOpen} setOpen={setPaletteOpen} items={commands} />

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between h-14 px-4 border-b border-border bg-surface/90 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="flex items-center justify-center w-8 h-8 rounded border border-border bg-surface2 hover:bg-surface transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-semibold leading-tight">{project.name}</h1>
            <p className="text-xs text-text-muted">{project.description || 'Project workspace'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            className="flex items-center justify-center w-8 h-8 rounded border border-border bg-surface2 hover:bg-surface transition-colors"
            title="Toggle sidebar"
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${leftSidebarOpen ? 'rotate-180' : ''}`} />
          </button>
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={() => router.refresh()}>
            <RefreshCcw className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button size="sm" onClick={() => void createSnapshot()} disabled={busy}>
            <Sparkles className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Snapshot</span>
          </Button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="relative z-10 flex h-[calc(100vh-3.5rem)]">
        {/* Left Sidebar */}
        <aside 
          className={`flex flex-col border-r border-border bg-surface/90 backdrop-blur transition-all duration-300 ${
            leftSidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
          }`}
        >
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Navigation Tabs */}
            <nav className="space-y-1">
              {viewMeta.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveView(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded transition-all duration-200 ${
                    activeView === item.key 
                      ? 'bg-accent-green/10 text-accent-green border-l-2 border-accent-green' 
                      : 'text-text-muted hover:text-text-primary hover:bg-surface2'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Agents Section */}
            <CollapsiblePanel title="Agents" icon={Bot} defaultOpen={true}>
              <div className="space-y-2">
                {project.agents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => {
                      const thread = model.threads.find((t) => t.agentId === agent.id);
                      setActiveView('chat');
                      setSelectedThreadId(thread?.id || teamThreadId);
                      setPreferredTargetAgent(agent.name);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-surface2 transition-colors"
                  >
                    <Bot className="w-3 h-3" />
                    {agent.name}
                  </button>
                ))}
                <div className="pt-2 border-t border-border">
                  <Input
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="New agent name..."
                    className="h-8 text-xs"
                  />
                  <Button size="sm" onClick={createAgent} disabled={busy || !agentName} className="w-full mt-2 h-8">
                    Add Agent
                  </Button>
                </div>
              </div>
            </CollapsiblePanel>

            {/* Signals */}
            <CollapsiblePanel title="Signals" icon={BrainCircuit} defaultOpen={true}>
              <div className="space-y-2 text-xs">
                <SignalRow label="OpenClaw" value={health.connected ? 'Online' : 'Offline'} />
                <SignalRow label="GitHub" value={githubStatus.connected ? 'Connected' : 'Not set'} />
                <SignalRow label="Agents" value={String(project.agents.length)} />
                <SignalRow label="Runs" value={String(model.runs.length)} />
              </div>
            </CollapsiblePanel>
          </div>

          {/* Command Palette Button */}
          <button 
            onClick={() => setPaletteOpen(true)}
            className="m-3 p-3 flex items-center justify-between rounded border border-border bg-surface2 hover:bg-surface transition-colors text-xs"
          >
            <span className="flex items-center gap-2">
              <CommandIcon className="w-4 h-4" />
              Command
            </span>
            <kbd className="px-1.5 py-0.5 rounded bg-surface text-text-muted">⌘K</kbd>
          </button>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Tab Bar */}
          <div className="flex border-b border-border bg-surface/50">
            {viewMeta.map((item) => (
              <AnimatedTab
                key={item.key}
                active={activeView === item.key}
                onClick={() => setActiveView(item.key)}
                icon={item.icon}
                label={item.label}
              />
            ))}
          </div>

          {/* Content Panel */}
          <div className="flex-1 overflow-hidden p-4">
            <div className="h-full overflow-y-auto rounded border border-border bg-surface/50">
              {activeView === 'overview' && (
                <div className="p-6 space-y-6">
                  {/* Main Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Conversaciones', value: model.threads.length, icon: MessageSquare, color: 'blue' },
                      { label: 'Tareas', value: model.project.tasks.length, icon: CheckCircle2, color: 'emerald' },
                      { label: 'Ejecuciones', value: model.runs.length, icon: Zap, color: 'amber' },
                      { label: 'Snapshots', value: model.snapshots.length, icon: Camera, color: 'purple' },
                    ].map((stat) => (
                      <div key={stat.label} className={`p-5 rounded-xl border bg-surface border-border`}>
                        <div className="flex items-center justify-between">
                          {stat.icon && <stat.icon className="h-5 w-5" />}
                          <span className={`text-xs uppercase tracking-wider text-${stat.color}-500`}>{stat.label}</span>
                        </div>
                        <p className="mt-3 text-3xl font-bold">{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Agents Status */}
                  <div className="rounded-xl border border-border bg-surface p-5">
                    <h3 className="text-sm font-medium mb-4">Agentes del proyecto</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {project.agents.map((agent) => (
                        <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg bg-surface2 border border-border">
                          <div className="flex items-center gap-3">
                            <div className="h-3 w-3 rounded-full bg-emerald-500" />
                            <span className="text-sm font-medium">{agent.name}</span>
                          </div>
                          <span className="text-xs text-zinc-500">{agent.role || 'Sin rol'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-border bg-surface p-5">
                      <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">Delegaciones</h3>
                      <p className="text-2xl font-bold">{model.delegations.length}</p>
                      {model.delegations.slice(0, 2).map((d) => (
                        <p key={d.id} className="mt-2 text-xs text-zinc-500 truncate">{d.action}</p>
                      ))}
                    </div>
                    <div className="rounded-xl border border-border bg-surface p-5">
                      <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">Importaciones</h3>
                      <p className="text-2xl font-bold">{model.imports.length}</p>
                      {model.imports.slice(0, 2).map((imp) => (
                        <p key={imp.id} className="mt-2 text-xs text-zinc-500 truncate">{imp.provider}: {imp.label}</p>
                      ))}
                    </div>
                    <div className="rounded-xl border border-border bg-surface p-5">
                      <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">Memoria</h3>
                      <p className="text-2xl font-bold">{model.projectMemory.length > 0 ? 'Activa' : 'Vacía'}</p>
                      <p className="mt-2 text-xs text-zinc-500">{model.knowledge.length} archivos de conocimiento</p>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="rounded-xl border border-border bg-surface p-5">
                    <h3 className="text-sm font-medium mb-4">Actividad reciente</h3>
                    <div className="space-y-2">
                      {model.logs.length === 0 ? (
                        <p className="text-sm text-zinc-500">Sin actividad registrada</p>
                      ) : (
                        model.logs.slice(0, 8).map((log) => (
                          <div key={log.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-zinc-500">{log.actor}</span>
                              <span className="text-sm">{log.action}</span>
                            </div>
                            <span className="text-xs text-zinc-600">
                              {new Date(log.timestamp).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeView === 'chat' && (
                <AgentChatSurface
                  projectSlug={project.slug}
                  agents={project.agents}
                  initialThreads={model.threads}
                  openClawConnected={health.connected}
                  preferredTargetAgentExternal={preferredTargetAgent}
                  selectedThreadIdExternal={selectedThreadId}
                />
              )}

              {activeView === 'board' && (
                <KanbanBoard projectSlug={project.slug} initialTasks={model.project.tasks} agents={project.agents} />
              )}

              {activeView === 'memory' && (
                <ProjectMemoryHub
                  projectMemory={model.projectMemory}
                  knowledge={model.knowledge}
                  decisions={model.decisions}
                  artifacts={model.artifacts}
                  runs={model.runs}
                  snapshots={model.snapshots}
                  delegations={model.delegations}
                  agentSurfaces={model.agentSurfaces}
                  imports={model.imports}
                />
              )}

              {activeView === 'files' && (
                <FileExplorer projectSlug={project.slug} initialTree={files} />
              )}

              {activeView === 'connectors' && (
                <GitHubConnectorPanel initialStatus={githubStatus} projectSlug={project.slug} />
              )}
            </div>
          </div>
        </main>

        {/* Right Panel - Collapsible */}
        <aside 
          className={`flex flex-col border-l border-border bg-surface/90 backdrop-blur transition-all duration-300 ${
            rightPanelOpen ? 'w-72' : 'w-0 overflow-hidden'
          }`}
        >
          <div className="p-3 border-b border-border">
            <button
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              className="flex items-center justify-between w-full"
            >
              <span className="text-sm font-medium">Quick Actions</span>
              <ChevronRight className={`w-4 h-4 transition-transform ${rightPanelOpen ? '' : '-rotate-180'}`} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <CollapsiblePanel title="Add Decision" icon={BrainCircuit} defaultOpen={false}>
              <Textarea
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                placeholder="Decision description..."
                rows={3}
                className="text-xs"
              />
              <Button size="sm" onClick={appendDecision} disabled={busy || !decision} className="w-full mt-2">
                Save
              </Button>
            </CollapsiblePanel>

            <CollapsiblePanel title="Add Knowledge" icon={FolderTree} defaultOpen={false}>
              <Input
                value={knowledgePath}
                onChange={(e) => setKnowledgePath(e.target.value)}
                placeholder="knowledge/notes.md"
                className="text-xs mb-2"
              />
              <Textarea
                value={knowledgeContent}
                onChange={(e) => setKnowledgeContent(e.target.value)}
                placeholder="Knowledge content..."
                rows={3}
                className="text-xs"
              />
              <Button size="sm" onClick={appendKnowledge} disabled={busy || !knowledgeContent} className="w-full mt-2">
                Save
              </Button>
            </CollapsiblePanel>
          </div>
        </aside>
      </div>
    </div>
  );
}
