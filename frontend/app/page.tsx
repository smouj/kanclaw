import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prisma } from '@/lib/prisma';
import { getGitHubStatus } from '@/lib/github';
import { getOpenClawConfig, getOpenClawHealth } from '@/lib/openclaw';
import { HomePageClient } from '@/components/HomePageClient';

async function getProjects() {
  return prisma.project.findMany({
    include: { agents: true, tasks: true, runs: true, snapshots: true, imports: true },
    orderBy: { createdAt: 'desc' },
  });
}

async function getWorkspaceInfo() {
  const openclawWorkspaceRoot = process.env.OPENCLAW_WORKSPACE_ROOT || path.join(os.homedir(), '.openclaw', 'workspace');
  const kanclawProjectsRoot = path.join(os.homedir(), '.kanclaw', 'workspace', 'projects');

  const [openclawWorkspaceDetected, projectFolders] = await Promise.all([
    fs.access(openclawWorkspaceRoot).then(() => true).catch(() => false),
    fs
      .readdir(kanclawProjectsRoot, { withFileTypes: true })
      .then((entries) => entries.filter((entry) => entry.isDirectory() && !entry.name.startsWith('.')).map((entry) => entry.name))
      .catch(() => []),
  ]);

  return {
    openclawWorkspaceRoot,
    openclawWorkspaceDetected,
    kanclawProjectsRoot,
    projectFolders,
  };
}

export default async function HomePage() {
  const [projects, health, githubStatus, recentRuns, recentLogs, openclawConfig, workspaceInfo] = await Promise.all([
    getProjects(),
    getOpenClawHealth(),
    getGitHubStatus(),
    prisma.run.findMany({ orderBy: { createdAt: 'desc' }, take: 6, include: { project: true } }),
    prisma.activityLog.findMany({ orderBy: { timestamp: 'desc' }, take: 8, include: { project: true } }),
    Promise.resolve(getOpenClawConfig()),
    getWorkspaceInfo(),
  ]);

  return (
    <HomePageClient
      projects={projects}
      health={health}
      githubStatus={githubStatus}
      recentRuns={recentRuns}
      recentLogs={recentLogs}
      openclawConfig={openclawConfig}
      workspaceInfo={workspaceInfo}
    />
  );
}
