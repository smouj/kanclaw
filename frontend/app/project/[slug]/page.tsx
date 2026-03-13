import { notFound } from 'next/navigation';
import { getOpenClawHealth } from '@/lib/openclaw';
import { getGitHubStatus } from '@/lib/github';
import { buildProjectOS } from '@/lib/project-os';
import { getFileTree } from '@/utils/fs';
import { ProjectWorkspaceShell } from '@/components/ProjectWorkspaceShell';

interface PageProps {
  params: { slug: string };
}

export default async function ProjectPage({ params }: PageProps) {
  const model = await buildProjectOS(params.slug);

  if (!model) {
    return notFound();
  }

  const [health, files, githubStatus] = await Promise.all([getOpenClawHealth(), getFileTree(model.project.slug), getGitHubStatus()]);

  return <ProjectWorkspaceShell project={model.project} model={model} health={health} githubStatus={githubStatus} files={files} />;
}