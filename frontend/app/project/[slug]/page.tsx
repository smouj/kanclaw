import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getOpenClawHealth } from '@/lib/openclaw';
import { getFileTree } from '@/utils/fs';
import { ProjectSidebar } from '@/components/ProjectSidebar';
import { KanbanBoard } from '@/components/KanbanBoard';
import { ActivityStream } from '@/components/ActivityStream';
import { PromptInput } from '@/components/PromptInput';
import { FileExplorer } from '@/components/FileExplorer';

interface PageProps {
  params: { slug: string };
}

export default async function ProjectPage({ params }: PageProps) {
  const project = await prisma.project.findUnique({
    where: { slug: params.slug },
    include: {
      agents: true,
      tasks: { orderBy: { createdAt: 'desc' } },
      logs: { orderBy: { timestamp: 'desc' }, take: 30 },
    },
  });

  if (!project) {
    return notFound();
  }

  const [health, files] = await Promise.all([getOpenClawHealth(), getFileTree(project.slug)]);

  return (
    <div className="mx-auto grid min-h-screen w-full max-w-[1800px] gap-4 p-4 lg:grid-cols-[280px_1.25fr_0.75fr] lg:p-5">
      <aside className="panel overflow-hidden" data-testid="project-sidebar-panel">
        <ProjectSidebar project={project} health={health} />
      </aside>

      <main className="grid min-h-[calc(100vh-2.5rem)] gap-4 lg:grid-rows-[1fr_340px]">
        <section className="panel overflow-hidden p-4 lg:p-5" data-testid="kanban-panel">
          <KanbanBoard projectSlug={project.slug} initialTasks={project.tasks} agents={project.agents} />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <div className="panel overflow-hidden p-4 lg:p-5" data-testid="activity-panel">
            <ActivityStream projectSlug={project.slug} initialLogs={project.logs} openClawConnected={health.connected} />
          </div>
          <div className="panel overflow-hidden p-4 lg:p-5" data-testid="prompt-panel">
            <PromptInput projectSlug={project.slug} agents={project.agents} openClawConnected={health.connected} />
          </div>
        </section>
      </main>

      <aside className="panel min-h-[calc(100vh-2.5rem)] overflow-hidden" data-testid="file-explorer-panel">
        <FileExplorer projectSlug={project.slug} initialTree={files} />
      </aside>
    </div>
  );
}