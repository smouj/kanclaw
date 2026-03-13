import { NextResponse } from 'next/server';
import { z } from 'zod';
import { executeDelegationActions, parseDelegationActions } from '@/lib/delegation';
import { prisma } from '@/lib/prisma';
import { sendOpenClawTask } from '@/lib/openclaw';

const schema = z.object({
  projectSlug: z.string().min(1),
  agentName: z.string().min(1),
  prompt: z.string().min(1),
});

function getExternalTaskId(body: unknown) {
  if (!body || typeof body !== 'object') return null;
  if ('taskId' in body && typeof body.taskId === 'string') return body.taskId;
  if ('id' in body && typeof body.id === 'string') return body.id;
  return null;
}

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const project = await prisma.project.findUnique({
      where: { slug: payload.projectSlug },
      include: { agents: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado.' }, { status: 404 });
    }

    const agent = project.agents.find((item) => item.name === payload.agentName);
    if (!agent) {
      return NextResponse.json({ error: 'Agente no encontrado.' }, { status: 404 });
    }

    await prisma.activityLog.create({
      data: {
        projectId: project.id,
        actor: 'Human',
        action: 'task_send_requested',
        details: JSON.stringify({ agentName: payload.agentName, prompt: payload.prompt }),
      },
    });

    const task = await prisma.task.create({
      data: {
        projectId: project.id,
        title: payload.prompt.split('\n')[0].slice(0, 80),
        description: payload.prompt,
        status: 'RUNNING',
        assigneeAgentId: agent.id,
      },
    });

    const run = await prisma.run.create({
      data: {
        projectId: project.id,
        taskId: task.id,
        agentId: agent.id,
        origin: 'manual_dispatch',
        title: task.title,
        status: 'running',
        input: payload.prompt,
      },
    });

    let response: Response;
    try {
      response = await sendOpenClawTask(payload);
    } catch {
      await prisma.activityLog.create({
        data: {
          projectId: project.id,
          actor: 'System',
          action: 'task_send_failed',
          details: JSON.stringify({ reason: 'gateway_unreachable' }),
        },
      });
      await prisma.task.update({ where: { id: task.id }, data: { status: 'TODO' } });
      await prisma.run.update({ where: { id: run.id }, data: { status: 'failed', output: 'OpenClaw offline' } });
      return NextResponse.json(
        { error: 'OpenClaw no está disponible. Revisa OPENCLAW_HTTP, OPENCLAW_WS y el Bearer token.' },
        { status: 503 },
      );
    }

    const contentType = response.headers.get('content-type') || '';
    const body = contentType.includes('application/json') ? await response.json() : await response.text();

    if (!response.ok) {
      await prisma.activityLog.create({
        data: {
          projectId: project.id,
          actor: 'System',
          action: 'task_send_failed',
          details: JSON.stringify({ body, status: response.status }),
        },
      });
      await prisma.task.update({ where: { id: task.id }, data: { status: 'TODO' } });
      await prisma.run.update({ where: { id: run.id }, data: { status: 'failed', output: typeof body === 'string' ? body : JSON.stringify(body) } });
      return NextResponse.json({ error: 'OpenClaw rechazó la tarea.', details: body }, { status: response.status });
    }

    const actions = parseDelegationActions(typeof body === 'string' ? body : body.actions || body.message || body);
    const executedActions = await executeDelegationActions(project.slug, project.id, actions, { sourceRunId: run.id });
    const externalTaskId = getExternalTaskId(body);
    await prisma.run.update({
      where: { id: run.id },
      data: { status: 'completed', output: typeof body === 'string' ? body : JSON.stringify(body), metadata: JSON.stringify({ executedActions, externalTaskId }) },
    });

    await prisma.activityLog.create({
      data: {
        projectId: project.id,
        actor: payload.agentName,
        action: 'task_sent_to_openclaw',
        details: JSON.stringify({ response: body, executedActions }),
      },
    });

    return NextResponse.json({ ok: true, taskId: task.id, response: body, executedActions });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: 'No se pudo enviar la tarea a OpenClaw.' }, { status: 500 });
  }
}