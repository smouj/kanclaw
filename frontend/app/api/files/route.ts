import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getFileTree, readProjectFile, writeProjectFile } from '@/utils/fs';

const writeSchema = z.object({
  projectSlug: z.string().min(1),
  path: z.string().min(1),
  content: z.string(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectSlug = searchParams.get('projectSlug');
  const targetPath = searchParams.get('path');

  if (!projectSlug) {
    return NextResponse.json({ error: 'Falta projectSlug.' }, { status: 400 });
  }

  try {
    if (!targetPath) {
      const tree = await getFileTree(projectSlug);
      return NextResponse.json({ tree });
    }

    const content = await readProjectFile(projectSlug, targetPath);
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo leer el archivo.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const payload = writeSchema.parse(await request.json());
    const project = await prisma.project.findUnique({ where: { slug: payload.projectSlug } });
    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado.' }, { status: 404 });
    }

    await writeProjectFile(payload.projectSlug, payload.path, payload.content);
    await prisma.activityLog.create({
      data: {
        projectId: project.id,
        actor: 'Human',
        action: 'file_saved',
        details: JSON.stringify({ path: payload.path }),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: 'No se pudo guardar el archivo.' }, { status: 500 });
  }
}