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
import { LanguageSelector } from '@/components/LanguageSelector';
import { useI18n } from '@/components/LanguageProvider';

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

const viewMeta: Array<{ key: ViewKey; labelKey: string; icon: typeof LayoutGrid }> = [
  { key: 'overview', labelKey: 'nav.overview', icon: LayoutGrid },
  { key: 'chat', labelKey: 'nav.chat', icon: MessageSquareText },
  { key: 'board', labelKey: 'nav.board', icon: FolderTree },
  { key: 'memory', labelKey: 'nav.memory', icon: BrainCircuit },
  { key: 'files', labelKey: 'nav.files', icon: FolderTree },
  { key: 'connectors', labelKey: 'nav.connectors', icon: Cable },
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
  const { t } = useI18n();
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
      toast.error(t('toast.snapshotError'));
      return;
    }
    toast.success(t('toast.snapshotCreated'));
    router.refresh();
  }, [project.name, project.slug, router, t]);

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
      toast.error(t('toast.agentCreateError'));
      return;
    }
    setAgentName('');
    setAgentRole('');
    toast.success(t('toast.agentCreated'));
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
      toast.error(t('toast.decisionError'));
      return;
    }
    setDecision('');
    toast.success(t('toast.decisionSaved'));
    router.refresh();
  }

  async function appendKnowledge() {
    if (!knowledgePath.trim() || !knowledgeContent.trim()) return;
    setBusy(true);
    const ok = await appendToFile(knowledgePath, `\n${knowledgeContent}\n`);
    setBusy(false);
    if (!ok) {
      toast.error(t('toast.knowledgeError'));
      return;
    }
    setKnowledgeContent('');
    toast.success(t('toast.knowledgeSaved'));
    router.refresh();
  }

  const commands = useMemo<CommandItem[]>(() => [
    { id: 'overview', label: t('command.overview'), hint: t('command.overviewHint'), onSelect: () => setActiveView('overview') },
    { id: 'chat-team', label: t('command.teamRoom'), hint: t('command.teamRoomHint'), onSelect: () => { setActiveView('chat'); setSelectedThreadId(teamThreadId); setPreferredTargetAgent(project.agents[0]?.name || ''); } },
    { id: 'board', label: t('command.board'), hint: t('command.boardHint'), onSelect: () => setActiveView('board') },
    { id: 'memory', label: t('command.memory'), hint: t('command.memoryHint'), onSelect: () => setActiveView('memory') },
    { id: 'files', label: t('command.files'), hint: t('command.filesHint'), onSelect: () => setActiveView('files') },
    { id: 'connectors', label: t('command.connectors'), hint: t('command.connectorsHint'), onSelect: () => setActiveView('connectors') },
    { id: 'snapshot', label: t('command.snapshot'), hint: t('command.snapshotHint'), onSelect: () => void createSnapshot() },
    { id: 'reconnect-openclaw', label: t('command.reconnect'), hint: t('command.reconnectHint'), onSelect: () => router.refresh() },
    ...project.agents.map((agent) => ({
      id: `agent-${agent.id}`,
      label: `${t('command.chatWith')} ${agent.name}`,
      hint: agent.role || t('command.agentHint'),
      onSelect: () => {
        const thread = model.threads.find((item) => item.agentId === agent.id);
        setActiveView('chat');
        setSelectedThreadId(thread?.id || teamThreadId);
        setPreferredTargetAgent(agent.name);
      },
    })),
  ], [createSnapshot, model.threads, project.agents, router, teamThreadId, t]);

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
            title="Toggle left sidebar"
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${leftSidebarOpen ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            className="flex items-center justify-center w-8 h-8 rounded border border-border bg-surface2 hover:bg-surface transition-colors"
            title="Toggle right panel"
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${rightPanelOpen ? '' : 'rotate-180'}`} />
          </button>
          <ThemeToggle />
          <LanguageSelector />
          <Button variant="outline" size="sm" onClick={() => router.refresh()}>
            <RefreshCcw className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">{t('common.refresh')}</span>
          </Button>
          <Button size="sm" onClick={() => void createSnapshot()} disabled={busy}>
            <Sparkles className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">{t('common.snapshot')}</span>
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
                  {t(item.labelKey)}
                </button>
              ))}
            </nav>

            {/* Agents Section */}
            <CollapsiblePanel title={t('sidebar.agents')} icon={Bot} defaultOpen={true}>
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
                    placeholder={t('sidebar.newAgentName')}
                    className="h-8 text-xs"
                  />
                  <Button size="sm" onClick={createAgent} disabled={busy || !agentName} className="w-full mt-2 h-8">
                    {t('sidebar.addAgent')}
                  </Button>
                </div>
              </div>
            </CollapsiblePanel>

            {/* Signals */}
            <CollapsiblePanel title={t('sidebar.signals')} icon={BrainCircuit} defaultOpen={true}>
              <div className="space-y-2 text-xs">
                <SignalRow label="OpenClaw" value={health.connected ? t('chat.connected') : t('chat.disconnected')} />
                <SignalRow label="GitHub" value={githubStatus.connected ? t('chat.connected') : t('connectors.notConfigured')} />
                <SignalRow label={t('sidebar.agentsCount')} value={String(project.agents.length)} />
                <SignalRow label={t('sidebar.runsCount')} value={String(model.runs.length)} />
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
              {t('sidebar.command')}
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
                label={t(item.labelKey)}
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
                      { label: t('overview.conversations'), value: model.threads.length, icon: MessageSquare, colorClass: 'text-blue-400' },
                      { label: t('overview.tasks'), value: model.project.tasks.length, icon: CheckCircle2, colorClass: 'text-emerald-400' },
                      { label: t('overview.runs'), value: model.runs.length, icon: Zap, colorClass: 'text-amber-400' },
                      { label: t('overview.snapshots'), value: model.snapshots.length, icon: Camera, colorClass: 'text-purple-400' },
                    ].map((stat) => (
                      <div key={stat.label} className="p-5 rounded-xl border bg-surface border-border">
                        <div className="flex items-center justify-between">
                          {stat.icon && <stat.icon className={`h-5 w-5 ${stat.colorClass}`} />}
                          <span className={`text-xs uppercase tracking-wider ${stat.colorClass}`}>{stat.label}</span>
                        </div>
                        <p className="mt-3 text-3xl font-bold">{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Agents Status */}
                  <div className="rounded-xl border border-border bg-surface p-5">
                    <h3 className="text-sm font-medium mb-4">{t('overview.agents')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {project.agents.map((agent) => (
                        <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg bg-surface2 border border-border">
                          <div className="flex items-center gap-3">
                            <div className="h-3 w-3 rounded-full bg-emerald-500" />
                            <span className="text-sm font-medium">{agent.name}</span>
                          </div>
                          <span className="text-xs text-text-muted">{agent.role || 'Sin rol'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-border bg-surface p-5">
                      <h3 className="text-xs uppercase tracking-wider text-text-muted mb-3">{t('overview.delegations')}</h3>
                      <p className="text-2xl font-bold">{model.delegations.length}</p>
                      {model.delegations.slice(0, 2).map((d) => (
                        <p key={d.id} className="mt-2 text-xs text-text-muted truncate">{d.action}</p>
                      ))}
                    </div>
                    <div className="rounded-xl border border-border bg-surface p-5">
                      <h3 className="text-xs uppercase tracking-wider text-text-muted mb-3">{t('overview.imports')}</h3>
                      <p className="text-2xl font-bold">{model.imports.length}</p>
                      {model.imports.slice(0, 2).map((imp) => (
                        <p key={imp.id} className="mt-2 text-xs text-text-muted truncate">{imp.provider}: {imp.label}</p>
                      ))}
                    </div>
                    <div className="rounded-xl border border-border bg-surface p-5">
                      <h3 className="text-xs uppercase tracking-wider text-text-muted mb-3">{t('overview.memory')}</h3>
                      <p className="text-2xl font-bold">{model.projectMemory.length > 0 ? t('overview.memoryActive') : t('overview.memoryEmpty')}</p>
                      <p className="mt-2 text-xs text-text-muted">{model.knowledge.length} {t('overview.knowledgeFilesCount')}</p>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="rounded-xl border border-border bg-surface p-5">
                    <h3 className="text-sm font-medium mb-4">{t('overview.activity')}</h3>
                    <div className="space-y-2">
                      {model.logs.length === 0 ? (
                        <p className="text-sm text-text-muted">{t('overview.noActivity')}</p>
                      ) : (
                        model.logs.slice(0, 8).map((log) => (
                          <div key={log.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-text-muted">{log.actor}</span>
                              <span className="text-sm">{log.action}</span>
                            </div>
                            <span className="text-xs text-text-muted">
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
              <span className="text-sm font-medium">{t('common.quickActions')}</span>
              <ChevronRight className={`w-4 h-4 transition-transform ${rightPanelOpen ? '' : '-rotate-180'}`} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <CollapsiblePanel title={t('actions.addDecision')} icon={BrainCircuit} defaultOpen={false}>
              <Textarea
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                placeholder={t('actions.decisionPlaceholder')}
                rows={3}
                className="text-xs"
              />
              <Button size="sm" onClick={appendDecision} disabled={busy || !decision} className="w-full mt-2">
                {t('common.save')}
              </Button>
            </CollapsiblePanel>

            <CollapsiblePanel title={t('actions.addKnowledge')} icon={FolderTree} defaultOpen={false}>
              <Input
                value={knowledgePath}
                onChange={(e) => setKnowledgePath(e.target.value)}
                placeholder={t('actions.knowledgePathPlaceholder')}
                className="text-xs mb-2"
              />
              <Textarea
                value={knowledgeContent}
                onChange={(e) => setKnowledgeContent(e.target.value)}
                placeholder={t('actions.knowledgePlaceholder')}
                rows={3}
                className="text-xs"
              />
              <Button size="sm" onClick={appendKnowledge} disabled={busy || !knowledgeContent} className="w-full mt-2">
                {t('common.save')}
              </Button>
            </CollapsiblePanel>
          </div>
        </aside>
      </div>
    </div>
  );
}
