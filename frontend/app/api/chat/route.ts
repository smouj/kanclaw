import { NextResponse } from 'next/server';
import { z } from 'zod';
import { executeDelegationActions, parseDelegationActions } from '@/lib/delegation';
import { prisma } from '@/lib/prisma';
import { ensureProjectThreads } from '@/lib/project-os';
import { sendOpenClawTask } from '@/lib/openclaw';

const chatSchema = z.object({
  projectSlug: z.string().min(1),
  threadId: z.string().min(1),
  targetAgentName: z.string().optional().default(''),
  content: z.string().min(1),
});

function messageFromBody(body: unknown) {
  if (typeof body === 'string') return body;
  if (body && typeof body === 'object' && 'message' in body && typeof body.message === 'string') {
    return body.message;
  }
  return JSON.stringify(body, null, 2);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectSlug = searchParams.get('projectSlug');
  if (!projectSlug) {
    return NextResponse.json({ error: 'Falta projectSlug.' }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    include: {
      chatThreads: {
        orderBy: { updatedAt: 'desc' },
        include: { messages: { orderBy: { createdAt: 'asc' }, take: 120 }, agent: true },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: 'Proyecto no encontrado.' }, { status: 404 });
  }

  await ensureProjectThreads(project.id);

  const refreshed = await prisma.project.findUnique({
    where: { slug: projectSlug },
    include: {
      chatThreads: {
        orderBy: { updatedAt: 'desc' },
        include: { messages: { orderBy: { createdAt: 'asc' }, take: 120 }, agent: true },
      },
    },
  });

  return NextResponse.json(refreshed?.chatThreads || []);
}

export async function POST(request: Request) {
  try {
    const payload = chatSchema.parse(await request.json());
    const project = await prisma.project.findUnique({
      where: { slug: payload.projectSlug },
      include: { agents: true, chatThreads: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado.' }, { status: 404 });
    }

    const thread = project.chatThreads.find((item) => item.id === payload.threadId);
    if (!thread) {
      return NextResponse.json({ error: 'Hilo de chat no encontrado.' }, { status: 404 });
    }

    const fallbackAgentName = project.agents.find((agent) => agent.id === thread.agentId)?.name || project.agents[0]?.name || '';
    const targetAgentName = payload.targetAgentName || fallbackAgentName;
    if (!targetAgentName) {
      return NextResponse.json({ error: 'No hay agentes disponibles para este chat.' }, { status: 400 });
    }

    const targetAgent = project.agents.find((agent) => agent.name === targetAgentName);
    if (!targetAgent) {
      return NextResponse.json({ error: 'Agente no encontrado.' }, { status: 404 });
    }

    await prisma.chatMessage.create({
      data: {
        threadId: thread.id,
        role: 'human',
        actor: 'Human',
        targetAgentName,
        content: payload.content,
      },
    });

    await prisma.agent.update({ where: { id: targetAgent.id }, data: { status: 'thinking' } });

    const run = await prisma.run.create({
      data: {
        projectId: project.id,
        agentId: targetAgent.id,
        threadId: thread.id,
        origin: 'chat',
        title: `Chat · ${targetAgentName}`,
        status: 'running',
        input: payload.content,
        metadata: JSON.stringify({ threadId: thread.id, targetAgentName }),
      },
    });

    let response: Response;
    try {
      response = await sendOpenClawTask({
        projectSlug: project.slug,
        agentName: targetAgentName,
        prompt: payload.content,
      });
    } catch {
      await prisma.run.update({ where: { id: run.id }, data: { status: 'failed', output: 'OpenClaw offline' } });
      await prisma.agent.update({ where: { id: targetAgent.id }, data: { status: 'idle' } });
      await prisma.chatMessage.create({
        data: {
          threadId: thread.id,
          role: 'system',
          actor: 'System',
          targetAgentName,
          content: 'OpenClaw no está disponible. El mensaje quedó registrado, pero no se pudo despachar al agente.',
          metadata: JSON.stringify({ reason: 'gateway_unreachable', runId: run.id }),
        },
      });
      return NextResponse.json({ error: 'OpenClaw no está disponible.' }, { status: 503 });
    }

    const contentType = response.headers.get('content-type') || '';
    const body = contentType.includes('application/json') ? await response.json() : await response.text();

    if (!response.ok) {
      await prisma.run.update({ where: { id: run.id }, data: { status: 'failed', output: messageFromBody(body) } });
      await prisma.agent.update({ where: { id: targetAgent.id }, data: { status: 'idle' } });
      await prisma.chatMessage.create({
        data: {
          threadId: thread.id,
          role: 'system',
          actor: 'System',
          targetAgentName,
          content: messageFromBody(body),
          metadata: JSON.stringify({ responseStatus: response.status, runId: run.id }),
        },
      });
      return NextResponse.json({ error: 'OpenClaw rechazó el mensaje.', details: body }, { status: response.status });
    }

    const actions = parseDelegationActions(typeof body === 'string' ? body : body.actions || body.message || body);
    const executedActions = await executeDelegationActions(project.slug, project.id, actions, { sourceRunId: run.id, originThreadId: thread.id });
    await prisma.run.update({ where: { id: run.id }, data: { status: 'completed', output: messageFromBody(body), metadata: JSON.stringify({ executedActions, targetAgentName }) } });
    await prisma.agent.update({ where: { id: targetAgent.id }, data: { status: 'idle' } });
    await prisma.chatMessage.create({
      data: {
        threadId: thread.id,
        role: 'agent',
        actor: targetAgentName,
        targetAgentName,
        content: messageFromBody(body),
        metadata: JSON.stringify({ executedActions, runId: run.id }),
      },
    });

    await prisma.activityLog.create({
      data: {
        projectId: project.id,
        actor: targetAgentName,
        action: 'chat_message_completed',
        details: JSON.stringify({ runId: run.id, threadId: thread.id, executedActions }),
      },
    });

    const refreshed = await prisma.chatThread.findUnique({
      where: { id: thread.id },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 120 }, agent: true },
    });

    return NextResponse.json({ ok: true, thread: refreshed, runId: run.id, executedActions });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: 'No se pudo enviar el mensaje al agente.' }, { status: 500 });
  }
}