import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function toMs(value: Date) {
  return value.getTime();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectSlug = searchParams.get('projectSlug') || undefined;
  const windowHoursRaw = Number(searchParams.get('windowHours') || 24);
  const windowHours = Number.isFinite(windowHoursRaw) ? Math.min(Math.max(windowHoursRaw, 1), 168) : 24;

  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);

  const project = projectSlug
    ? await prisma.project.findUnique({ where: { slug: projectSlug }, select: { id: true, slug: true, name: true } })
    : null;

  const runs = await prisma.run.findMany({
    where: {
      createdAt: { gte: since },
      ...(project ? { projectId: project.id } : {}),
    },
    include: {
      agent: { select: { id: true, name: true } },
      project: { select: { id: true, slug: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 2000,
  });

  const totals = {
    totalRuns: runs.length,
    completed: 0,
    failed: 0,
    running: 0,
    other: 0,
    avgLatencyMs: 0,
    p95LatencyMs: 0,
  };

  const latencies: number[] = [];
  const byAgent = new Map<string, { agentId: string; agentName: string; total: number; failed: number; completed: number; running: number; avgLatencyMs: number; _latencies: number[] }>();

  for (const run of runs) {
    const status = (run.status || '').toLowerCase();
    if (status === 'completed') totals.completed += 1;
    else if (status === 'failed') totals.failed += 1;
    else if (status === 'running') totals.running += 1;
    else totals.other += 1;

    const latencyMs = Math.max(0, toMs(run.updatedAt) - toMs(run.createdAt));
    latencies.push(latencyMs);

    const agentId = run.agent?.id || 'unassigned';
    const agentName = run.agent?.name || 'unassigned';
    if (!byAgent.has(agentId)) {
      byAgent.set(agentId, {
        agentId,
        agentName,
        total: 0,
        failed: 0,
        completed: 0,
        running: 0,
        avgLatencyMs: 0,
        _latencies: [],
      });
    }

    const row = byAgent.get(agentId)!;
    row.total += 1;
    row._latencies.push(latencyMs);
    if (status === 'completed') row.completed += 1;
    else if (status === 'failed') row.failed += 1;
    else if (status === 'running') row.running += 1;
  }

  if (latencies.length > 0) {
    const sum = latencies.reduce((acc, current) => acc + current, 0);
    totals.avgLatencyMs = Math.round(sum / latencies.length);

    const sorted = [...latencies].sort((a, b) => a - b);
    const p95Index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
    totals.p95LatencyMs = sorted[p95Index];
  }

  const agents = Array.from(byAgent.values()).map((item) => {
    if (item._latencies.length > 0) {
      item.avgLatencyMs = Math.round(item._latencies.reduce((acc, value) => acc + value, 0) / item._latencies.length);
    }
    const failureRate = item.total > 0 ? Number(((item.failed / item.total) * 100).toFixed(2)) : 0;
    return {
      agentId: item.agentId,
      agentName: item.agentName,
      total: item.total,
      completed: item.completed,
      failed: item.failed,
      running: item.running,
      failureRatePct: failureRate,
      avgLatencyMs: item.avgLatencyMs,
    };
  });

  const successRatePct = totals.totalRuns > 0 ? Number(((totals.completed / totals.totalRuns) * 100).toFixed(2)) : 0;

  return NextResponse.json({
    windowHours,
    since: since.toISOString(),
    scope: project
      ? { projectId: project.id, projectSlug: project.slug, projectName: project.name }
      : { scope: 'global' },
    totals: {
      ...totals,
      successRatePct,
      failureRatePct: totals.totalRuns > 0 ? Number(((totals.failed / totals.totalRuns) * 100).toFixed(2)) : 0,
    },
    agents,
  });
}
