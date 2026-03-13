'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import type { Agent, Task } from '@prisma/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TaskCardProps {
  projectSlug: string;
  task: Task;
  agents: Agent[];
  subtasks: Task[];
  onSubtaskCreated: (task: Task) => void;
  onDragStart?: (taskId: string) => void;
  onDragEnd?: () => void;
  onPointerDragStart?: (taskId: string) => void;
}

export function TaskCard({ projectSlug, task, agents, subtasks, onSubtaskCreated, onDragStart, onDragEnd, onPointerDragStart }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const assignee = useMemo(() => agents.find((agent) => agent.id === task.assigneeAgentId)?.name, [agents, task.assigneeAgentId]);

  async function handleCreateSubtask() {
    if (!title.trim()) return;
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectSlug,
        title,
        description: '',
        parentTaskId: task.id,
        assigneeAgentId: task.assigneeAgentId,
      }),
    });

    if (!response.ok) {
      toast.error('No se pudo crear la subtarea.');
      return;
    }

    const subtask = await response.json();
    onSubtaskCreated(subtask);
    setTitle('');
    setExpanded(true);
  }

  return (
    <article className="rounded-3xl border border-white/8 bg-white/[0.03] p-4 transition" data-testid={`task-card-${task.id}`}>
      <button
        type="button"
        draggable
        onMouseDown={() => onPointerDragStart?.(task.id)}
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('text/plain', task.id);
          onDragStart?.(task.id);
        }}
        onDragEnd={() => onDragEnd?.()}
        className="w-full cursor-grab text-left active:cursor-grabbing"
        data-testid={`task-drag-handle-${task.id}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="text-sm font-medium text-zinc-100">{task.title}</h4>
            <p className="mt-2 text-xs leading-5 text-zinc-500">{task.description || 'Sin descripción.'}</p>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-zinc-400">{task.status}</span>
        </div>
      </button>

      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-zinc-500">
        <span data-testid={`task-assignee-${task.id}`}>{assignee || 'Sin agente'}</span>
        <button type="button" className="inline-flex items-center gap-1 text-zinc-300" onClick={() => setExpanded((value) => !value)} data-testid={`task-expand-button-${task.id}`}>
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {subtasks.length} subtareas
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-white/5 pt-4" data-testid={`task-subtasks-panel-${task.id}`}>
          {subtasks.length === 0 ? <p className="text-xs text-zinc-500">No hay subtareas todavía.</p> : null}
          {subtasks.map((subtask) => (
            <div key={subtask.id} className="rounded-2xl border border-white/6 bg-black/20 p-3" data-testid={`subtask-item-${subtask.id}`}>
              <p className="text-sm text-zinc-100">{subtask.title}</p>
              <p className="mt-1 text-xs text-zinc-500">{subtask.status}</p>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Nueva subtarea" data-testid={`subtask-input-${task.id}`} />
            <Button type="button" variant="outline" onClick={handleCreateSubtask} data-testid={`subtask-create-button-${task.id}`}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}