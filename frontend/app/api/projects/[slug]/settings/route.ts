import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getEffectiveModel, setProjectDefaultModel, setAgentModelOverride, listProjectModelConfigs, AVAILABLE_MODELS } from '@/lib/model-config';
import { isFeatureEnabled } from '@/lib/feature-flags';

// GET /api/projects/[slug]/settings - Get project settings
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  
  const project = await prisma.project.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true }
  });
  
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  
  // Get model configs
  const modelConfigs = await listProjectModelConfigs(slug);
  
  // Get effective model (default)
  const effectiveModel = await getEffectiveModel(slug);
  
  // Check feature flags
  const features = {
    USE_AGENT_MODEL_OVERRIDES: isFeatureEnabled('USE_AGENT_MODEL_OVERRIDES'),
    USE_PROVENANCE_V2: isFeatureEnabled('USE_PROVENANCE_V2'),
    USE_KANCLAW_CONTEXT_ENGINE: isFeatureEnabled('USE_KANCLAW_CONTEXT_ENGINE'),
    USE_MEMORY_ORCHESTRATOR: isFeatureEnabled('USE_MEMORY_ORCHESTRATOR'),
  };
  
  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      slug: project.slug
    },
    modelConfig: {
      effective: effectiveModel,
      defaults: modelConfigs,
      available: AVAILABLE_MODELS
    },
    features
  });
}

// PUT /api/projects/[slug]/settings - Update project settings
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  
  const project = await prisma.project.findUnique({
    where: { slug },
    select: { id: true }
  });
  
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  
  const body = await request.json();
  const { action, provider, model, temperature, maxTokens, agentName } = body;
  
  if (!isFeatureEnabled('USE_AGENT_MODEL_OVERRIDES')) {
    return NextResponse.json({ 
      error: 'Model configuration is not enabled. Set USE_AGENT_MODEL_OVERRIDES flag to enable.' 
    }, { status: 403 });
  }
  
  try {
    if (action === 'setDefault') {
      const config = await setProjectDefaultModel(slug, provider, model, temperature, maxTokens);
      return NextResponse.json({ ok: true, config });
    }
    
    if (action === 'setAgentOverride' && agentName) {
      const config = await setAgentModelOverride(slug, agentName, provider, model, temperature, maxTokens);
      return NextResponse.json({ ok: true, config });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
