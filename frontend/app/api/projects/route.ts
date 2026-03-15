import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createProjectFolders, deleteProjectFolders } from '@/utils/fs';
import { generateUniqueProjectSlug } from '@/lib/slug';
import { ensureProjectThreads } from '@/lib/project-os';
import { OFFICIAL_AGENTS, generateAgentFiles, getOfficialAgentIds } from '@/lib/official-agents';
import { writeProjectFile } from '@/utils/fs';
import { configureKanClawProject } from '@/lib/openclaw';

const projectSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().default(''),
  agents: z.array(z.object({ name: z.string().min(1), role: z.string().optional().default('') })).default([]),
  withOfficialTeam: z.boolean().optional().default(false),
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

    // Determine which agents to create
    let agentsToCreate: { name: string; role: string; isOfficial: boolean; officialId: string | null }[] = [];

    if (payload.withOfficialTeam) {
      // Create official KanClaw team
      agentsToCreate = OFFICIAL_AGENTS.map(agent => ({
        name: agent.name,
        role: agent.role,
        isOfficial: true,
        officialId: agent.id,
      }));
    } else if (payload.agents.length > 0) {
      // Use custom agents provided
      agentsToCreate = payload.agents.map(agent => ({
        name: agent.name,
        role: agent.role || '',
        isOfficial: false,
        officialId: null,
      }));
    }

    const project = await prisma.project.create({
      data: {
        slug,
        name: payload.name,
        description: payload.description,
        agents: {
          create: agentsToCreate,
        },
        chatThreads: {
          create: [{ title: 'Team Room', scope: 'TEAM', summary: 'Canal principal entre humano y agentes' }],
        },
      },
      include: { agents: true },
    });

    // Create project folders and agent files
    const agentNames = project.agents.map((agent) => agent.name);
    await createProjectFolders(slug, agentNames);

    // If official team, create agent files from templates
    if (payload.withOfficialTeam) {
      for (const agent of project.agents) {
        const template = OFFICIAL_AGENTS.find(t => t.id === agent.officialId);
        if (template) {
          const files = generateAgentFiles(template);
          await writeProjectFile(slug, `agents/${agent.name}/SOUL.md`, files.soul);
          await writeProjectFile(slug, `agents/${agent.name}/TOOLS.md`, files.tools);
          await writeProjectFile(slug, `agents/${agent.name}/memory.md`, files.memory);
        }
      }
    }

    // Auto-configure project for OpenClaw (ensure workspaces are ready)
    await configureKanClawProject(slug, agentNames);

    await ensureProjectThreads(project.id);
    await prisma.activityLog.create({
      data: {
        projectId: project.id,
        actor: 'Human',
        action: 'project_created',
        details: JSON.stringify({ 
          slug, 
          withOfficialTeam: payload.withOfficialTeam,
          agentsCount: project.agents.length 
        }),
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

// Endpoint to add official agent to existing project
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { projectSlug, officialId } = body;

    if (!projectSlug || !officialId) {
      return NextResponse.json({ error: 'projectSlug and officialId required' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ 
      where: { slug: projectSlug },
      include: { agents: true }
    });
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if official agent already exists
    const existingAgent = project.agents.find(a => a.officialId === officialId);
    if (existingAgent) {
      return NextResponse.json({ error: 'Official agent already exists in this project' }, { status: 409 });
    }

    const template = OFFICIAL_AGENTS.find(a => a.id === officialId);
    if (!template) {
      return NextResponse.json({ error: 'Official agent template not found' }, { status: 404 });
    }

    // Create the agent
    const agent = await prisma.agent.create({
      data: {
        projectId: project.id,
        name: template.name,
        role: template.role,
        isOfficial: true,
        officialId: template.id,
      },
    });

    // Create agent files from template
    const files = generateAgentFiles(template);
    await writeProjectFile(project.slug, `agents/${agent.name}/SOUL.md`, files.soul);
    await writeProjectFile(project.slug, `agents/${agent.name}/TOOLS.md`, files.tools);
    await writeProjectFile(project.slug, `agents/${agent.name}/memory.md`, files.memory);

    await prisma.activityLog.create({
      data: {
        projectId: project.id,
        actor: 'Human',
        action: 'official_agent_added',
        details: JSON.stringify({ agentName: agent.name, officialId }),
      },
    });

    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add official agent' }, { status: 500 });
  }
}
