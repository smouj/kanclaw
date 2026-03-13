'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, FileCode2, Folder, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useProjectStore } from '@/store/useProjectStore';

interface TreeNode {
  name: string;
  path: string;
  kind: 'directory' | 'file';
  editable?: boolean;
  children?: TreeNode[];
}

function TreeBranch({ node, onSelect }: { node: TreeNode; onSelect: (node: TreeNode) => void }) {
  const [open, setOpen] = useState(true);

  if (node.kind === 'file') {
    return (
      <button type="button" className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm text-zinc-300 transition hover:bg-white/5" onClick={() => onSelect(node)} data-testid={`file-tree-item-${node.path.replace(/[^a-zA-Z0-9]+/g, '-')}`}>
        <FileCode2 className="h-4 w-4 text-zinc-500" />
        <span className="truncate">{node.name}</span>
      </button>
    );
  }

  return (
    <div className="space-y-1">
      <button type="button" className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm text-zinc-100 transition hover:bg-white/5" onClick={() => setOpen((value) => !value)} data-testid={`directory-tree-item-${node.path.replace(/[^a-zA-Z0-9]+/g, '-')}`}>
        {open ? <ChevronDown className="h-4 w-4 text-zinc-500" /> : <ChevronRight className="h-4 w-4 text-zinc-500" />}
        <Folder className="h-4 w-4 text-zinc-500" />
        <span className="truncate">{node.name}</span>
      </button>
      {open && node.children?.length ? <div className="ml-4 space-y-1 border-l border-white/5 pl-2">{node.children.map((child) => <TreeBranch key={child.path} node={child} onSelect={onSelect} />)}</div> : null}
    </div>
  );
}

export function FileExplorer({ projectSlug, initialTree }: { projectSlug: string; initialTree: TreeNode[] }) {
  const { selectedFilePath, setSelectedFilePath } = useProjectStore();
  const [tree, setTree] = useState(initialTree);
  const [content, setContent] = useState('');
  const [newPath, setNewPath] = useState('knowledge/notes.md');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTree(initialTree);
  }, [initialTree]);

  async function loadFile(path: string) {
    setLoading(true);
    setSelectedFilePath(path);
    const response = await fetch(`/api/files?projectSlug=${projectSlug}&path=${encodeURIComponent(path)}`);
    setLoading(false);
    if (!response.ok) {
      toast.error('No se pudo abrir el archivo.');
      return;
    }
    const data = await response.json();
    setContent(data.content);
  }

  async function saveFile(path: string) {
    const response = await fetch('/api/files', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectSlug, path, content }),
    });
    if (!response.ok) {
      toast.error('No se pudo guardar el archivo.');
      return;
    }
    toast.success('Archivo guardado.');
  }

  async function createFile() {
    if (!newPath.trim()) return;
    await fetch('/api/files', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectSlug, path: newPath, content: '' }),
    });
    const response = await fetch(`/api/files?projectSlug=${projectSlug}`);
    const data = await response.json();
    setTree(data.tree);
    setSelectedFilePath(newPath);
    setContent('');
  }

  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <div className="border-b border-white/5 p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-muted">Workspace files</p>
        <h2 className="mt-2 text-2xl font-semibold">Explorador</h2>
        <div className="mt-4 flex items-center gap-2">
          <Input value={newPath} onChange={(event) => setNewPath(event.target.value)} data-testid="file-create-path-input" />
          <Button type="button" variant="outline" onClick={createFile} data-testid="file-create-button">Crear</Button>
        </div>
      </div>

      <div className="grid min-h-0 grid-rows-[280px_1fr] lg:grid-rows-[320px_1fr]">
        <div className="scrollbar-thin overflow-y-auto border-b border-white/5 p-3">
          {tree.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-white/10 bg-black/10 px-6 text-center text-sm text-zinc-500" data-testid="empty-files-state">
              No hay archivos todavía.
            </div>
          ) : (
            tree.map((node) => <TreeBranch key={node.path} node={node} onSelect={(value) => loadFile(value.path)} />)
          )}
        </div>

        <div className="flex min-h-0 flex-col p-4">
          <div className="mb-3 flex items-center justify-between gap-3 text-sm text-zinc-400">
            <span data-testid="selected-file-path">{selectedFilePath || 'Selecciona un archivo para editar'}</span>
            {selectedFilePath ? <Button type="button" onClick={() => saveFile(selectedFilePath)} className="gap-2" data-testid="file-save-button"><Save className="h-4 w-4" />Guardar</Button> : null}
          </div>
          <Textarea value={content} onChange={(event) => setContent(event.target.value)} rows={18} className="h-full min-h-[320px] flex-1 font-mono text-xs" disabled={!selectedFilePath || loading} data-testid="file-editor-textarea" />
        </div>
      </div>
    </div>
  );
}