import { NextResponse } from 'next/server';
import { buildSuperChatContext } from '@/lib/chat-context';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectSlug = searchParams.get('projectSlug');
  const query = searchParams.get('query') || '';
  const targetAgentName = searchParams.get('targetAgentName') || '';

  if (!projectSlug) {
    return NextResponse.json({ error: 'Falta projectSlug.' }, { status: 400 });
  }

  try {
    const items = await buildSuperChatContext(projectSlug, query, targetAgentName);
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo construir el contexto del chat.' }, { status: 500 });
  }
}