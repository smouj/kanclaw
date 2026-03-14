'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { 
  Loader2, Plus, Github, FolderOpen, FileCode, 
  ChevronRight, ChevronDown, File, Folder,
  GitBranch, Box, Terminal
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type Step = 'basic' | 'github' | 'import';

interface RepoFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: RepoFile[];
}

interface Repository {
  id: number;
  full_name: string;
  name: string;
  owner: { login: string };
  description: string | null;
  default_branch: string;
  html_url: string;
}

export function ProjectCreateForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('basic');
  const [loading, setLoading] = useState(false);
  
  // Basic info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [agents, setAgents] = useState('');
  const [withOfficialTeam, setWithOfficialTeam] = useState(true); // Default to official team
  
  // GitHub
  const [githubToken, setGithubToken] = useState('');
  const [githubConnected, setGithubConnected] = useState(false);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [repoFiles, setRepoFiles] = useState<RepoFile[]>([]);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [loadingRepos, setLoadingRepos] = useState(false);

  async function handleConnectGitHub() {
    if (!githubToken.trim()) {
      toast.error('Introduce un token de GitHub');
      return;
    }
    setLoadingRepos(true);
    
    try {
      // Save token and test connection
      const response = await fetch('/api/connectors/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect', token: githubToken }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Error al conectar con GitHub');
        setLoadingRepos(false);
        return;
      }
      
      setGithubConnected(true);
      toast.success('GitHub conectado');
      
      // Load repositories
      await loadRepositories();
    } catch (error) {
      toast.error('Error de conexión');
    }
    setLoadingRepos(false);
  }

  async function loadRepositories() {
    setLoadingRepos(true);
    const response = await fetch('/api/connectors/github/repositories');
    const data = await response.json();
    setLoadingRepos(false);
    
    if (response.ok) {
      setRepositories(data);
    }
  }

  async function selectRepository(repo: Repository) {
    setSelectedRepo(repo);
    setLoadingRepos(true);
    
    // Fetch repo tree
    try {
      const response = await fetch(`/api/connectors/github?owner=${repo.owner.login || repo.owner}&repo=${repo.name}`);
      const data = await response.json();
      
      if (data.tree) {
        // Transform flat tree to nested structure
        const files = buildFileTree(data.tree);
        setRepoFiles(files);
      }
    } catch (error) {
      console.error('Error loading repo:', error);
    }
    
    setLoadingRepos(false);
  }

  function buildFileTree(items: { path: string; type: string }[]): RepoFile[] {
    const root: RepoFile[] = [];
    const dirs: Record<string, RepoFile> = {};
    
    // Sort by path to ensure parents come before children
    items.sort((a, b) => a.path.localeCompare(b.path));
    
    for (const item of items) {
      const parts = item.path.split('/');
      const fileName = parts[parts.length - 1];
      
      if (parts.length === 1) {
        // Root level
        root.push({
          name: fileName,
          path: item.path,
          type: item.type === 'tree' ? 'dir' : 'file',
          children: item.type === 'tree' ? [] : undefined,
        });
      } else {
        // Nested - create parent dirs if needed
        let currentPath = '';
        let parentChildren = root;
        
        for (let i = 0; i < parts.length - 1; i++) {
          currentPath += (currentPath ? '/' : '') + parts[i];
          
          if (!dirs[currentPath]) {
            const dir: RepoFile = {
              name: parts[i],
              path: currentPath,
              type: 'dir',
              children: [],
            };
            parentChildren.push(dir);
            dirs[currentPath] = dir;
          }
          parentChildren = dirs[currentPath].children!;
        }
        
        parentChildren.push({
          name: fileName,
          path: item.path,
          type: item.type === 'tree' ? 'dir' : 'file',
          children: item.type === 'tree' ? [] : undefined,
        });
      }
    }
    
    return root;
  }

  function toggleDir(path: string) {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedDirs(newExpanded);
  }

  function renderFileTree(files: RepoFile[], depth: number = 0) {
    return files.map((file) => (
      <div key={file.path}>
        <div 
          className="file-tree-item flex items-center gap-2"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => file.type === 'dir' && toggleDir(file.path)}
        >
          {file.type === 'dir' ? (
            <>
              {expandedDirs.has(file.path) ? (
                <ChevronDown className="w-3 h-3 text-text-muted" />
              ) : (
                <ChevronRight className="w-3 h-3 text-text-muted" />
              )}
              <Folder className="w-4 h-4 text-yellow-500" />
            </>
          ) : (
            <>
              <span className="w-3" />
              <FileCode className="w-4 h-4 text-blue-400" />
            </>
          )}
          <span className="text-sm text-text-secondary truncate">{file.name}</span>
        </div>
        {file.type === 'dir' && expandedDirs.has(file.path) && file.children && (
          renderFileTree(file.children, depth + 1)
        )}
      </div>
    ));
  }

  async function handleSubmit() {
    setLoading(true);
    
    // Only parse custom agents if NOT using official team
    const agentsList = withOfficialTeam ? [] : agents
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
      .map((agentName) => ({ name: agentName, role: '' }));

    // If GitHub repo selected, use that as base
    let projectData: any = {
      name,
      description,
      agents: agentsList,
      withOfficialTeam,
    };

    if (selectedRepo) {
      projectData = {
        ...projectData,
        githubOwner: selectedRepo.owner.login || selectedRepo.owner,
        githubRepo: selectedRepo.name,
        githubBranch: selectedRepo.default_branch,
      };
    }

    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData),
    });

    setLoading(false);

    if (!response.ok) {
      toast.error('No se pudo crear el proyecto.');
      return;
    }

    const project = await response.json();
    toast.success('Proyecto creado correctamente.');
    router.push(`/project/${project.slug}`);
    router.refresh();
  }

  return (
    <div className="panel-muted p-5 lg:p-6" data-testid="project-create-form">
      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-6">
        <div className={`flex items-center gap-2 px-3 py-1 ${step === 'basic' ? 'bg-accent-green/20 text-accent-green' : 'bg-surface2 text-text-muted'}`}>
          <Box className="w-4 h-4" />
          <span className="text-sm">1. Basic</span>
        </div>
        <div className="w-8 h-px bg-border" />
        <div className={`flex items-center gap-2 px-3 py-1 ${step === 'github' ? 'bg-accent-green/20 text-accent-green' : 'bg-surface2 text-text-muted'}`}>
          <Github className="w-4 h-4" />
          <span className="text-sm">2. GitHub</span>
        </div>
        <div className="w-8 h-px bg-border" />
        <div className={`flex items-center gap-2 px-3 py-1 ${step === 'import' ? 'bg-accent-green/20 text-accent-green' : 'bg-surface2 text-text-muted'}`}>
          <Terminal className="w-4 h-4" />
          <span className="text-sm">3. Import</span>
        </div>
      </div>

      {/* Step 1: Basic Info */}
      {step === 'basic' && (
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Crear workspace</p>
            <h2 className="mt-2 text-2xl font-semibold">Nuevo proyecto</h2>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-text-secondary">Nombre del proyecto</label>
            <Input 
              id="project-name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="mi-proyecto" 
              className="bg-surface border-border"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-text-secondary">Descripción</label>
            <Textarea 
              id="project-description" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Objetivo y alcance del proyecto..." 
              className="bg-surface border-border resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-text-secondary">Agentes (separados por coma)</label>
            <Input 
              id="project-agents" 
              value={agents}
              onChange={(e) => setAgents(e.target.value)}
              placeholder="PlannerAgent, BuilderAgent, QAAgent" 
              className="bg-surface border-border"
              disabled={withOfficialTeam}
            />
            {withOfficialTeam && (
              <p className="text-xs text-zinc-500">Los agentes personalizados se deshabilitan cuando usas el equipo oficial.</p>
            )}
          </div>

          {/* Official Team Option */}
          <div className="rounded-xl border border-accent-green/30 bg-accent-green/5 p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={withOfficialTeam}
                onChange={(e) => setWithOfficialTeam(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border bg-surface accent-accent-green"
              />
              <div>
                <p className="text-sm font-medium text-accent-green">🎯 Crear con equipo oficial de KanClaw</p>
                <p className="text-xs text-zinc-400 mt-1">
                  Incluir 6 agentes preconfigurados: Strategist, Builder, Researcher, QA, RepoOps, Memory Keeper
                </p>
              </div>
            </label>
          </div>

          <Button 
            onClick={() => setStep('github')}
            disabled={!name.trim()}
            className="w-full mt-4"
          >
            Siguiente: Conectar GitHub
          </Button>
        </div>
      )}

      {/* Step 2: GitHub */}
      {step === 'github' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Conectar</p>
              <h2 className="mt-2 text-xl font-semibold">GitHub Repository</h2>
            </div>
            <Button variant="ghost" onClick={() => setStep('basic')} className="text-text-muted">
              Volver
            </Button>
          </div>

          {!githubConnected ? (
            <div className="space-y-3">
              <p className="text-sm text-text-secondary">
                Conecta tu cuenta de GitHub para importar un repositorio como base del proyecto.
              </p>
              <Input 
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                className="bg-surface border-border font-mono text-sm"
              />
              <p className="text-xs text-text-muted">
                Necesitas un Personal Access Token con permisos <code className="bg-surface2 px-1">repo</code>
              </p>
              <Button 
                onClick={handleConnectGitHub}
                disabled={loadingRepos || !githubToken.trim()}
                className="w-full gap-2"
              >
                {loadingRepos ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
                Conectar GitHub
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {repositories.length === 0 ? (
                <div className="text-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-text-muted" />
                  <p className="mt-2 text-sm text-text-muted">Cargando repositorios...</p>
                </div>
              ) : (
                <>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {repositories.map((repo) => (
                      <div
                        key={repo.id}
                        onClick={() => selectRepository(repo)}
                        className={`file-tree-item flex items-center gap-3 ${
                          selectedRepo?.id === repo.id ? 'active' : ''
                        }`}
                      >
                        <FolderOpen className="w-4 h-4 text-text-muted" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-text-primary truncate">{repo.full_name}</p>
                          {repo.description && (
                            <p className="text-xs text-text-muted truncate">{repo.description}</p>
                          )}
                        </div>
                        <GitBranch className="w-3 h-3 text-text-muted" />
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="secondary"
                      onClick={() => setStep('import')}
                      disabled={!selectedRepo}
                      className="flex-1"
                    >
                      Saltar sin repo
                    </Button>
                    <Button 
                      onClick={() => setStep('import')}
                      disabled={!selectedRepo}
                      className="flex-1"
                    >
                      Continuar
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Import / VSCode-like File Tree */}
      {step === 'import' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Estructura</p>
              <h2 className="mt-2 text-xl font-semibold">Vista previa VSCode</h2>
            </div>
            <Button variant="ghost" onClick={() => setStep('github')} className="text-text-muted">
              Volver
            </Button>
          </div>

          {selectedRepo && repoFiles.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-surface rounded border border-border">
                <Github className="w-5 h-5 text-text-primary" />
                <div>
                  <p className="text-sm font-medium">{selectedRepo.full_name}</p>
                  <p className="text-xs text-text-muted">{selectedRepo.default_branch} branch</p>
                </div>
              </div>
              
              <div className="border border-border bg-surface p-2 max-h-64 overflow-auto scrollbar-thin">
                {renderFileTree(repoFiles)}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-text-muted">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Sin repositorio seleccionado</p>
              <p className="text-xs mt-1">Se creará un proyecto vacío</p>
            </div>
          )}

          <Button 
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
            className="w-full gap-2 mt-4"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Crear proyecto
          </Button>
        </div>
      )}
    </div>
  );
}
