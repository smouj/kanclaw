'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { 
  Loader2, Plus, Github, FolderOpen, 
  Box, Terminal, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { GitHubRepoPicker, GitHubPreview } from '@/components/github';

type Step = 'basic' | 'github' | 'import';

interface Repository {
  id: number;
  name: string;
  owner: { login: string };
  fullName: string;
  description: string | null;
  private: boolean;
  defaultBranch: string;
  url: string;
  htmlUrl: string;
  pushedAt: string;
  updatedAt: string;
  language: string | null;
  stargazersCount: number;
  forksCount: number;
}

export function ProjectCreateForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('basic');
  const [loading, setLoading] = useState(false);
  
  // Basic info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  // GitHub
  const [githubToken, setGithubToken] = useState('');
  const [githubConnected, setGithubConnected] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);

  async function handleConnectGitHub() {
    if (!githubToken.trim()) {
      toast.error('Introduce un token de GitHub');
      return;
    }
    setLoading(true);
    
    try {
      const response = await fetch('/api/connectors/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect', token: githubToken }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Error al conectar con GitHub');
        return;
      }
      
      setGithubConnected(true);
      toast.success('GitHub conectado');
    } catch (error) {
      toast.error('Error de conexión');
    }
    setLoading(false);
  }

  async function handleSubmit() {
    setLoading(true);
    
    const projectData: any = {
      name,
      description,
      withOfficialTeam: true,
    };

    if (selectedRepo) {
      projectData.githubOwner = selectedRepo.owner.login;
      projectData.githubRepo = selectedRepo.name;
      projectData.githubBranch = selectedRepo.defaultBranch;
    }

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        toast.error('No se pudo crear el proyecto.');
        setLoading(false);
        return;
      }

      const project = await response.json();
      toast.success('Proyecto creado correctamente.');
      router.push(`/project/${project.slug}`);
      router.refresh();
    } catch (error) {
      toast.error('Error al crear el proyecto');
    }
    setLoading(false);
  }

  async function handleImport(mode: 'create' | 'attach') {
    if (!selectedRepo) return;
    setLoading(true);
    
    try {
      const response = await fetch('/api/connectors/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'import',
          owner: selectedRepo.owner.login,
          repo: selectedRepo.name,
          mode,
          projectName: mode === 'create' ? name : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Error al importar');
        setLoading(false);
        return;
      }

      const data = await response.json();
      toast.success(mode === 'create' ? 'Proyecto creado' : 'Repositorio vinculado');
      router.push(`/project/${data.project.slug}`);
      router.refresh();
    } catch (error) {
      toast.error('Error al importar');
    }
    setLoading(false);
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

          {/* Official Team - Always enabled */}
          <div className="rounded-xl border border-accent-green/30 bg-accent-green/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-green/20">
                <Sparkles className="h-4 w-4 text-accent-green" />
              </div>
              <div>
                <p className="text-sm font-medium text-accent-green">Equipo oficial de KanClaw</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  6 agentes preconfigurados: Strategist, Builder, Researcher, QA, RepoOps, Memory Keeper
                </p>
              </div>
            </div>
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

      {/* Step 2: GitHub - Using new Picker */}
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
                disabled={loading || !githubToken.trim()}
                className="w-full gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
                Conectar GitHub
              </Button>
            </div>
          ) : selectedRepo ? (
            <div className="grid gap-4 xl:grid-cols-2">
              <div>
                <button
                  onClick={() => setSelectedRepo(null)}
                  className="text-sm text-text-muted hover:text-text-primary mb-3"
                >
                  ← Volver a la lista
                </button>
                <GitHubPreview
                  repo={selectedRepo}
                  onImport={(mode) => {
                    if (mode === 'create') {
                      handleImport('create');
                    } else {
                      // For attach, first create project then attach
                      handleImport('attach');
                    }
                  }}
                  loading={loading}
                />
              </div>
            </div>
          ) : (
            <GitHubRepoPicker
              onSelect={setSelectedRepo}
              selectedRepo={selectedRepo}
            />
          )}
        </div>
      )}

      {/* Step 3: Import */}
      {step === 'import' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Resumen</p>
              <h2 className="mt-2 text-xl font-semibold">Crear Proyecto</h2>
            </div>
            <Button variant="ghost" onClick={() => setStep('github')} className="text-text-muted">
              Volver
            </Button>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-surface rounded-xl border border-border">
              <h3 className="font-medium">{name}</h3>
              {description && <p className="text-sm text-text-muted mt-1">{description}</p>}
            </div>

            {selectedRepo && (
              <div className="p-4 bg-surface rounded-xl border border-border">
                <div className="flex items-center gap-2">
                  <Github className="w-4 h-4" />
                  <span className="text-sm">{selectedRepo.fullName}</span>
                </div>
                <p className="text-xs text-text-muted mt-1">Branch: {selectedRepo.defaultBranch}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setStep('github')}
              className="flex-1"
            >
              Cambiar repo
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={loading || !name.trim()}
              className="flex-1 gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Crear proyecto
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
