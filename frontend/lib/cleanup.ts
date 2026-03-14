/**
 * KanClaw Cleanup Utilities
 * Handles cleanup of old data, caches, and database maintenance
 */

import { prisma } from '@/lib/prisma';
import { rm, readdir } from 'fs/promises';
import { join } from 'path';

export async function cleanupOldRuns(daysOld = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.run.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
      status: { in: ['completed', 'failed'] },
    },
  });

  return result.count;
}

export async function cleanupOldMessages(daysOld = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  // Get threads to clean
  const threads = await prisma.chatThread.findMany({
    where: { updatedAt: { lt: cutoffDate } },
    select: { id: true },
  });

  const threadIds = threads.map((t) => t.id);

  if (threadIds.length === 0) return 0;

  const result = await prisma.chatMessage.deleteMany({
    where: { threadId: { in: threadIds } },
  });

  return result.count;
}

export async function cleanupInactiveThreads(daysOld = 60): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.chatThread.deleteMany({
    where: {
      updatedAt: { lt: cutoffDate },
      scope: 'DIRECT', // Only clean direct messages, not team rooms
    },
  });

  return result.count;
}

export async function cleanupOrphanedFiles(): Promise<number> {
  // Clean files in .kanclaw folder that don't correspond to any project
  const kanclawDir = join(process.cwd(), '.kanclaw');
  let cleaned = 0;

  try {
    const entries = await readdir(kanclawDir, { withFileTypes: true });
    const projects = await prisma.project.findMany({ select: { slug: true } });
    const projectSlugs = new Set(projects.map((p) => p.slug));

    for (const entry of entries) {
      if (entry.isDirectory() && !projectSlugs.has(entry.name)) {
        const dirPath = join(kanclawDir, entry.name);
        await rm(dirPath, { recursive: true, force: true });
        cleaned++;
      }
    }
  } catch {
    // Directory might not exist
  }

  return cleaned;
}

export async function getDatabaseStats() {
  const [projects, agents, runs, messages, threads, imports, tasks] = await Promise.all([
    prisma.project.count(),
    prisma.agent.count(),
    prisma.run.count(),
    prisma.chatMessage.count(),
    prisma.chatThread.count(),
    prisma.projectImport.count(),
    prisma.task.count(),
  ]);

  return {
    projects,
    agents,
    runs,
    messages,
    threads,
    imports,
    tasks,
  };
}

export async function vacuumDatabase(): Promise<void> {
  // SQLite VACUUM to reclaim space
  await prisma.$executeRaw`VACUUM`;
}
