import { NextResponse } from 'next/server';
import { OFFICIAL_AGENTS } from '@/lib/official-agents';

export async function GET() {
  // Return list of available official agents
  const agents = OFFICIAL_AGENTS.map(agent => ({
    id: agent.id,
    name: agent.name,
    role: agent.role,
    description: agent.description,
    mission: agent.mission,
  }));

  return NextResponse.json(agents);
}
