import { NextResponse } from 'next/server';
import { listGitHubRepositories } from '@/lib/github';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const perPage = parseInt(searchParams.get('per_page') || '100', 10);
  const sort = searchParams.get('sort') || 'updated';
  const direction = searchParams.get('direction') || 'desc';
  const type = searchParams.get('type') || 'all';
  
  try {
    const result = await listGitHubRepositories({ page, perPage, sort: sort as any, direction: direction as any, type: type as any });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudieron listar los repositorios.' }, { status: 500 });
  }
}