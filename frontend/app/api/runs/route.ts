import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('id');

    if (!runId) {
      return NextResponse.json({ error: 'Run ID required' }, { status: 400 });
    }

    const run = await prisma.run.findUnique({ where: { id: runId } });
    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    await prisma.run.delete({ where: { id: runId } });

    return NextResponse.json({ ok: true, id: runId });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete run' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectSlug = searchParams.get('projectSlug');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

    if (!projectSlug) {
      return NextResponse.json({ error: 'projectSlug required' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ where: { slug: projectSlug } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const runs = await prisma.run.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        agent: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(runs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch runs' }, { status: 500 });
  }
}
