import { NextResponse } from 'next/server';
import { getWorkspaceTree, searchWorkspace, getImportantPaths, indexWorkspace, getFileMetadata, readWorkspaceFile } from '@/lib/repo-intelligence';
import { isFeatureEnabled } from '@/lib/feature-flags';

// GET /api/projects/[slug]/repo - Get repo context
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'tree';
  const path = searchParams.get('path');
  const query = searchParams.get('query');
  
  if (!isFeatureEnabled('USE_REPO_INTELLIGENCE')) {
    return NextResponse.json({
      message: 'Repo intelligence not enabled. Set USE_REPO_INTELLIGENCE flag.',
      legacy: true
    });
  }
  
  try {
    switch (action) {
      case 'tree': {
        const tree = await getWorkspaceTree(slug);
        return NextResponse.json({ tree, count: tree.length });
      }
      
      case 'search': {
        const results = await searchWorkspace(slug, query || '');
        return NextResponse.json({ results, count: results.length });
      }
      
      case 'important': {
        const paths = await getImportantPaths(slug);
        return NextResponse.json({ paths, count: paths.length });
      }
      
      case 'index': {
        const index = await indexWorkspace(slug);
        return NextResponse.json(index);
      }
      
      case 'file': {
        if (!path) {
          return NextResponse.json({ error: 'path required' }, { status: 400 });
        }
        const metadata = await getFileMetadata(slug, path);
        if (!metadata) {
          return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }
        return NextResponse.json(metadata);
      }
      
      case 'read': {
        if (!path) {
          return NextResponse.json({ error: 'path required' }, { status: 400 });
        }
        const content = await readWorkspaceFile(slug, path);
        return NextResponse.json({ content, path });
      }
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
