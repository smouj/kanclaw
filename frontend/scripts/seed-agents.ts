import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get demo project
  let project = await prisma.project.findUnique({
    where: { slug: 'kanclaw-demo' }
  });

  if (!project) {
    console.log('Creating demo project...');
    project = await prisma.project.create({
      data: {
        slug: 'kanclaw-demo',
        name: 'KanClaw Demo',
        description: 'Default demo workspace for KanClaw - Your Local-First AI Agent Workspace OS',
      }
    });
  }

  // Delete existing agents
  await prisma.agent.deleteMany({
    where: { projectId: project.id }
  });

  // Create 5 default agents with full configuration
  const agents = [
    {
      name: 'PlannerAgent',
      role: 'Strategic Planning & Roadmap',
      soulPath: 'agents/planner/SOUL.md',
      toolsPath: 'agents/planner/TOOLS.md',
      status: 'idle'
    },
    {
      name: 'BuilderAgent',
      role: 'Code Implementation',
      soulPath: 'agents/builder/SOUL.md',
      toolsPath: 'agents/builder/TOOLS.md',
      status: 'idle'
    },
    {
      name: 'ResearcherAgent',
      role: 'Research & Documentation',
      soulPath: 'agents/researcher/SOUL.md',
      toolsPath: 'agents/researcher/TOOLS.md',
      status: 'idle'
    },
    {
      name: 'ReviewerAgent',
      role: 'Code Review & Quality',
      soulPath: 'agents/reviewer/SOUL.md',
      toolsPath: 'agents/reviewer/TOOLS.md',
      status: 'idle'
    },
    {
      name: 'OrchestratorAgent',
      role: 'Project Coordination & Communication',
      soulPath: 'agents/orchestrator/SOUL.md',
      toolsPath: 'agents/orchestrator/TOOLS.md',
      status: 'idle'
    }
  ];

  for (const agent of agents) {
    await prisma.agent.create({
      data: {
        projectId: project.id,
        ...agent
      }
    });
    console.log('Created:', agent.name);
  }

  // Create default team thread if not exists
  const existingThread = await prisma.chatThread.findFirst({
    where: { projectId: project.id, scope: 'TEAM' }
  });

  if (!existingThread) {
    await prisma.chatThread.create({
      data: {
        projectId: project.id,
        title: 'Team Room',
        scope: 'TEAM'
      }
    });
    console.log('Created Team Room thread');
  }

  console.log('Done! Default 5 agents created.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
