import { NextResponse } from 'next/server';
import { z } from 'zod';
import { clearGitHubStatus, getGitHubRepositoryMetadata, getGitHubStatus, importGitHubRepository, verifyAndStoreGitHubToken } from '@/lib/github';

const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('connect'), token: z.string().min(10) }),
  z.object({ action: z.literal('disconnect') }),
  z.object({
    action: z.literal('import'),
    owner: z.string().min(1),
    repo: z.string().min(1),
    mode: z.enum(['create', 'attach']),
    projectSlug: z.string().optional(),
    projectName: z.string().optional(),
  }),
]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');

  if (owner && repo) {
    try {
      const metadata = await getGitHubRepositoryMetadata(owner, repo);
      return NextResponse.json(metadata);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo leer el repositorio.' }, { status: 500 });
    }
  }

  return NextResponse.json(await getGitHubStatus());
}

export async function POST(request: Request) {
  try {
    const payload = actionSchema.parse(await request.json());

    if (payload.action === 'connect') {
      const result = await verifyAndStoreGitHubToken(payload.token);
      if (!result.ok) {
        return NextResponse.json(result, { status: 401 });
      }
      return NextResponse.json(result);
    }

    if (payload.action === 'disconnect') {
      await clearGitHubStatus();
      return NextResponse.json({ ok: true });
    }

    const imported = await importGitHubRepository(payload);
    return NextResponse.json(imported, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo completar la acción de GitHub.' }, { status: 500 });
  }
}