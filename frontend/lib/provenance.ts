/**
 * KanClaw Provenance Service
 * 
 * Provides enhanced traceability between:
 * - Messages
 * - Runs
 * - Tasks
 * - Files/Artifacts
 * - Decisions
 * - Context used
 * - Models used
 */

import { prisma } from '@/lib/prisma';

export interface ProvenanceNode {
  id: string;
  type: 'message' | 'run' | 'task' | 'artifact' | 'decision' | 'file' | 'context_item';
  title: string;
  snippet: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ProvenanceLink {
  sourceId: string;
  sourceType: string;
  targetId: string;
  targetType: string;
  relationship: string; // 'triggered' | 'created' | 'used' | 'generated' | 'referenced'
}

export interface ExecutionProvenance {
  messageId: string;
  threadId: string;
  agentName: string;
  runId?: string;
  taskIds: string[];
  artifacts: string[];
  decisions: string[];
  contextUsed: ProvenanceNode[];
  model?: string;
  timestamp: string;
  duration?: number;
}

// Build provenance for a message
export async function buildMessageProvenance(messageId: string): Promise<ExecutionProvenance | null> {
  const message = await prisma.chatMessage.findUnique({
    where: { id: messageId },
    include: { thread: { include: { project: true } } }
  });
  
  if (!message) return null;
  
  const metadata = message.metadata ? JSON.parse(message.metadata) : {};
  const runId = metadata.runId || metadata.externalTaskId;
  
  // Find related run
  let run = null;
  if (runId) {
    run = await prisma.run.findFirst({
      where: { 
        OR: [
          { id: runId as string },
          { metadata: { contains: runId as string } }
        ],
        projectId: message.thread.projectId
      }
    });
  }
  
  // Find tasks created from this message/run
  const tasks = run 
    ? await prisma.task.findMany({
        where: { sourceRunId: run.id },
        select: { id: true, title: true, status: true }
      })
    : [];
  
  // Build context used from metadata
  const contextUsed: ProvenanceNode[] = [];
  if (metadata.contextItems && Array.isArray(metadata.contextItems)) {
    for (const ctx of metadata.contextItems) {
      contextUsed.push({
        id: ctx.id || ctx.path || 'unknown',
        type: ctx.kind || 'context_item',
        title: ctx.title || ctx.path || 'Unknown',
        snippet: ctx.snippet || '',
        timestamp: ctx.timestamp || message.createdAt.toISOString()
      });
    }
  }
  
  return {
    messageId: message.id,
    threadId: message.threadId,
    agentName: message.targetAgentName || 'unknown',
    runId: run?.id,
    taskIds: tasks.map(t => t.id),
    artifacts: [], // Would need artifact tracking
    decisions: [], // Would need decision tracking
    contextUsed,
    model: metadata.model,
    timestamp: message.createdAt.toISOString(),
    duration: run ? new Date(run.updatedAt).getTime() - new Date(run.createdAt).getTime() : undefined
  };
}

// Build full provenance graph for a project
export async function buildProjectProvenanceGraph(
  projectSlug: string,
  limit: number = 50
): Promise<{ nodes: ProvenanceNode[]; links: ProvenanceLink[] }> {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true }
  });
  
  if (!project) {
    return { nodes: [], links: [] };
  }
  
  const nodes: ProvenanceNode[] = [];
  const links: ProvenanceLink[] = [];
  
  // Get recent messages
  const messages = await prisma.chatMessage.findMany({
    where: { thread: { projectId: project.id } },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { thread: { select: { id: true, title: true } } }
  });
  
  for (const msg of messages) {
    const metadata = msg.metadata ? JSON.parse(msg.metadata) : {};
    
    nodes.push({
      id: msg.id,
      type: 'message',
      title: `${msg.actor} · ${msg.thread.title}`,
      snippet: msg.content.slice(0, 100),
      timestamp: msg.createdAt.toISOString(),
      metadata: { role: msg.role }
    });
    
    if (metadata.runId) {
      links.push({
        sourceId: msg.id,
        sourceType: 'message',
        targetId: metadata.runId,
        targetType: 'run',
        relationship: 'triggered'
      });
    }
  }
  
  // Get recent runs
  const runs = await prisma.run.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { agent: { select: { name: true } } }
  });
  
  for (const run of runs) {
    nodes.push({
      id: run.id,
      type: 'run',
      title: run.title,
      snippet: [run.status, run.input?.slice(0, 50)].filter(Boolean).join(' · '),
      timestamp: run.createdAt.toISOString(),
      metadata: { status: run.status, agent: run.agent?.name }
    });
    
    // Link to source message if available
    if (run.metadata) {
      try {
        const runMeta = JSON.parse(run.metadata);
        if (runMeta?.threadId) {
          links.push({
            sourceId: runMeta.threadId,
            sourceType: 'message',
            targetId: run.id,
            targetType: 'run',
            relationship: 'triggered'
          });
        }
      } catch {}
    }
    
    // Link to generated tasks
    const tasks = await prisma.task.findMany({
      where: { sourceRunId: run.id },
      select: { id: true, title: true }
    });
    
    for (const task of tasks) {
      links.push({
        sourceId: run.id,
        sourceType: 'run',
        targetId: task.id,
        targetType: 'task',
        relationship: 'created'
      });
      
      nodes.push({
        id: task.id,
        type: 'task',
        title: task.title,
        snippet: '',
        timestamp: '',
        metadata: { status: 'linked' }
      });
    }
  }
  
  // Get recent tasks
  const tasks = await prisma.task.findMany({
    where: { projectId: project.id },
    orderBy: { updatedAt: 'desc' },
    take: limit
  });
  
  for (const task of tasks) {
    const existing = nodes.find(n => n.id === task.id);
    if (!existing) {
      nodes.push({
        id: task.id,
        type: 'task',
        title: task.title,
        snippet: task.description?.slice(0, 100) || '',
        timestamp: task.updatedAt.toISOString(),
        metadata: { status: task.status }
      });
    }
  }
  
  return { nodes, links };
}

// Get run with full provenance
export async function getRunProvenance(runId: string) {
  const run = await prisma.run.findUnique({
    where: { id: runId },
    include: {
      agent: { select: { id: true, name: true, role: true } },
      thread: { select: { id: true, title: true } },
      generatedTasks: { select: { id: true, title: true, status: true } }
    }
  });
  
  if (!run) return null;
  
  const provenance: ExecutionProvenance = {
    messageId: '',
    threadId: run.threadId || '',
    agentName: run.agent?.name || 'unknown',
    runId: run.id,
    taskIds: run.generatedTasks.map(t => t.id),
    artifacts: [],
    decisions: [],
    contextUsed: [],
    timestamp: run.createdAt.toISOString(),
    duration: new Date(run.updatedAt).getTime() - new Date(run.createdAt).getTime()
  };
  
  // Extract context from metadata
  if (run.metadata) {
    try {
      const meta = JSON.parse(run.metadata);
      provenance.contextUsed = (meta.contextItems || []).map((ctx: any) => ({
        id: ctx.id || ctx.path || 'unknown',
        type: ctx.kind || 'context_item',
        title: ctx.title || ctx.path || 'Unknown',
        snippet: ctx.snippet || '',
        timestamp: ctx.timestamp || run.createdAt.toISOString()
      }));
    } catch {}
  }
  
  return { run, provenance };
}
