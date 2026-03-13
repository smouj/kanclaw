import { WebSocket } from 'ws';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OPENCLAW_WS = process.env.OPENCLAW_WS || 'ws://localhost:3001/events';
const OPENCLAW_TOKEN = process.env.OPENCLAW_BEARER_TOKEN;

export async function GET(request: Request) {
  const encoder = new TextEncoder();
  const { searchParams } = new URL(request.url);
  const projectSlug = searchParams.get('projectSlug');

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('retry: 2000\n\n'));

      const socket = new WebSocket(OPENCLAW_WS, {
        headers: OPENCLAW_TOKEN ? { Authorization: `Bearer ${OPENCLAW_TOKEN}` } : undefined,
      });

      socket.on('message', (raw) => {
        try {
          const event = JSON.parse(String(raw));
          if (projectSlug && event.projectSlug && event.projectSlug !== projectSlug) {
            return;
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', message: 'Evento inválido recibido desde OpenClaw', timestamp: new Date().toISOString() })}\n\n`,
            ),
          );
        }
      });

      socket.on('close', () => controller.close());
      socket.on('error', () => {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'error', message: 'No se pudo establecer la conexión WebSocket con OpenClaw.', timestamp: new Date().toISOString() })}\n\n`,
          ),
        );
        controller.close();
      });

      request.signal.addEventListener('abort', () => socket.close());
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}