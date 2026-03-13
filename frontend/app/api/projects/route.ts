import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createProjectFolders } from '@/utils/fs';

const projectSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().default(''),
  agents: z.array(z.object({ name: z.string().min(1), role: z.string().optional().default('') })).default([]),
});

export async function GET() {
  const projects = await prisma.project.findMany({
    include: { agents: true, tasks: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  try {
    const payload = projectSchema.parse(await request.json());
    const slug = payload.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    if (!slug) {
      return NextResponse.json({ error: 'Nombre de proyecto inválido.' }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        slug,
        name: payload.name,
        description: payload.description,
        agents: {
          create: payload.agents,
        },
      },
      include: { agents: true },
    });

    await createProjectFolders(slug, project.agents.map((agent) => agent.name));
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

    return NextResponse.json({ error: 'No se pudo crear el proyecto.' }, { status: 500 });
  }
}