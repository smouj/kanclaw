import { NextResponse } from 'next/server';
import { getProjectMemorySummaries, getHandoffHistory, createHandoffSummary, generatePeriodicSummary, getCuratedMemoryForContext } from '@/lib/memory-orchestrator';
import { isFeatureEnabled } from '@/lib/feature-flags';

// GET /api/projects/[slug]/memory - Get project memory
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'all', 'handoffs', 'curated'
  const query = searchParams.get('query'); // For curated context
  
  if (!isFeatureEnabled('USE_MEMORY_ORCHESTRATOR')) {
    return NextResponse.json({
      message: 'Memory orchestrator not enabled. Set USE_MEMORY_ORCHESTRATOR flag.',
      legacy: true
    });
  }
  
  try {
    if (type === 'handoffs') {
      const handoffs = await getHandoffHistory(slug);
      return NextResponse.json({ handoffs });
    }
    
    if (type === 'curated' && query) {
      const memory = await getCuratedMemoryForContext(slug, query);
      return NextResponse.json(memory);
    }
    
    // Default: all summaries
    const summaries = await getProjectMemorySummaries(slug);
    return NextResponse.json({ summaries });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST /api/projects/[slug]/memory - Create memory entry
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  
  if (!isFeatureEnabled('USE_MEMORY_ORCHESTRATOR')) {
    return NextResponse.json({
      error: 'Memory orchestrator not enabled'
    }, { status: 403 });
  }
  
  try {
    const body = await request.json();
    const { action, fromAgent, toAgent, summary, pendingTasks, focus, agentName } = body;
    
    if (action === 'handoff' && fromAgent && toAgent && summary) {
      const handoff = await createHandoffSummary(slug, fromAgent, toAgent, summary, pendingTasks);
      return NextResponse.json({ ok: true, handoff });
    }
    
    if (action === 'periodic') {
      const summaryText = await generatePeriodicSummary(slug, { focus, agentName });
      return NextResponse.json({ ok: true, summary: summaryText });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
