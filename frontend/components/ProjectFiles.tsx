'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FolderTree, Folder, File, FileCode2, FileText, FileJson, FileType,
  ChevronRight, ChevronDown, Plus, Save, Search, RefreshCw, 
  ExternalLink, GitBranch, Lock, Edit3, Eye, X, 
  Layers, Home, Github, Database, Brain, BookOpen, Box,
  ArrowRight, Info, Clock, CheckCircle, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/components/LanguageProvider';

type FileSource = 'workspace' | 'github' | 'memory' | 'knowledge' | 'decisions' | 'artifacts';

interface TreeNode {
  name: string;
  path: string;
  kind: 'directory' | 'file';
  source: FileSource;
  editable?: boolean;
  size?: number;
  modifiedAt?: string;
  children?: TreeNode[];
}

interface FileMetadata {
  path: string;
  name: string;
  size: number;
  modifiedAt: string;
  source: FileSource;
  editable: boolean;
  type: string;
}

function getFileIcon(filename: string, isDirectory: boolean, source: FileSource) {
  if (isDirectory) {
    if (source === 'github') return <Folder className="h-4 w-4 text-blue-400" />;
    if (source === 'memory') return <Brain className="h-4 w-4 text-purple-400" />;
    if (source === 'knowledge') return <BookOpen className="h-4 w-4 text-cyan-400" />;
    if (source === 'decisions') return <CheckCircle className="h-4 w-4 text-amber-400" />;
    if (source === 'artifacts') return <Box className="h-4 w-4 text-orange-400" />;
    return <Folder className="h-4 w-4 text-yellow-500" />;
  }
  
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'md') return <FileText className="h-4 w-4 text-blue-400" />;
  if (ext === 'json') return <FileJson className="h-4 w-4 text-yellow-400" />;
  if (['ts', 'tsx', 'js', 'jsx'].includes(ext || '')) return <FileType className="h-4 w-4 text-blue-500" />;
  return <FileCode2 className="h-4 w-4 text-text-muted" />;
}

function TreeBranch({
  node,
  onSelect,
  selectedPath,
  depth = 0,
}: {
  node: TreeNode;
  onSelect: (node: TreeNode) => void;
  selectedPath: string;
  depth?: number;
}) {
  const [open, setOpen] = useState(depth < 1);
  const isSelected = selectedPath === node.path;

  if (node.kind === 'file') {
    return (
      <button
        type="button"
        className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm transition ${
          isSelected
            ? 'bg-accent-green/20 text-accent-green border-l-2 border-accent-green'
            : 'text-text-secondary hover:bg-surface2'
        }`}
        style={{ paddingLeft: `${depth * 12 + 12}px` }}
        onClick={() => onSelect(node)}
      >
        {getFileIcon(node.name, false, node.source)}
        <span className="truncate flex-1">{node.name}</span>
        {!node.editable && <Lock className="h-3 w-3 text-text-muted" />}
      </button>
    );
  }

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm transition ${
          isSelected ? 'bg-surface2 text-text-primary' : 'text-text-primary hover:bg-surface2'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-text-muted" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-text-muted" />
        )}
        {getFileIcon(node.name, true, node.source)}
        <span className="truncate">{node.name}</span>
      </button>
      {open && node.children?.length ? (
        <div className="ml-1">
          {node.children.map((child) => (
            <TreeBranch
              key={`${child.source}-${child.path}`}
              node={child}
              onSelect={onSelect}
              selectedPath={selectedPath}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FilePreview({ 
  metadata, 
  content, 
  onEdit, 
  onSave, 
  onCancel,
  isSaving,
  isEditing 
}: { 
  metadata: FileMetadata | null; 
  content: string; 
  onEdit: () => void;
  onSave: (content: string) => void;
  onCancel: () => void;
  isSaving: boolean;
  isEditing: boolean;
}) {
  const { t } = useI18n();
  const [editContent, setEditContent] = useState(content);

  useEffect(() => {
    setEditContent(content);
  }, [content]);

  if (!metadata) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <File className="h-16 w-16 mx-auto text-text-muted opacity-30" />
          <p className="mt-4 text-text-muted">Selecciona un archivo para ver su contenido</p>
        </div>
      </div>
    );
  }

  const isMarkdown = metadata.name.endsWith('.md');
  const isJson = metadata.name.endsWith('.json');
  const isCode = ['ts', 'tsx', 'js', 'jsx', 'py', 'rs', 'go'].includes(metadata.name.split('.').pop() || '');

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          {getFileIcon(metadata.name, false, metadata.source)}
          <div>
            <h3 className="text-sm font-medium">{metadata.name}</h3>
            <p className="text-xs text-text-muted flex items-center gap-2">
              <span>{metadata.path}</span>
              {metadata.source === 'github' && <span className="text-blue-400">GitHub</span>}
              {metadata.source === 'workspace' && <span className="text-green-400">Workspace</span>}
              {metadata.source === 'memory' && <span className="text-purple-400">Memory</span>}
              {metadata.source === 'knowledge' && <span className="text-cyan-400">Knowledge</span>}
              {metadata.source === 'decisions' && <span className="text-amber-400">Decisions</span>}
              {metadata.source === 'artifacts' && <span className="text-orange-400">Artifacts</span>}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!metadata.editable && (
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <Lock className="h-3 w-3" /> Solo lectura
            </span>
          )}
          {metadata.editable && !isEditing && (
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Edit3 className="h-3 w-3 mr-1" /> Editar
            </Button>
          )}
          {isEditing && (
            <>
              <Button size="sm" onClick={() => onSave(editContent)} disabled={isSaving}>
                {isSaving ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                Guardar
              </Button>
              <Button size="sm" variant="ghost" onClick={onCancel}>
                Cancelar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {isEditing ? (
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="h-full min-h-[400px] font-mono text-sm bg-surface2 border-border"
          />
        ) : (
          <pre className={`text-sm whitespace-pre-wrap ${isCode ? 'font-mono' : ''} ${isMarkdown ? 'prose prose-invert max-w-none' : ''}`}>
            {content}
          </pre>
        )}
      </div>

      {/* Metadata footer */}
      <div className="border-t border-border px-4 py-2 bg-surface2/50">
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <Database className="h-3 w-3" />
            {metadata.size ? `${(metadata.size / 1024).toFixed(1)} KB` : '-'}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {metadata.modifiedAt ? new Date(metadata.modifiedAt).toLocaleString() : '-'}
          </span>
          <span className="flex items-center gap-1">
            <FileType className="h-3 w-3" />
            {metadata.type}
          </span>
        </div>
      </div>
    </div>
  );
}

function SourceSelector({ 
  sources, 
  activeSource, 
  onChange 
}: { 
  sources: { id: FileSource; label: string; icon: any; count: number }[];
  activeSource: FileSource;
  onChange: (source: FileSource) => void;
}) {
  return (
    <div className="flex gap-1 border-b border-border px-2 py-2 overflow-x-auto">
      {sources.map((source) => {
        const Icon = source.icon;
        const isActive = activeSource === source.id;
        return (
          <button
            key={source.id}
            onClick={() => onChange(source.id)}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition whitespace-nowrap ${
              isActive 
                ? 'bg-accent-green/20 text-accent-green border border-accent-green/30' 
                : 'text-text-muted hover:text-text-primary hover:bg-surface2'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {source.label}
            <span className={`text-[10px] ${isActive ? 'text-accent-green' : 'text-text-muted'}`}>
              {source.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ProjectFiles({
  projectSlug,
  initialWorkspaceTree,
  githubTree,
  memoryFiles,
  knowledgeFiles,
  decisionsFiles,
  artifactsFiles,
  githubConnected,
  githubRepo,
}: {
  projectSlug: string;
  initialWorkspaceTree: TreeNode[];
  githubTree?: TreeNode[];
  memoryFiles?: { name: string; path: string }[];
  knowledgeFiles?: { name: string; path: string }[];
  decisionsFiles?: { name: string; path: string }[];
  artifactsFiles?: { name: string; path: string }[];
  githubConnected?: boolean;
  githubRepo?: { owner: string; name: string; branch: string };
}) {
  const { t } = useI18n();
  const router = useRouter();
  
  const [activeSource, setActiveSource] = useState<FileSource>('workspace');
  const [selectedFile, setSelectedFile] = useState<TreeNode | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [fileMetadata, setFileMetadata] = useState<FileMetadata | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Build source trees
  const sourceTrees = useMemo(() => ({
    workspace: initialWorkspaceTree,
    github: githubTree || [],
    memory: memoryFiles?.map(f => ({ ...f, kind: 'file' as const, source: 'memory' as FileSource, editable: false })) || [],
    knowledge: knowledgeFiles?.map(f => ({ ...f, kind: 'file' as const, source: 'knowledge' as FileSource, editable: false })) || [],
    decisions: decisionsFiles?.map(f => ({ ...f, kind: 'file' as const, source: 'decisions' as FileSource, editable: true })) || [],
    artifacts: artifactsFiles?.map(f => ({ ...f, kind: 'file' as const, source: 'artifacts' as FileSource, editable: true })) || [],
  }), [initialWorkspaceTree, githubTree, memoryFiles, knowledgeFiles, decisionsFiles, artifactsFiles]);

  const sources = useMemo(() => [
    { id: 'workspace' as FileSource, label: 'Workspace', icon: Home, count: sourceTrees.workspace.length },
    { id: 'github' as FileSource, label: 'GitHub', icon: Github, count: sourceTrees.github.length },
    { id: 'memory' as FileSource, label: 'Memory', icon: Brain, count: sourceTrees.memory.length },
    { id: 'knowledge' as FileSource, label: 'Knowledge', icon: BookOpen, count: sourceTrees.knowledge.length },
    { id: 'decisions' as FileSource, label: 'Decisions', icon: CheckCircle, count: sourceTrees.decisions.length },
    { id: 'artifacts' as FileSource, label: 'Artifacts', icon: Box, count: sourceTrees.artifacts.length },
  ], [sourceTrees]);

  const currentTree = sourceTrees[activeSource];

  const filteredTree = useMemo(() => {
    if (!search.trim()) return currentTree;
    
    const filterNodes = (nodes: TreeNode[]): TreeNode[] => {
      const result: TreeNode[] = [];
      for (const node of nodes) {
        if (node.name.toLowerCase().includes(search.toLowerCase())) {
          result.push(node);
        } else if (node.kind === 'directory' && node.children) {
          const filteredChildren = filterNodes(node.children);
          if (filteredChildren.length > 0) {
            result.push({ ...node, children: filteredChildren });
          }
        }
      }
      return result;
    };
    
    return filterNodes(currentTree);
  }, [currentTree, search]);

  const handleSelect = useCallback(async (node: TreeNode) => {
    setSelectedFile(node);
    setLoading(true);
    setIsEditing(false);
    
    try {
      if (node.source === 'workspace') {
        const response = await fetch(`/api/files?projectSlug=${projectSlug}&path=${encodeURIComponent(node.path)}`);
        const data = await response.json();
        if (response.ok) {
          setFileContent(data.content || '');
          setFileMetadata({
            path: node.path,
            name: node.name,
            size: data.metadata?.size || data.content?.length || 0,
            modifiedAt: data.metadata?.modifiedAt || new Date().toISOString(),
            source: 'workspace',
            editable: node.editable !== false,
            type: node.name.split('.').pop() || 'text',
          });
        }
      } else if (node.source === 'github') {
        // For GitHub files, we would call a different API
        setFileContent('Contenido del repositorio GitHub...');
        setFileMetadata({
          path: node.path,
          name: node.name,
          size: 0,
          modifiedAt: new Date().toISOString(),
          source: 'github',
          editable: false,
          type: node.name.split('.').pop() || 'text',
        });
      } else {
        // For memory, knowledge, decisions, artifacts - read from workspace
        const response = await fetch(`/api/files?projectSlug=${projectSlug}&path=${encodeURIComponent(node.path)}`);
        const data = await response.json();
        if (response.ok) {
          setFileContent(data.content || '');
          setFileMetadata({
            path: node.path,
            name: node.name,
            size: data.content?.length || 0,
            modifiedAt: data.metadata?.modifiedAt || new Date().toISOString(),
            source: node.source,
            editable: node.editable !== false,
            type: node.name.split('.').pop() || 'text',
          });
        }
      }
    } catch (error) {
      toast.error('Error al cargar el archivo');
    } finally {
      setLoading(false);
    }
  }, [projectSlug]);

  const handleSave = useCallback(async (content: string) => {
    if (!selectedFile || !selectedFile.editable) return;
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/files', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectSlug,
          path: selectedFile.path,
          content,
        }),
      });
      
      if (response.ok) {
        setFileContent(content);
        setIsEditing(false);
        toast.success('Archivo guardado');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Error al guardar');
      }
    } catch {
      toast.error('Error al guardar el archivo');
    } finally {
      setIsSaving(false);
    }
  }, [projectSlug, selectedFile]);

  const handleRefresh = useCallback(async () => {
    router.refresh();
    toast.success('Explorador actualizado');
  }, [router]);

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Source + Tree */}
      <div className="w-72 flex-shrink-0 border-r border-border flex flex-col">
        {/* Source Selector */}
        <SourceSelector 
          sources={sources} 
          activeSource={activeSource} 
          onChange={setActiveSource} 
        />
        
        {/* Search & Actions */}
        <div className="border-b border-border p-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar archivos..."
              className="pl-9 bg-surface border-border"
            />
          </div>
          
          {activeSource === 'github' && (
            <div className="flex items-center gap-2 text-xs text-text-muted">
              {githubConnected ? (
                <>
                  <GitBranch className="h-3 w-3" />
                  <span>{githubRepo?.owner}/{githubRepo?.name}</span>
                  <span className="text-text-muted">({githubRepo?.branch})</span>
                </>
              ) : (
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> No conectado
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Tree */}
        <div className="flex-1 overflow-auto p-2">
          {filteredTree.length === 0 ? (
            <div className="text-center py-8">
              <FolderTree className="h-10 w-10 mx-auto text-text-muted opacity-30" />
              <p className="mt-2 text-xs text-text-muted">
                {search ? 'Sin resultados' : 'No hay archivos'}
              </p>
            </div>
          ) : (
            filteredTree.map((node) => (
              <TreeBranch
                key={`${node.source}-${node.path}`}
                node={node}
                onSelect={handleSelect}
                selectedPath={selectedFile?.path || ''}
              />
            ))
          )}
        </div>
        
        {/* Refresh Button */}
        <div className="border-t border-border p-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>
      
      {/* Main Content - Preview */}
      <div className="flex-1 flex flex-col min-w-0">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-text-muted" />
          </div>
        ) : (
          <FilePreview
            metadata={fileMetadata}
            content={fileContent}
            onEdit={() => setIsEditing(true)}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
            isSaving={isSaving}
            isEditing={isEditing}
          />
        )}
      </div>
    </div>
  );
}
