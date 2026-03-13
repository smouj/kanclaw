'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { DndContext, DragEndEvent, PointerSensor, closestCorners, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
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
}: {
  status: (typeof columns)[number];
  children: ReactNode;
  count: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { status } });

  return (
    <section className="panel-muted flex min-h-[440px] flex-col p-4 transition">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium tracking-[0.22em] text-zinc-300">{status}</h3>
        <span className="text-xs text-zinc-500">{count}</span>
      </div>
      <div
        ref={setNodeRef}
        id={status}
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
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    setMounted(true);
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

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeTaskId = String(active.id);
    const destinationFromOver =
      typeof over.data.current?.status === 'string'
        ? over.data.current.status
        : typeof over.data.current?.sortable?.containerId === 'string'
          ? over.data.current.sortable.containerId
          : typeof over.id === 'string' && columns.includes(over.id as (typeof columns)[number])
            ? over.id
            : null;

    if (!destinationFromOver || !columns.includes(destinationFromOver as (typeof columns)[number])) {
      return;
    }

    const nextStatus = destinationFromOver;

    const currentTask = tasks.find((task) => task.id === activeTaskId);
    if (!currentTask || currentTask.status === nextStatus) return;

    await moveTask(activeTaskId, nextStatus, currentTask);
  }

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

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="grid h-full gap-4 xl:grid-cols-3">
          {columns.map((status) => (
            <KanbanColumn key={status} status={status} count={tasksByStatus[status].length}>
              <SortableContext items={tasksByStatus[status].map((task) => task.id)} strategy={verticalListSortingStrategy}>
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
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </KanbanColumn>
          ))}
        </div>
      </DndContext>
    </div>
  );
}