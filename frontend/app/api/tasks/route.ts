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
  status: z.enum(['TODO', 'RUNNING', 'DONE']).optional(),
  assigneeAgentId: z.string().nullable().optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
});

const listTasksQuerySchema = z.object({
  projectSlug: z.string().min(1),
  status: z.enum(['TODO', 'RUNNING', 'DONE']).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(100),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = listTasksQuerySchema.safeParse({
    projectSlug: searchParams.get('projectSlug') || '',
    status: searchParams.get('status') || undefined,
    limit: searchParams.get('limit') || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { projectSlug, status, limit } = parsed.data;
  const project = await prisma.project.findUnique({ where: { slug: projectSlug } });
  if (!project) {
    return NextResponse.json({ error: 'Proyecto no encontrado.' }, { status: 404 });
  }

  const tasks = await prisma.task.findMany({
    where: {
      projectId: project.id,
      ...(status ? { status } : {}),
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  });

  return NextResponse.json(tasks);
}

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
        details: JSON.stringify({ title: task.title, status: task.status, assigneeAgentId: task.assigneeAgentId }),
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
    if (!payload.status && payload.assigneeAgentId === undefined && !payload.title && payload.description === undefined) {
      return NextResponse.json({ error: 'No se proporcionaron cambios para actualizar la tarea.' }, { status: 400 });
    }

    const task = await prisma.task.findUnique({ where: { id: payload.taskId } });
    if (!task) {
      return NextResponse.json({ error: 'Tarea no encontrada.' }, { status: 404 });
    }

    const updatedTask = await prisma.task.update({
      where: { id: payload.taskId },
      data: {
        status: payload.status ?? task.status,
        assigneeAgentId: payload.assigneeAgentId === undefined ? task.assigneeAgentId : payload.assigneeAgentId,
        title: payload.title ?? task.title,
        description: payload.description === undefined ? task.description : payload.description,
      },
    });

    await prisma.activityLog.create({
      data: {
        projectId: task.projectId,
        actor: 'Human',
        action: 'task_updated',
        details: JSON.stringify({ taskId: updatedTask.id, status: updatedTask.status, assigneeAgentId: updatedTask.assigneeAgentId }),
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: 'No se pudo actualizar la tarea.' }, { status: 500 });
  }
}
