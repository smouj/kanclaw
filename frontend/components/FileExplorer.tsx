'use client';

import { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileCode2,
  Folder,
  Plus,
  Save,
  Search,
  FileText,
  FileJson,
  FileType,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/components/LanguageProvider';

interface TreeNode {
  name: string;
  path: string;
  kind: 'directory' | 'file';
  editable?: boolean;
  children?: TreeNode[];
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
  const [open, setOpen] = useState(depth < 2);
  const isSelected = selectedPath === node.path;

  if (node.kind === 'file') {
    return (
      <button
        type="button"
        className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm transition ${
          isSelected
            ? 'bg-accent-green/20 text-accent-green'
            : 'text-text-secondary hover:bg-surface2'
        }`}
        style={{ paddingLeft: `${depth * 12 + 12}px` }}
        onClick={() => onSelect(node)}
      >
        {getFileIcon(node.name)}
        <span className="truncate">{node.name}</span>
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
        <Folder className="h-4 w-4 flex-shrink-0 text-yellow-500" />
        <span className="truncate">{node.name}</span>
      </button>
      {open && node.children?.length ? (
        <div className="ml-1">
          {node.children.map((child) => (
            <TreeBranch
              key={child.path}
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

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'md') return <FileText className="h-4 w-4 flex-shrink-0 text-blue-400" />;
  if (ext === 'json') return <FileJson className="h-4 w-4 flex-shrink-0 text-yellow-400" />;
  if (['ts', 'tsx', 'js', 'jsx'].includes(ext || ''))
    return <FileType className="h-4 w-4 flex-shrink-0 text-blue-500" />;
  return <FileCode2 className="h-4 w-4 flex-shrink-0 text-text-muted" />;
}

export function FileExplorer({ projectSlug, initialTree }: { projectSlug: string; initialTree: TreeNode[] }) {
  const { t } = useI18n();
  const [tree, setTree] = useState(initialTree);
  const [selectedPath, setSelectedPath] = useState('');
  const [content, setContent] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [showNewFile, setShowNewFile] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const filteredTree = search
    ? filterTree(tree, search.toLowerCase())
    : tree;

  useEffect(() => {
    setTree(initialTree);
  }, [initialTree]);

  function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
    const result: TreeNode[] = [];
    for (const node of nodes) {
      if (node.name.toLowerCase().includes(query)) {
        result.push(node);
      } else if (node.kind === 'directory' && node.children) {
        const filteredChildren = filterTree(node.children, query);
        if (filteredChildren.length > 0) {
          result.push({ ...node, children: filteredChildren });
        }
      }
    }
    return result;
  }

  async function handleSelect(node: TreeNode) {
    await loadFile(node.path);
  }

  async function loadFile(path: string) {
    if (hasChanges) {
      const confirm = window.confirm(t('files.discardConfirm'));
      if (!confirm) return;
    }

    setLoading(true);
    setSelectedPath(path);
    setHasChanges(false);

    const response = await fetch(`/api/files?projectSlug=${projectSlug}&path=${encodeURIComponent(path)}`);
    setLoading(false);

    if (!response.ok) {
      toast.error(t('files.openError'));
      return;
    }

    const data = await response.json();
    setContent(data.content || '');
  }

  async function saveFile() {
    if (!selectedPath) return;

    setSaving(true);
    const response = await fetch('/api/files', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectSlug, path: selectedPath, content }),
    });
    setSaving(false);

    if (!response.ok) {
      toast.error(t('files.saveError'));
      return;
    }

    setHasChanges(false);
    toast.success(t('files.savedOk'));
  }

  async function createFile() {
    if (!newFileName.trim()) {
      toast.error(t('files.nameRequired'));
      return;
    }

    const response = await fetch('/api/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectSlug, path: newFileName, content: '' }),
    });

    if (!response.ok) {
      toast.error(t('files.createError'));
      return;
    }

    toast.success(t('files.createdOk'));
    setShowNewFile(false);
    setNewFileName('');
    window.location.reload();
  }

  function handleContentChange(newContent: string) {
    setContent(newContent);
    setHasChanges(true);
  }

  const fileName = selectedPath.split('/').pop() || '';
  const fileExt = fileName.split('.').pop()?.toLowerCase() || '';

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Sidebar - File Tree */}
      <div className="flex w-64 flex-shrink-0 flex-col border-r border-border bg-surface">
        {/* Search */}
        <div className="flex items-center gap-2 border-b border-border p-3">
          <Search className="h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder={t('files.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder-zinc-500 outline-none"
          />
        </div>

        {/* New file button */}
        <div className="border-b border-border p-2">
          <Button
            size="sm"
            variant="ghost"
            className="w-full justify-start gap-2 text-text-secondary hover:text-text-primary"
            onClick={() => setShowNewFile(true)}
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm">{t('files.newFile')}</span>
          </Button>

          {showNewFile && (
            <div className="mt-2 space-y-2 rounded-lg border border-border bg-surface2 p-2">
              <Input
                placeholder={t('files.pathPlaceholder')}
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" onClick={createFile}>
                  {t('files.create')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowNewFile(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Tree */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredTree.map((node) => (
            <TreeBranch
              key={node.path}
              node={node}
              onSelect={handleSelect}
              selectedPath={selectedPath}
            />
          ))}
          {filteredTree.length === 0 && (
            <p className="p-3 text-sm text-text-muted">
              {search ? t('files.noResults') : t('files.noFiles')}
            </p>
          )}
        </div>
      </div>

      {/* Main editor area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-2">
          <div className="flex items-center gap-3">
            {selectedPath ? (
              <>
                {getFileIcon(fileName)}
                <span className="text-sm font-medium text-text-primary">{fileName}</span>
                {hasChanges && (
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
                    {t('files.unsaved')}
                  </span>
                )}
              </>
            ) : (
              <span className="text-sm text-text-muted">{t('files.selectFile')}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">{fileExt.toUpperCase()}</span>
            <Button
              size="sm"
              disabled={!selectedPath || !hasChanges}
              onClick={saveFile}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? t('files.saving') : t('common.save')}
            </Button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden bg-surface2">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-text-muted">{t('files.loading')}</p>
            </div>
          ) : selectedPath ? (
            <textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="h-full w-full resize-none bg-transparent p-4 font-mono text-sm text-text-primary outline-none"
              spellCheck={false}
              placeholder={t('files.writePlaceholder')}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-text-muted">
              <FileCode2 className="mb-4 h-12 w-12 opacity-50" />
              <p className="text-lg font-medium">{t('files.selectFileEdit')}</p>
              <p className="mt-2 text-sm">
                {t('files.createHint')} «{t('files.newFile')}»
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
