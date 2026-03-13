'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
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
    <section
      ref={setNodeRef}
      id={status}
      className={`panel-muted flex min-h-[440px] flex-col p-4 transition ${isOver ? 'border-white/20 bg-white/[0.06]' : ''}`}
      data-testid={`kanban-column-${status.toLowerCase()}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium tracking-[0.22em] text-zinc-300">{status}</h3>
        <span className="text-xs text-zinc-500">{count}</span>
      </div>
      {children}
    </section>
  );
}

export function KanbanBoard({ projectSlug, initialTasks, agents }: KanbanBoardProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [newTitle, setNewTitle] = useState('');
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

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
    const nextStatus = String(over.data.current?.status || over.id);

    const currentTask = tasks.find((task) => task.id === activeTaskId);
    if (!currentTask || currentTask.status === nextStatus) return;

    setTasks((current) => current.map((task) => (task.id === activeTaskId ? { ...task, status: nextStatus } : task)));

    const response = await fetch('/api/tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: activeTaskId, status: nextStatus }),
    });

    if (!response.ok) {
      setTasks((current) => current.map((task) => (task.id === activeTaskId ? currentTask : task)));
      toast.error('No se pudo actualizar el estado.');
      return;
    }

    const updatedTask = await response.json();
    setTasks((current) => current.map((task) => (task.id === activeTaskId ? updatedTask : task)));
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
                      <div key={task.id} id={status} data-status={status}>
                        <TaskCard
                          projectSlug={projectSlug}
                          task={task}
                          agents={agents}
                          subtasks={subtasksByParent[task.id] || []}
                          onSubtaskCreated={(subtask) => setTasks((current) => [subtask, ...current])}
                        />
                      </div>
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