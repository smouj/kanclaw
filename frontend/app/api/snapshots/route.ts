import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { listWorkspaceSection, readWorkspacePreview, writeProjectFile } from '@/utils/fs';

const snapshotSchema = z.object({
  projectSlug: z.string().min(1),
  title: z.string().optional().default('Project Snapshot'),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectSlug = searchParams.get('projectSlug');
  if (!projectSlug) {
    return NextResponse.json({ error: 'Falta projectSlug.' }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    include: { snapshots: { orderBy: { createdAt: 'desc' } } },
  });
  if (!project) {
    return NextResponse.json({ error: 'Proyecto no encontrado.' }, { status: 404 });
  }

  return NextResponse.json(project.snapshots);
}

export async function POST(request: Request) {
  try {
    const payload = snapshotSchema.parse(await request.json());
    const project = await prisma.project.findUnique({
      where: { slug: payload.projectSlug },
      include: {
        agents: true,
        tasks: { orderBy: { updatedAt: 'desc' }, take: 12 },
        runs: { orderBy: { createdAt: 'desc' }, take: 8 },
        logs: { orderBy: { timestamp: 'desc' }, take: 18 },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado.' }, { status: 404 });
    }

    const [decisions, knowledge, artifacts, projectMemory] = await Promise.all([
      listWorkspaceSection(project.slug, 'decisions'),
      listWorkspaceSection(project.slug, 'knowledge'),
      listWorkspaceSection(project.slug, 'artifacts'),
      readWorkspacePreview(project.slug, 'project-memory.md', 1600),
    ]);

    const snapshotPayload = {
      generatedAt: new Date().toISOString(),
      project: { name: project.name, slug: project.slug, description: project.description },
      recentTasks: project.tasks,
      recentRuns: project.runs,
      recentActivity: project.logs,
      decisions,
      knowledge,
      artifacts,
      projectMemory,
      agentMemory: await Promise.all(
        project.agents.map(async (agent) => ({
          agent: agent.name,
          role: agent.role,
          memory: await readWorkspacePreview(project.slug, `agents/${agent.name}/memory.md`, 1000),
        })),
      ),
    };

    const snapshot = await prisma.snapshot.create({
      data: {
        projectId: project.id,
        title: payload.title,
        summary: `Snapshot de ${project.name} con ${project.tasks.length} tareas y ${project.runs.length} runs recientes.`,
        payload: JSON.stringify(snapshotPayload),
      },
    });

    await writeProjectFile(project.slug, `artifacts/snapshots/${snapshot.id}.json`, JSON.stringify(snapshotPayload, null, 2));

    await prisma.activityLog.create({
      data: {
        projectId: project.id,
        actor: 'System',
        action: 'snapshot_created',
        details: JSON.stringify({ snapshotId: snapshot.id }),
      },
    });

    return NextResponse.json(snapshot, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: 'No se pudo crear el snapshot.' }, { status: 500 });
  }
}