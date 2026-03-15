'use client';

import { useState, useEffect } from 'react';
import { 
  Github, GitBranch, Globe, Lock, Loader2, 
  FolderOpen, FileCode, FileText, AlertCircle,
  ChevronRight, ChevronDown, Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GitHubRepository {
  id: number;
  name: string;
  owner: { login: string };
  fullName: string;
  description: string | null;
  private: boolean;
  defaultBranch: string;
  url: string;
  pushedAt: string;
  updatedAt: string;
  htmlUrl: string;
  language: string | null;
  stargazersCount: number;
  forksCount: number;
}

interface RepoFile {
  path: string;
  type: 'tree' | 'blob';
  size?: number;
}

interface GitHubPreviewProps {
  repo: GitHubRepository;
  onImport: (mode: 'create' | 'attach') => void;
  loading?: boolean;
  projectSlug?: string;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: TreeNode[];
  expanded?: boolean;
}

export function GitHubPreview({ repo, onImport, loading, projectSlug }: GitHubPreviewProps) {
  const [metadata, setMetadata] = useState<{
    readme: string;
    tree: RepoFile[];
    manifests: Record<string, string>;
  } | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<TreeNode[]>([]);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['/']));

  useEffect(() => {
    loadMetadata();
  }, [repo.owner.login, repo.name]);

  async function loadMetadata() {
    setLoadingMetadata(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/connectors/github?owner=${repo.owner.login}&repo=${repo.name}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar metadata');
      }
      
      setMetadata(data);
      
      // Build file tree from flat list
      if (data.tree) {
        const tree = buildFileTree(data.tree);
        setFileTree(tree);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoadingMetadata(false);
    }
  }

  function buildFileTree(items: RepoFile[]): TreeNode[] {
    const root: TreeNode[] = [];
    const dirs: Record<string, TreeNode> = {};
    
    // Sort by path
    const sorted = [...items].sort((a, b) => a.path.localeCompare(b.path));
    
    for (const item of sorted.slice(0, 150)) { // Limit to first 150 files for performance
      const parts = item.path.split('/');
      const name = parts[parts.length - 1];
      
      if (parts.length === 1) {
        root.push({
          name,
          path: item.path,
          type: item.type === 'tree' ? 'dir' : 'file',
        });
      } else {
        let currentPath = '';
        let currentLevel = root;
        
        for (let i = 0; i < parts.length - 1; i++) {
          currentPath += (currentPath ? '/' : '') + parts[i];
          
          if (!dirs[currentPath]) {
            const dirNode: TreeNode = {
              name: parts[i],
              path: currentPath,
              type: 'dir',
              children: [],
            };
            dirs[currentPath] = dirNode;
            currentLevel.push(dirNode);
          }
          currentLevel = dirs[currentPath].children || [];
        }
        
        currentLevel.push({
          name,
          path: item.path,
          type: item.type === 'tree' ? 'dir' : 'file',
        });
      }
    }
    
    return root;
  }

  function toggleDir(path: string) {
    setExpandedDirs(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }

  function getFileIcon(name: string) {
    const ext = name.split('.').pop()?.toLowerCase();
    if (['ts', 'tsx', 'js', 'jsx', 'py', 'java', 'go', 'rs', 'rb'].includes(ext || '')) {
      return <FileCode className="w-3 h-3 text-blue-400" />;
    }
    if (['md', 'txt', 'json', 'yaml', 'yml', 'toml'].includes(ext || '')) {
      return <FileText className="w-3 h-3 text-zinc-400" />;
    }
    return <FileText className="w-3 h-3 text-zinc-500" />;
  }

  function renderTree(nodes: TreeNode[], depth = 0): React.ReactNode {
    return nodes.map((node) => {
      const isExpanded = expandedDirs.has(node.path);
      const hasChildren = node.children && node.children.length > 0;
      
      return (
        <div key={node.path}>
          <button
            onClick={() => node.type === 'dir' && toggleDir(node.path)}
            className="flex items-center gap-1 w-full text-left py-0.5 hover:bg-surface2 px-2 rounded text-xs"
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            {node.type === 'dir' ? (
              <>
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-text-muted" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-text-muted" />
                )}
                <FolderOpen className="w-3 h-3 text-amber-400" />
              </>
            ) : (
              <>
                <span className="w-3" />
                {getFileIcon(node.name)}
              </>
            )}
            <span className="text-text-primary truncate">{node.name}</span>
          </button>
          
          {node.type === 'dir' && isExpanded && hasChildren && renderTree(node.children!, depth + 1)}
        </div>
      );
    });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 bg-surface rounded-xl border border-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
          <Github className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text-primary">{repo.fullName}</h3>
          {repo.description && (
            <p className="text-sm text-text-muted mt-1 line-clamp-2">{repo.description}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-surface rounded-lg border border-border">
          <div className="flex items-center gap-2 text-text-muted">
            {repo.private ? <Lock className="w-4 h-4 text-amber-400" /> : <Globe className="w-4 h-4 text-emerald-400" />}
            <span className="text-xs uppercase tracking-wider">Visibilidad</span>
          </div>
          <p className="text-sm font-medium text-text-primary mt-1">
            {repo.private ? 'Privado' : 'Público'}
          </p>
        </div>
        
        <div className="p-3 bg-surface rounded-lg border border-border">
          <div className="flex items-center gap-2 text-text-muted">
            <GitBranch className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Branch</span>
          </div>
          <p className="text-sm font-medium text-text-primary mt-1">{repo.defaultBranch}</p>
        </div>
      </div>

      {/* Manifests */}
      {metadata?.manifests && Object.keys(metadata.manifests).length > 0 && (
        <div className="p-4 bg-surface rounded-xl border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-text-muted" />
            <span className="text-xs uppercase tracking-wider text-text-muted">Technologías detectadas</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.keys(metadata.manifests).map((name) => (
              <span
                key={name}
                className="px-2 py-1 text-xs bg-surface2 rounded border border-border text-text-secondary"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* File Tree */}
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="bg-surface2 px-4 py-2 border-b border-border">
          <span className="text-xs uppercase tracking-wider text-text-muted">
            Estructura ({metadata?.tree?.length || 0} archivos)
          </span>
        </div>
        <div className="max-h-48 overflow-auto p-2 bg-surface">
          {loadingMetadata ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 p-4 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          ) : fileTree.length > 0 ? (
            renderTree(fileTree)
          ) : (
            <p className="text-sm text-text-muted p-4">Sin archivos</p>
          )}
        </div>
      </div>

      {/* README Preview */}
      {metadata?.readme && (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="bg-surface2 px-4 py-2 border-b border-border">
            <span className="text-xs uppercase tracking-wider text-text-muted">README</span>
          </div>
          <div className="max-h-40 overflow-auto p-4 bg-surface">
            <pre className="text-xs text-text-secondary whitespace-pre-wrap font-mono">
              {metadata.readme.slice(0, 1200)}
              {metadata.readme.length > 1200 && '...'}
            </pre>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {projectSlug && (
          <Button
            variant="outline"
            onClick={() => onImport('attach')}
            disabled={loading}
            className="flex-1"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Vincular a proyecto
          </Button>
        )}
        <Button
          onClick={() => onImport('create')}
          disabled={loading}
          className="flex-1"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Crear proyecto
        </Button>
      </div>
    </div>
  );
}
