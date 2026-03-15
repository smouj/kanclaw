import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { listWorkspaceSection, readWorkspacePreview } from '@/utils/fs';
import { isFeatureEnabled, isFeatureEnabledForProject } from '@/lib/feature-flags';

export interface ContextPackItem {
  id: string;
  type: 'project_memory' | 'knowledge' | 'decision' | 'artifact' | 'run' | 'task' | 'message' | 'import';
  title: string;
  content: string;
  relevance: number;
  source: string;
  priority: 'core' | 'supporting' | 'optional';
}

export interface ContextPack {
  projectSlug: string;
  agentName?: string;
  query: string;
  items: ContextPackItem[];
  metadata: {
    totalItems: number;
    tokenEstimate: number;
    generatedAt: string;
    engine: 'legacy' | 'v2';
  };
}

// Build a context pack for a query
async function buildContextPack(
  projectSlug: string,
  query: string,
  agentName?: string,
  maxItems: number = 12,
  maxTokens: number = 4000
): Promise<ContextPack> {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    include: {
      runs: { orderBy: { createdAt: 'desc' }, take: 20 },
      tasks: { orderBy: { updatedAt: 'desc' }, take: 20 },
      imports: { orderBy: { updatedAt: 'desc' }, take: 8 },
      chatThreads: {
        include: { messages: { orderBy: { createdAt: 'desc' }, take: 15 } }
      }
    }
  });
  
  if (!project) {
    throw new Error('Project not found');
  }
  
  // Fetch workspace files
  const [projectMemory, knowledge, decisions, artifacts] = await Promise.all([
    readWorkspacePreview(projectSlug, 'project-memory.md', 1500).catch(() => ''),
    listWorkspaceSection(projectSlug, 'knowledge'),
    listWorkspaceSection(projectSlug, 'decisions'),
    listWorkspaceSection(projectSlug, 'artifacts'),
  ]);
  
  const items: ContextPackItem[] = [];
  let tokenEstimate = 0;
  
  // Scoring based on relevance to query
  const scoreMatch = (text: string): number => {
    const q = query.toLowerCase();
    const t = text.toLowerCase();
    if (t.includes(q)) return 10;
    const qWords = q.split(/\s+/).filter(w => w.length > 2);
    return qWords.filter(w => t.includes(w)).length * 3;
  };
  
  // Core: Project Memory (always important)
  if (projectMemory) {
    items.push({
      id: 'project-memory',
      type: 'project_memory',
      title: 'Project Memory',
      content: projectMemory.slice(0, 800),
      relevance: 10,
      source: 'project-memory.md',
      priority: 'core'
    });
    tokenEstimate += projectMemory.slice(0, 800).split(/\s+/).length * 1.3;
  }
  
  // Supporting: Recent relevant runs
  for (const run of project.runs) {
    const score = scoreMatch(run.title + ' ' + (run.input || '') + ' ' + (run.output || ''));
    if (score > 0 || items.length < 6) {
      items.push({
        id: `run:${run.id}`,
        type: 'run',
        title: run.title,
        content: [run.status, run.input, run.output].filter(Boolean).join('\n').slice(0, 500),
        relevance: score || 1,
        source: `run:${run.id}`,
        priority: score > 3 ? 'supporting' : 'optional'
      });
      tokenEstimate += 150;
    }
  }
  
  // Supporting: Knowledge files
  for (const file of knowledge.slice(0, 8)) {
    const preview = await readWorkspacePreview(projectSlug, file.path, 400).catch(() => '');
    const score = scoreMatch(file.name + ' ' + preview);
    if (score > 0 || items.length < maxItems) {
      items.push({
        id: `knowledge:${file.path}`,
        type: 'knowledge',
        title: file.name,
        content: preview || file.path,
        relevance: score || 2,
        source: file.path,
        priority: 'supporting'
      });
      tokenEstimate += 100;
    }
  }
  
  // Supporting: Decisions
  for (const file of decisions.slice(0, 6)) {
    const preview = await readWorkspacePreview(projectSlug, file.path, 400).catch(() => '');
    const score = scoreMatch(file.name + ' ' + preview);
    if (score > 0 || items.length < maxItems) {
      items.push({
        id: `decision:${file.path}`,
        type: 'decision',
        title: file.name,
        content: preview || file.path,
        relevance: score || 3,
        source: file.path,
        priority: 'supporting'
      });
      tokenEstimate += 80;
    }
  }
  
  // Optional: Recent tasks
  for (const task of project.tasks.slice(0, 5)) {
    const score = scoreMatch(task.title + ' ' + (task.description || ''));
    if (score > 0 || items.length < maxItems) {
      items.push({
        id: `task:${task.id}`,
        type: 'task',
        title: task.title,
        content: [task.status, task.description].filter(Boolean).join(' · ').slice(0, 300),
        relevance: score || 1,
        source: `task:${task.id}`,
        priority: 'optional'
      });
      tokenEstimate += 50;
    }
  }
  
  // Sort by relevance and limit
  items.sort((a, b) => b.relevance - a.relevance);
  
  // Adjust token estimate
  const estimatedTokens = Math.min(tokenEstimate, maxTokens);
  
  return {
    projectSlug,
    agentName,
    query,
    items: items.slice(0, maxItems),
    metadata: {
      totalItems: items.length,
      tokenEstimate: estimatedTokens,
      generatedAt: new Date().toISOString(),
      engine: 'v2'
    }
  };
}

// GET /api/projects/[slug]/context - Get context pack for a query
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || '';
  const agentName = searchParams.get('agentName') || undefined;
  const useV2 = await isFeatureEnabledForProject('USE_KANCLAW_CONTEXT_ENGINE', slug);
  
  try {
    // Use legacy if feature flag not enabled
    if (!useV2) {
      return NextResponse.json({
        message: 'Using legacy context engine',
        legacy: true,
        projectSlug: slug,
        query
      });
    }
    
    const pack = await buildContextPack(slug, query, agentName);
    return NextResponse.json(pack);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
