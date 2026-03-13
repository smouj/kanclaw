import 'server-only';

import { prisma } from '@/lib/prisma';

const SUPPORTED_EVENTS = new Set(['agent_started', 'task_started', 'task_progress', 'task_finished', 'task_failed', 'log', 'error']);

export interface NormalizedOpenClawEvent {
  type: string;
  projectSlug?: string;
  taskId?: string;
  agentName?: string;
  message: string;
  timestamp: string;
  raw: Record<string, unknown>;
}

export function normalizeOpenClawEvent(raw: Record<string, unknown>): NormalizedOpenClawEvent {
  const type = typeof raw.type === 'string' && SUPPORTED_EVENTS.has(raw.type) ? raw.type : 'log';
  return {
    type,
    projectSlug: typeof raw.projectSlug === 'string' ? raw.projectSlug : undefined,
    taskId: typeof raw.taskId === 'string' ? raw.taskId : undefined,
    agentName: typeof raw.agentName === 'string' ? raw.agentName : undefined,
    message: typeof raw.message === 'string' ? raw.message : JSON.stringify(raw),
    timestamp: typeof raw.timestamp === 'string' ? raw.timestamp : new Date().toISOString(),
    raw,
  };
}

export async function persistOpenClawEvent(event: NormalizedOpenClawEvent) {
  if (!event.projectSlug) {
    return;
  }

  const project = await prisma.project.findUnique({
    where: { slug: event.projectSlug },
    include: {
      chatThreads: true,
      runs: { orderBy: { createdAt: 'desc' }, take: 40 },
      tasks: { orderBy: { updatedAt: 'desc' }, take: 60 },
      agents: true,
    },
  });

  if (!project) {
    return;
  }

  const matchedRun = project.runs.find((run) => {
    if (run.taskId && event.taskId && run.taskId === event.taskId) return true;
    if (!run.metadata) return false;
    try {
      const metadata = JSON.parse(run.metadata) as Record<string, unknown>;
      return typeof metadata.externalTaskId === 'string' && metadata.externalTaskId === event.taskId;
    } catch {
      return false;
    }
  }) || project.runs.find((run) => run.status === 'running' && (!event.agentName || run.agentId === project.agents.find((agent) => agent.name === event.agentName)?.id));

  const matchedTask = project.tasks.find((task) => task.id === event.taskId) || project.tasks.find((task) => matchedRun?.taskId === task.id);
  const matchedThread = project.chatThreads.find((thread) => thread.id === matchedRun?.threadId) || project.chatThreads.find((thread) => thread.scope === 'TEAM');
  const matchedAgent = project.agents.find((agent) => agent.name === event.agentName);

  const runStatus = event.type === 'task_finished' ? 'completed' : event.type === 'task_failed' || event.type === 'error' ? 'failed' : 'running';
  const taskStatus = event.type === 'task_finished' ? 'DONE' : event.type === 'task_failed' || event.type === 'error' ? 'TODO' : 'RUNNING';

  if (matchedRun) {
    await prisma.run.update({
      where: { id: matchedRun.id },
      data: {
        status: runStatus,
        output: event.type === 'task_finished' || event.type === 'task_failed' ? event.message : matchedRun.output,
      },
    });
  }

  if (matchedTask) {
    await prisma.task.update({ where: { id: matchedTask.id }, data: { status: taskStatus } });
  }

  if (matchedAgent) {
    await prisma.agent.update({ where: { id: matchedAgent.id }, data: { status: event.type === 'task_started' || event.type === 'task_progress' ? 'working' : 'idle' } });
  }

  await prisma.activityLog.create({
    data: {
      projectId: project.id,
      actor: event.agentName || 'OpenClaw',
      action: `openclaw_${event.type}`,
      details: JSON.stringify(event.raw),
    },
  });

  if (matchedThread && ['task_progress', 'task_finished', 'task_failed', 'error'].includes(event.type)) {
    await prisma.chatMessage.create({
      data: {
        threadId: matchedThread.id,
        role: event.type === 'error' || event.type === 'task_failed' ? 'system' : 'agent',
        actor: event.agentName || 'OpenClaw',
        targetAgentName: event.agentName,
        content: event.message,
        metadata: JSON.stringify({ linkedRunId: matchedRun?.id, linkedTaskId: matchedTask?.id, source: 'openclaw_event', type: event.type }),
      },
    });
  }
}