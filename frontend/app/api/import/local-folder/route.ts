import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { appendProjectFile, createProjectFolders, writeProjectFile } from '@/utils/fs';

const importSchema = z.object({
  absolutePath: z.string().min(1),
  mode: z.enum(['create', 'attach']),
  projectSlug: z.string().optional(),
  projectName: z.string().optional(),
});

async function scanFolderTree(root: string, depth = 0): Promise<Array<{ path: string; type: 'file' | 'directory' }>> {
  if (depth > 3) return [];
  const entries = await fs.readdir(root, { withFileTypes: true });
  const result: Array<{ path: string; type: 'file' | 'directory' }> = [];

  for (const entry of entries.filter((item) => !item.name.startsWith('.')).slice(0, 80)) {
    const absolute = path.join(root, entry.name);
    result.push({ path: absolute, type: entry.isDirectory() ? 'directory' : 'file' });
    if (entry.isDirectory()) {
      result.push(...(await scanFolderTree(absolute, depth + 1)));
    }
  }

  return result;
}

export async function POST(request: Request) {
  try {
    const payload = importSchema.parse(await request.json());
    const stat = await fs.stat(payload.absolutePath);
    if (!stat.isDirectory()) {
      return NextResponse.json({ error: 'La ruta indicada no es una carpeta.' }, { status: 400 });
    }

    let project = payload.projectSlug ? await prisma.project.findUnique({ where: { slug: payload.projectSlug } }) : null;
    if (!project && payload.mode === 'create') {
      const projectName = payload.projectName || path.basename(payload.absolutePath);
      const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      project = await prisma.project.create({
        data: {
          slug,
          name: projectName,
          description: `Imported from local folder ${payload.absolutePath}`,
          chatThreads: { create: [{ title: 'Team Room', scope: 'TEAM', summary: 'Canal principal del proyecto' }] },
        },
      });
      await createProjectFolders(slug, []);
    }

    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado.' }, { status: 404 });
    }

    const tree = await scanFolderTree(payload.absolutePath);
    await prisma.projectImport.create({
      data: {
        projectId: project.id,
        provider: 'local-folder',
        kind: payload.mode === 'create' ? 'project' : 'linked_context',
        label: path.basename(payload.absolutePath),
        name: path.basename(payload.absolutePath),
        sourceUrl: payload.absolutePath,
        status: 'connected',
        summary: `Linked local folder ${payload.absolutePath}`,
        metadata: JSON.stringify({ tree }),
      },
    });

    await writeProjectFile(project.slug, 'workspace/local-folder-tree.json', JSON.stringify(tree, null, 2));
    await appendProjectFile(project.slug, 'project-memory.md', `\n## Local Folder Import\n- Path: ${payload.absolutePath}\n`);

    return NextResponse.json({ ok: true, projectSlug: project.slug, importedItems: tree.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo importar la carpeta local.' }, { status: 500 });
  }
}