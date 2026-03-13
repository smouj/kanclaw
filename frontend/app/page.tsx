import { prisma } from '@/lib/prisma';
import { getGitHubStatus } from '@/lib/github';
import { getOpenClawHealth } from '@/lib/openclaw';
import { HomePageClient } from '@/components/HomePageClient';

async function getProjects() {
  return prisma.project.findMany({
    include: { agents: true, tasks: true, runs: true, snapshots: true, imports: true },
    orderBy: { createdAt: 'desc' },
  });
}

export default async function HomePage() {
  const [projects, health, githubStatus, recentRuns, recentLogs] = await Promise.all([
    getProjects(),
    getOpenClawHealth(),
    getGitHubStatus(),
    prisma.run.findMany({ orderBy: { createdAt: 'desc' }, take: 6, include: { project: true } }),
    prisma.activityLog.findMany({ orderBy: { timestamp: 'desc' }, take: 8, include: { project: true } }),
  ]);

  return (
    <HomePageClient 
      projects={projects}
      health={health}
      githubStatus={githubStatus}
      recentRuns={recentRuns}
      recentLogs={recentLogs}
    />
  );
}
