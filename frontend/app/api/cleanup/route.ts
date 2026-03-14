import { NextResponse } from 'next/server';
import { z } from 'zod';
import { cleanupOldRuns, cleanupOldMessages, cleanupInactiveThreads, cleanupOrphanedFiles, getDatabaseStats, vacuumDatabase } from '@/lib/cleanup';

const cleanupSchema = z.object({
  action: z.enum(['runs', 'messages', 'threads', 'orphans', 'vacuum', 'stats', 'all']),
  daysOld: z.number().optional().default(30),
});

export async function GET() {
  try {
    const stats = await getDatabaseStats();
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error getting stats' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = cleanupSchema.parse(await request.json());

    let result: { cleaned?: number; message?: string };

    switch (payload.action) {
      case 'runs': {
        const cleaned = await cleanupOldRuns(payload.daysOld);
        result = { cleaned, message: `Deleted ${cleaned} old runs` };
        break;
      }
      case 'messages': {
        const cleaned = await cleanupOldMessages(payload.daysOld);
        result = { cleaned, message: `Deleted ${cleaned} old messages` };
        break;
      }
      case 'threads': {
        const cleaned = await cleanupInactiveThreads(payload.daysOld);
        result = { cleaned, message: `Deleted ${cleaned} inactive threads` };
        break;
      }
      case 'orphans': {
        const cleaned = await cleanupOrphanedFiles();
        result = { cleaned, message: `Deleted ${cleaned} orphaned folders` };
        break;
      }
      case 'vacuum': {
        await vacuumDatabase();
        result = { message: 'Database vacuumed successfully' };
        break;
      }
      case 'stats': {
        const stats = await getDatabaseStats();
        return NextResponse.json(stats);
      }
      case 'all': {
        const cleanedRuns = await cleanupOldRuns(payload.daysOld);
        const cleanedMessages = await cleanupOldMessages(90);
        const cleanedThreads = await cleanupInactiveThreads(60);
        const cleanedOrphans = await cleanupOrphanedFiles();
        await vacuumDatabase();
        result = {
          message: `Cleanup complete: ${cleanedRuns} runs, ${cleanedMessages} messages, ${cleanedThreads} threads, ${cleanedOrphans} folders`,
        };
        break;
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cleanup failed' },
      { status: 500 }
    );
  }
}
