import { NextResponse } from 'next/server';
import { listGitHubRepositories } from '@/lib/github';

export async function GET() {
  try {
    const repositories = await listGitHubRepositories();
    return NextResponse.json(repositories);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudieron listar los repositorios.' }, { status: 500 });
  }
}