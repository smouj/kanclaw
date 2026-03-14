import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ensureProjectThreads } from '@/lib/project-os';
import { writeProjectFile } from '@/utils/fs';

// Normalize string for use as agent ID (like OpenClaw)
function normalizeAgentId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const agentSchema = z.object({
  projectSlug: z.string().min(1),
  name: z.string().min(1),
  role: z.string().optional().default(''),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectSlug = searchParams.get('projectSlug');
  if (!projectSlug) {
    return NextResponse.json({ error: 'Falta projectSlug.' }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    include: { agents: true },
  });

  if (!project) {
    return NextResponse.json({ error: 'Proyecto no encontrado.' }, { status: 404 });
  }

  return NextResponse.json(project.agents);
}

export async function POST(request: Request) {
  try {
    const payload = agentSchema.parse(await request.json());
    const project = await prisma.project.findUnique({ where: { slug: payload.projectSlug } });
    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado.' }, { status: 404 });
    }

    // Generate OpenClaw agent ID (normalized from KanClaw agent name)
    const gatewayAgentId = normalizeAgentId(payload.name);

    const agent = await prisma.agent.create({
      data: {
        projectId: project.id,
        name: payload.name,
        role: payload.role,
        gatewayAgentId, // Store OpenClaw agent ID for this KanClaw agent
      },
    });

    await Promise.all([
      writeProjectFile(project.slug, `agents/${agent.name}/SOUL.md`, `# ${agent.name} Soul\n\nRole: ${payload.role || 'AI Assistant'}\n\n## Purpose\nThis agent works on project "${project.name}" (${project.slug}).\n`),
      writeProjectFile(project.slug, `agents/${agent.name}/TOOLS.md`, `# ${agent.name} Tools\n\n## Capabilities\n- File operations in project workspace\n- Shell command execution\n- Code analysis and generation\n`),
      writeProjectFile(project.slug, `agents/${agent.name}/memory.md`, `# ${agent.name} Memory\n\nThis agent's memory for project "${project.slug}".\n`),
    ]);

    await ensureProjectThreads(project.id);
    await prisma.activityLog.create({
      data: {
        projectId: project.id,
        actor: 'Human',
        action: 'agent_created',
        details: JSON.stringify({ agentName: agent.name, gatewayAgentId: agent.gatewayAgentId }),
      },
    });

    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: 'No se pudo crear el agente.' }, { status: 500 });
  }
}
