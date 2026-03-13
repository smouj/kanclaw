import 'server-only';

import { prisma } from '@/lib/prisma';
import { listWorkspaceSection, readWorkspacePreview } from '@/utils/fs';

export interface ContextResultItem {
  id: string;
  kind: 'project_memory' | 'knowledge' | 'decision' | 'artifact' | 'run' | 'task' | 'message' | 'import';
  title: string;
  snippet: string;
  score: number;
  path?: string;
  threadId?: string;
  runId?: string;
  taskId?: string;
  timestamp?: string;
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9áéíóúüñ\s/_-]/gi, ' ');
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
}

function scoreContent(queryTokens: string[], ...parts: Array<string | null | undefined>) {
  if (queryTokens.length === 0) return 0;
  const haystack = normalizeText(parts.filter(Boolean).join(' '));
  let score = 0;
  for (const token of queryTokens) {
    if (haystack.includes(token)) {
      score += token.length > 5 ? 4 : 2;
    }
  }
  return score;
}

export async function buildSuperChatContext(projectSlug: string, query: string, targetAgentName?: string) {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    include: {
      runs: { orderBy: { createdAt: 'desc' }, take: 24 },
      tasks: { orderBy: { updatedAt: 'desc' }, take: 24 },
      imports: { orderBy: { updatedAt: 'desc' }, take: 10 },
      chatThreads: {
        include: { messages: { orderBy: { createdAt: 'desc' }, take: 20 }, agent: true },
      },
    },
  });

  if (!project) {
    throw new Error('Proyecto no encontrado.');
  }

  const [projectMemory, knowledge, decisions, artifacts] = await Promise.all([
    readWorkspacePreview(projectSlug, 'project-memory.md', 2200).catch(() => ''),
    listWorkspaceSection(projectSlug, 'knowledge'),
    listWorkspaceSection(projectSlug, 'decisions'),
    listWorkspaceSection(projectSlug, 'artifacts'),
  ]);

  const seedText = query.trim() || targetAgentName || project.name;
  const tokens = tokenize(seedText);
  const results: ContextResultItem[] = [];

  results.push({
    id: 'project-memory',
    kind: 'project_memory',
    title: 'Project Memory',
    snippet: projectMemory.slice(0, 320) || 'Sin memoria de proyecto todavía.',
    score: Math.max(8, scoreContent(tokens, projectMemory, project.name, project.description || '')),
    path: 'project-memory.md',
  });

  for (const file of knowledge.slice(0, 10)) {
    const preview = await readWorkspacePreview(projectSlug, file.path, 320).catch(() => '');
    results.push({
      id: `knowledge:${file.path}`,
      kind: 'knowledge',
      title: file.name,
      snippet: preview || file.path,
      score: scoreContent(tokens, file.name, preview, targetAgentName || ''),
      path: file.path,
      timestamp: file.updatedAt,
    });
  }

  for (const file of decisions.slice(0, 10)) {
    const preview = await readWorkspacePreview(projectSlug, file.path, 320).catch(() => '');
    results.push({
      id: `decision:${file.path}`,
      kind: 'decision',
      title: file.name,
      snippet: preview || file.path,
      score: scoreContent(tokens, file.name, preview),
      path: file.path,
      timestamp: file.updatedAt,
    });
  }

  for (const file of artifacts.slice(0, 12)) {
    const preview = await readWorkspacePreview(projectSlug, file.path, 320).catch(() => '');
    results.push({
      id: `artifact:${file.path}`,
      kind: 'artifact',
      title: file.name,
      snippet: preview || file.path,
      score: scoreContent(tokens, file.name, preview),
      path: file.path,
      timestamp: file.updatedAt,
    });
  }

  for (const run of project.runs) {
    results.push({
      id: `run:${run.id}`,
      kind: 'run',
      title: run.title,
      snippet: [run.status, run.input, run.output].filter(Boolean).join(' · ').slice(0, 320),
      score: scoreContent(tokens, run.title, run.input || '', run.output || '', targetAgentName || ''),
      runId: run.id,
      timestamp: run.createdAt.toISOString(),
    });
  }

  for (const task of project.tasks) {
    results.push({
      id: `task:${task.id}`,
      kind: 'task',
      title: task.title,
      snippet: [task.status, task.description].filter(Boolean).join(' · ').slice(0, 320),
      score: scoreContent(tokens, task.title, task.description || ''),
      taskId: task.id,
      timestamp: task.updatedAt.toISOString(),
    });
  }

  for (const item of project.imports) {
    results.push({
      id: `import:${item.id}`,
      kind: 'import',
      title: item.label,
      snippet: [item.provider, item.summary, item.sourceUrl].filter(Boolean).join(' · ').slice(0, 320),
      score: scoreContent(tokens, item.label, item.summary || '', item.sourceUrl || ''),
      timestamp: item.updatedAt.toISOString(),
    });
  }

  for (const thread of project.chatThreads) {
    for (const message of thread.messages) {
      results.push({
        id: `message:${message.id}`,
        kind: 'message',
        title: `${message.actor} · ${thread.title}`,
        snippet: message.content.slice(0, 320),
        score: scoreContent(tokens, message.actor, message.content, thread.title, targetAgentName || ''),
        threadId: thread.id,
        timestamp: message.createdAt.toISOString(),
      });
    }
  }

  return results
    .sort((a, b) => b.score - a.score || String(b.timestamp || '').localeCompare(String(a.timestamp || '')))
    .slice(0, 12);
}