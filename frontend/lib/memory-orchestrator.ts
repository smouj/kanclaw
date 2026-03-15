/**
 * KanClaw Memory Orchestrator
 * 
 * Manages hierarchical memory:
 * - Project durable memory (long-term)
 * - Agent-specific memory
 * - Handoff summaries between agents
 * - Periodic compaction
 */

import { prisma } from '@/lib/prisma';

export interface HandoffSummary {
  id: string;
  fromAgent: string;
  toAgent: string;
  summary: string;
  pendingTasks: string[];
  context: Record<string, any>;
  createdAt: Date;
}

export interface MemoryEntry {
  id: string;
  projectId: string;
  agentId?: string;
  type: 'project' | 'agent' | 'handoff' | 'periodic' | 'decision' | 'learning';
  title: string;
  content: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Create a handoff summary when agent transfers work
export async function createHandoffSummary(
  projectSlug: string,
  fromAgentName: string,
  toAgentName: string,
  summary: string,
  pendingTasks: string[] = [],
  context: Record<string, any> = {}
): Promise<HandoffSummary> {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true }
  });
  
  if (!project) {
    throw new Error('Project not found');
  }
  
  const entry = await prisma.memorySummary.create({
    data: {
      projectId: project.id,
      agentId: null, // Handoffs are project-level
      summary,
      context: JSON.stringify({
        fromAgent: fromAgentName,
        toAgent: toAgentName,
        pendingTasks,
        ...context
      }),
      sourceType: 'handoff'
    }
  });
  
  return {
    id: entry.id,
    fromAgent: fromAgentName,
    toAgent: toAgentName,
    summary,
    pendingTasks,
    context,
    createdAt: entry.createdAt
  };
}

// Get memory summaries for a project
export async function getProjectMemorySummaries(
  projectSlug: string,
  limit: number = 20
): Promise<MemoryEntry[]> {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true }
  });
  
  if (!project) return [];
  
  const summaries = await prisma.memorySummary.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
  
  return summaries.map(s => ({
    id: s.id,
    projectId: s.projectId,
    agentId: s.agentId || undefined,
    type: s.sourceType as any,
    title: s.summary.slice(0, 50),
    content: s.summary,
    metadata: s.context ? JSON.parse(s.context) : undefined,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt
  }));
}

// Get handoff history for a project
export async function getHandoffHistory(
  projectSlug: string,
  limit: number = 10
): Promise<HandoffSummary[]> {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true }
  });
  
  if (!project) return [];
  
  const summaries = await prisma.memorySummary.findMany({
    where: { 
      projectId: project.id,
      sourceType: 'handoff'
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
  
  return summaries.map(s => {
    const ctx = s.context ? JSON.parse(s.context) : {};
    return {
      id: s.id,
      fromAgent: ctx.fromAgent || 'unknown',
      toAgent: ctx.toAgent || 'unknown',
      summary: s.summary,
      pendingTasks: ctx.pendingTasks || [],
      context: ctx,
      createdAt: s.createdAt
    };
  });
}

// Generate periodic summary from recent activity
export async function generatePeriodicSummary(
  projectSlug: string,
  options: {
    focus?: string;
    agentName?: string;
  } = {}
): Promise<string> {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    include: {
      runs: { orderBy: { createdAt: 'desc' }, take: 10 },
      tasks: { orderBy: { updatedAt: 'desc' }, take: 10 },
      chatThreads: { 
        include: { messages: { orderBy: { createdAt: 'desc' }, take: 5 } }
      }
    }
  });
  
  if (!project) {
    throw new Error('Project not found');
  }
  
  // Build summary from recent activity
  const parts: string[] = [];
  
  if (project.runs.length > 0) {
    const completed = project.runs.filter(r => r.status === 'completed').length;
    const failed = project.runs.filter(r => r.status === 'failed').length;
    parts.push(`Runs: ${completed} completados, ${failed} fallidos de ${project.runs.length} totales`);
  }
  
  if (project.tasks.length > 0) {
    const pending = project.tasks.filter(t => t.status === 'pending').length;
    const done = project.tasks.filter(t => t.status === 'done').length;
    parts.push(`Tasks: ${done} completadas, ${pending} pendientes`);
  }
  
  const recentMessages = project.chatThreads.flatMap(t => t.messages).slice(0, 10);
  if (recentMessages.length > 0) {
    parts.push(`Mensajes recientes: ${recentMessages.length}`);
  }
  
  // Save as periodic summary
  const summary = parts.join('. ') || 'Sin actividad reciente';
  
  await prisma.memorySummary.create({
    data: {
      projectId: project.id,
      agentId: null,
      summary,
      context: JSON.stringify({ focus: options.focus, agentName: options.agentName }),
      sourceType: 'periodic'
    }
  });
  
  return summary;
}

// Get memory for context (curated, not everything)
export async function getCuratedMemoryForContext(
  projectSlug: string,
  query: string,
  maxTokens: number = 2000
): Promise<{ content: string; entries: MemoryEntry[] }> {
  const summaries = await getProjectMemorySummaries(projectSlug, 50);
  
  // Score by relevance to query
  const scored = summaries.map(entry => ({
    entry,
    score: query 
      ? (entry.content.toLowerCase().includes(query.toLowerCase()) ? 10 : 0) +
        (entry.title.toLowerCase().includes(query.toLowerCase()) ? 5 : 0)
      : 1
  }));
  
  // Sort and take top relevant
  scored.sort((a, b) => b.score - a.score);
  
  const selected = scored.slice(0, 10);
  const content = selected.map(s => s.entry.content).join('\n\n');
  
  return {
    content,
    entries: selected.map(s => s.entry)
  };
}

// Delete old summaries (cleanup)
export async function cleanupOldSummaries(
  projectSlug: string,
  keepCount: number = 50
): Promise<number> {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true }
  });
  
  if (!project) return 0;
  
  const count = await prisma.memorySummary.count({
    where: { projectId: project.id }
  });
  
  if (count <= keepCount) return 0;
  
  const toDelete = await prisma.memorySummary.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: 'asc' },
    take: count - keepCount,
    select: { id: true }
  });
  
  await prisma.memorySummary.deleteMany({
    where: { id: { in: toDelete.map(d => d.id) } }
  });
  
  return toDelete.length;
}
