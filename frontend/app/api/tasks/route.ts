import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const createTaskSchema = z.object({
  projectSlug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional().default(''),
  status: z.enum(['TODO', 'RUNNING', 'DONE']).optional().default('TODO'),
  assigneeAgentId: z.string().optional().nullable(),
  parentTaskId: z.string().optional().nullable(),
});

const updateTaskSchema = z.object({
  taskId: z.string().min(1),
  status: z.enum(['TODO', 'RUNNING', 'DONE']),
});

export async function POST(request: Request) {
  try {
    const payload = createTaskSchema.parse(await request.json());
    const project = await prisma.project.findUnique({ where: { slug: payload.projectSlug } });
    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado.' }, { status: 404 });
    }

    const task = await prisma.task.create({
      data: {
        projectId: project.id,
        title: payload.title,
        description: payload.description,
        status: payload.status,
        assigneeAgentId: payload.assigneeAgentId || null,
        parentTaskId: payload.parentTaskId || null,
      },
    });

    await prisma.activityLog.create({
      data: {
        projectId: project.id,
        actor: 'Human',
        action: payload.parentTaskId ? 'subtask_created' : 'task_created',
        details: JSON.stringify({ title: task.title, status: task.status }),
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: 'No se pudo crear la tarea.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const payload = updateTaskSchema.parse(await request.json());
    const task = await prisma.task.update({
      where: { id: payload.taskId },
      data: { status: payload.status },
    });

    await prisma.activityLog.create({
      data: {
        projectId: task.projectId,
        actor: 'Human',
        action: 'task_status_changed',
        details: JSON.stringify({ taskId: task.id, status: task.status }),
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: 'No se pudo actualizar la tarea.' }, { status: 500 });
  }
}