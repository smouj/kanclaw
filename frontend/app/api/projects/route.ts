import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createProjectFolders } from '@/utils/fs';
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