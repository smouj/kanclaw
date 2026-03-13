'use client';

import type { DragEvent, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { Agent, Task } from '@prisma/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TaskCard } from '@/components/TaskCard';

const columns = ['TODO', 'RUNNING', 'DONE'] as const;

interface KanbanBoardProps {
  projectSlug: string;
  initialTasks: Task[];
  agents: Agent[];
}

function KanbanColumn({
  status,
  children,
  count,
  isOver,
  onDrop,
  onDragOver,
  onDragEnter,
  onMouseEnter,
  onMouseUp,
}: {
  status: (typeof columns)[number];
  children: ReactNode;
  count: number;
  isOver: boolean;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragEnter: (event: DragEvent<HTMLDivElement>) => void;
  onMouseEnter: () => void;
  onMouseUp: () => void;
}) {
  return (
    <section className="panel-muted flex min-h-[440px] flex-col p-4 transition" onDragOver={onDragOver} onDrop={onDrop} onMouseEnter={onMouseEnter} onMouseUp={onMouseUp}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium tracking-[0.22em] text-zinc-300">{status}</h3>
        <span className="text-xs text-zinc-500">{count}</span>
      </div>
      <div
        id={status}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onMouseEnter={onMouseEnter}
        onMouseUp={onMouseUp}
        className={`flex h-full flex-col gap-3 rounded-[1.75rem] transition ${isOver ? 'bg-white/[0.04]' : ''}`}
        data-testid={`kanban-column-${status.toLowerCase()}`}
      >
        {children}
      </div>
    </section>
  );
}

export function KanbanBoard({ projectSlug, initialTasks, agents }: KanbanBoardProps) {
  const [mounted, setMounted] = useState(false);
  const [tasks, setTasks] = useState(initialTasks);
  const [newTitle, setNewTitle] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<(typeof columns)[number] | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function clearDrag() {
      setDraggedTaskId(null);
      setHoveredColumn(null);
    }

    window.addEventListener('mouseup', clearDrag);
    return () => window.removeEventListener('mouseup', clearDrag);
  }, []);

  const tasksByStatus = useMemo(
    () =>
      columns.reduce(
        (acc, status) => ({
          ...acc,
          [status]: tasks.filter((task) => task.status === status && !task.parentTaskId),
        }),
        {} as Record<(typeof columns)[number], Task[]>,
      ),
    [tasks],
  );

  const subtasksByParent = useMemo(() => {
    return tasks.reduce<Record<string, Task[]>>((acc, task) => {
      if (!task.parentTaskId) return acc;
      acc[task.parentTaskId] = [...(acc[task.parentTaskId] || []), task];
      return acc;
    }, {});
  }, [tasks]);

  async function moveTask(taskId: string, nextStatus: (typeof columns)[number], currentTask?: Task) {
    const taskToMove = currentTask || tasks.find((task) => task.id === taskId);
    if (!taskToMove || taskToMove.status === nextStatus) {
      return;
    }

    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, status: nextStatus } : task)));

    const response = await fetch('/api/tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, status: nextStatus }),
    });

    if (!response.ok) {
      setTasks((current) => current.map((task) => (task.id === taskId ? taskToMove : task)));
      toast.error('No se pudo actualizar el estado.');
      return;
    }

    const updatedTask = await response.json();
    setTasks((current) => current.map((task) => (task.id === taskId ? updatedTask : task)));
  }

  async function handleCreateTask() {
    if (!newTitle.trim()) return;
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectSlug, title: newTitle, description: '', status: 'TODO' }),
    });

    if (!response.ok) {
      toast.error('No se pudo crear la tarea.');
      return;
    }

    const task = await response.json();
    setTasks((current) => [task, ...current]);
    setNewTitle('');
  }

  async function handleColumnDrop(event: DragEvent<HTMLElement>, status: (typeof columns)[number]) {
    event.preventDefault();
    if (!draggedTaskId) {
      setHoveredColumn(null);
      return;
    }

    const currentTask = tasks.find((task) => task.id === draggedTaskId);
    setDraggedTaskId(null);
    setHoveredColumn(null);

    if (!currentTask || currentTask.status === status) {
      return;
    }

    await moveTask(draggedTaskId, status, currentTask);
  }

  if (!mounted) {
    return (
      <div className="flex h-full flex-col gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Execution board</p>
          <h2 className="text-2xl font-semibold">Kanban</h2>
        </div>
        <div className="grid h-full gap-4 xl:grid-cols-3">
          {columns.map((status) => (
            <section key={status} className="panel-muted min-h-[440px] animate-pulse p-4" data-testid={`kanban-loading-${status.toLowerCase()}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Execution board</p>
          <h2 className="text-2xl font-semibold">Kanban</h2>
        </div>
        <div className="flex w-full max-w-xl items-center gap-2">
          <Input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="Crear tarea rápida" data-testid="kanban-create-task-input" />
          <Button type="button" onClick={handleCreateTask} data-testid="kanban-create-task-button">Añadir</Button>
        </div>
      </div>

      <div className="grid h-full gap-4 xl:grid-cols-3">
        {columns.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              count={tasksByStatus[status].length}
              isOver={hoveredColumn === status}
              onDragEnter={(event) => {
                event.preventDefault();
                setHoveredColumn(status);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setHoveredColumn(status);
              }}
              onDrop={(event) => void handleColumnDrop(event, status)}
              onMouseEnter={() => {
                if (draggedTaskId) {
                  setHoveredColumn(status);
                }
              }}
              onMouseUp={() => {
                if (draggedTaskId) {
                  void handleColumnDrop({ preventDefault() {} } as DragEvent<HTMLElement>, status);
                }
              }}
            >
              <div className="flex h-full flex-col gap-3" data-status={status}>
                {tasksByStatus[status].length === 0 ? (
                  <div className="flex h-full min-h-40 items-center justify-center rounded-3xl border border-dashed border-white/10 bg-black/10 px-6 text-center text-sm text-zinc-500" data-testid={`empty-tasks-${status.toLowerCase()}`}>
                    No hay tareas en {status}.
                  </div>
                ) : (
                  tasksByStatus[status].map((task) => (
                    <TaskCard
                      key={task.id}
                      projectSlug={projectSlug}
                      task={task}
                      agents={agents}
                      subtasks={subtasksByParent[task.id] || []}
                      onSubtaskCreated={(subtask) => setTasks((current) => [subtask, ...current])}
                      onDragStart={setDraggedTaskId}
                      onPointerDragStart={setDraggedTaskId}
                      onDragEnd={() => {
                        setDraggedTaskId(null);
                        setHoveredColumn(null);
                      }}
                    />
                  ))
                )}
              </div>
            </KanbanColumn>
          ))}
        </div>
    </div>
  );
}