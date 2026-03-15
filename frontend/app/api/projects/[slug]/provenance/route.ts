import { NextResponse } from 'next/server';
import { buildProjectProvenanceGraph, buildMessageProvenance, getRunProvenance } from '@/lib/provenance';
import { isFeatureEnabled } from '@/lib/feature-flags';

// GET /api/projects/[slug]/provenance - Get project provenance graph
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const messageId = searchParams.get('messageId');
  const runId = searchParams.get('runId');
  
  if (!isFeatureEnabled('USE_PROVENANCE_V2')) {
    // Return minimal legacy format
    return NextResponse.json({
      message: 'Provenance V2 not enabled',
      legacy: true
    });
  }
  
  try {
    // If specific message requested
    if (messageId) {
      const provenance = await buildMessageProvenance(messageId);
      if (!provenance) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 });
      }
      return NextResponse.json({ provenance });
    }
    
    // If specific run requested
    if (runId) {
      const result = await getRunProvenance(runId);
      if (!result) {
        return NextResponse.json({ error: 'Run not found' }, { status: 404 });
      }
      return NextResponse.json(result);
    }
    
    // Default: return full graph
    const graph = await buildProjectProvenanceGraph(slug);
    return NextResponse.json({ graph });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
