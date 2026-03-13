import 'server-only';

import { prisma } from '@/lib/prisma';
import { listWorkspaceSection, readProjectFile, readWorkspacePreview } from '@/utils/fs';

function parseDetails(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export async function ensureProjectThreads(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { agents: true, chatThreads: true },
  });

  if (!project) return;

  const existingTeam = project.chatThreads.find((thread) => thread.scope === 'TEAM');
  if (!existingTeam) {
    await prisma.chatThread.create({
      data: {
        projectId: project.id,
        title: 'Team Room',
        scope: 'TEAM',
        summary: 'Canal principal entre humano y agentes',
      },
    });
  }

  for (const agent of project.agents) {
    const existingDirect = project.chatThreads.find((thread) => thread.agentId === agent.id);
    if (!existingDirect) {
      await prisma.chatThread.create({
        data: {
          projectId: project.id,
          agentId: agent.id,
          title: `${agent.name} Direct`,
          scope: 'AGENT',
          summary: `Canal directo con ${agent.name}`,
        },
      });
    }
  }
}

export async function buildProjectOS(slug: string) {
  const existingProject = await prisma.project.findUnique({
    where: { slug },
    include: { agents: true },
  });

  if (!existingProject) {
    return null;
  }

  await ensureProjectThreads(existingProject.id);

  const project = await prisma.project.findUnique({
    where: { slug },
    include: {
      agents: true,
      tasks: { orderBy: { updatedAt: 'desc' } },
      logs: { orderBy: { timestamp: 'desc' }, take: 40 },
      runs: { orderBy: { createdAt: 'desc' }, take: 20 },
      snapshots: { orderBy: { createdAt: 'desc' }, take: 12 },
      imports: { orderBy: { createdAt: 'desc' } },
      chatThreads: {
        orderBy: { updatedAt: 'desc' },
        include: { messages: { orderBy: { createdAt: 'asc' }, take: 60 }, agent: true },
      },
    },
  });

  if (!project) {
    return null;
  }

  const [projectMemory, knowledge, decisions, artifacts] = await Promise.all([
    readProjectFile(slug, 'project-memory.md').catch(() => '# Project Memory\n'),
    listWorkspaceSection(slug, 'knowledge'),
    listWorkspaceSection(slug, 'decisions'),
    listWorkspaceSection(slug, 'artifacts'),
  ]);

  const agentSurfaces = await Promise.all(
    project.agents.map(async (agent) => ({
      ...agent,
      soul: await readWorkspacePreview(slug, `agents/${agent.name}/SOUL.md`, 1000),
      tools: await readWorkspacePreview(slug, `agents/${agent.name}/TOOLS.md`, 1000),
      memory: await readWorkspacePreview(slug, `agents/${agent.name}/memory.md`, 1000),
      assignedTasks: project.tasks.filter((task) => task.assigneeAgentId === agent.id).slice(0, 6),
      recentRuns: project.runs.filter((run) => run.agentId === agent.id).slice(0, 3),
    })),
  );

  const runs = project.runs.map((run) => ({
    ...run,
    metadata: parseDetails(run.metadata),
  }));

  const logs = project.logs.map((log) => ({
    ...log,
    details: parseDetails(log.details),
  }));

  const delegations = logs.filter((log) => ['create_subtask', 'append_decision', 'append_knowledge', 'create_artifact'].includes(log.action));

  return {
    project,
    projectMemory,
    knowledge,
    decisions,
    artifacts,
    runs,
    logs,
    delegations,
    agentSurfaces,
    snapshots: project.snapshots.map((snapshot) => ({
      ...snapshot,
      payload: parseDetails(snapshot.payload),
    })),
    imports: project.imports.map((item) => ({
      ...item,
      metadata: parseDetails(item.metadata),
    })),
    threads: project.chatThreads.map((thread) => ({
      ...thread,
      messages: thread.messages.map((message) => ({
        ...message,
        metadata: parseDetails(message.metadata),
      })),
    })),
  };
}