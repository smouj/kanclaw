import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { appendProjectFile, writeProjectFile } from '@/utils/fs';

const actionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('create_subtask'),
    to: z.string().min(1),
    title: z.string().min(1),
    description: z.string().optional().default(''),
  }),
  z.object({
    action: z.literal('append_decision'),
    summary: z.string().min(1),
  }),
  z.object({
    action: z.literal('append_knowledge'),
    file: z.string().regex(/^knowledge\/.+/),
    content: z.string().min(1),
  }),
  z.object({
    action: z.literal('create_artifact'),
    path: z.string().regex(/^artifacts\/.+/),
    content: z.record(z.any()),
  }),
]);

type ParsedAction = z.infer<typeof actionSchema>;

export interface DelegationExecutionResult {
  kind: 'task' | 'decision' | 'knowledge' | 'artifact';
  label: string;
  taskId?: string;
  path?: string;
  agentName?: string;
}

function extractJsonChunks(text: string) {
  const matches = [...text.matchAll(/```json\s*([\s\S]*?)```/g)].map((match) => match[1]);
  if (matches.length > 0) {
    return matches;
  }

  if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
    return [text];
  }

  return [];
}

export function parseDelegationActions(input: unknown): ParsedAction[] {
  const parsed: ParsedAction[] = [];

  const candidates: unknown[] = [];
  if (Array.isArray(input)) {
    candidates.push(...input);
  } else if (typeof input === 'object' && input && 'actions' in input && Array.isArray((input as { actions: unknown[] }).actions)) {
    candidates.push(...(input as { actions: unknown[] }).actions);
  } else if (typeof input === 'string') {
    for (const chunk of extractJsonChunks(input)) {
      try {
        const value = JSON.parse(chunk);
        if (Array.isArray(value)) {
          candidates.push(...value);
        } else {
          candidates.push(value);
        }
      } catch {
        continue;
      }
    }
  }

  for (const candidate of candidates) {
    const result = actionSchema.safeParse(candidate);
    if (result.success) {
      parsed.push(result.data);
    }
  }

  return parsed;
}

export async function executeDelegationActions(
  projectSlug: string,
  projectId: string,
  actions: ParsedAction[],
  context?: { sourceRunId?: string; originThreadId?: string },
) {
  const executed: DelegationExecutionResult[] = [];

  for (const action of actions) {
    if (action.action === 'create_subtask') {
      const agent = await prisma.agent.findFirst({
        where: { projectId, name: action.to },
      });

      if (!agent) {
        continue;
      }

      const createdTask = await prisma.task.create({
        data: {
          projectId,
          title: action.title,
          description: action.description,
          status: 'TODO',
          assigneeAgentId: agent.id,
          sourceRunId: context?.sourceRunId,
          originThreadId: context?.originThreadId,
        },
      });

      executed.push({ kind: 'task', label: `Subtask created for ${action.to}`, taskId: createdTask.id, agentName: action.to });
    }

    if (action.action === 'append_decision') {
      await appendProjectFile(projectSlug, 'decisions/decision-log.md', `\n- ${action.summary}`);
      executed.push({ kind: 'decision', label: 'Decision appended', path: 'decisions/decision-log.md' });
    }

    if (action.action === 'append_knowledge') {
      await appendProjectFile(projectSlug, action.file, `\n${action.content}\n`);
      executed.push({ kind: 'knowledge', label: `Knowledge updated: ${action.file}`, path: action.file });
    }

    if (action.action === 'create_artifact') {
      await writeProjectFile(projectSlug, action.path, JSON.stringify(action.content, null, 2));
      executed.push({ kind: 'artifact', label: `Artifact created: ${action.path}`, path: action.path });
    }

    await prisma.activityLog.create({
      data: {
        projectId,
        actor: 'System',
        action: action.action,
        details: JSON.stringify({ action, ...context }),
      },
    });
  }

  return executed;
}