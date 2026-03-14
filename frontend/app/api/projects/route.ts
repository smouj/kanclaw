import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createProjectFolders, deleteProjectFolders } from '@/utils/fs';
import { generateUniqueProjectSlug } from '@/lib/slug';
import { ensureProjectThreads } from '@/lib/project-os';

const projectSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().default(''),
  agents: z.array(z.object({ name: z.string().min(1), role: z.string().optional().default('') })).default([]),
});

export async function GET() {
  const projects = await prisma.project.findMany({
    include: { agents: true, tasks: true, runs: true, snapshots: true, imports: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(projects);
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'Slug required' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ where: { slug } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description } = body;

    const updated = await prisma.project.update({
      where: { id: project.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'Slug required' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ where: { slug } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    await prisma.project.delete({ where: { id: project.id } });

    // Also delete project files from filesystem
    const fsResult = await deleteProjectFolders(slug);

    if (!fsResult.deleted) {
      return NextResponse.json({ ok: true, slug, warning: 'Project deleted from DB but filesystem cleanup failed: ' + fsResult.error });
    }

    return NextResponse.json({ ok: true, slug });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = projectSchema.parse(await request.json());
    const slug = await generateUniqueProjectSlug(payload.name);

    const project = await prisma.project.create({
      data: {
        slug,
        name: payload.name,
        description: payload.description,
        agents: {
          create: payload.agents,
        },
        chatThreads: {
          create: [{ title: 'Team Room', scope: 'TEAM', summary: 'Canal principal entre humano y agentes' }],
        },
      },
      include: { agents: true },
    });

    await createProjectFolders(slug, project.agents.map((agent) => agent.name));
    await ensureProjectThreads(project.id);
    await prisma.activityLog.create({
      data: {
        projectId: project.id,
        actor: 'Human',
        action: 'project_created',
        details: JSON.stringify({ slug }),
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    if (error instanceof Error && error.message.toLowerCase().includes('unique')) {
      return NextResponse.json({ error: 'Ya existe un proyecto con ese nombre.' }, { status: 409 });
    }

    return NextResponse.json({ error: 'No se pudo crear el proyecto.' }, { status: 500 });
  }
}
