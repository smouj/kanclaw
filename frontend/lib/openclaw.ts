const OPENCLAW_HTTP = process.env.OPENCLAW_HTTP || 'http://localhost:3001';
const OPENCLAW_WS = process.env.OPENCLAW_WS || 'ws://localhost:3001/events';
const OPENCLAW_TOKEN = process.env.OPENCLAW_BEARER_TOKEN;

export interface OpenClawEvent {
  type: string;
  projectSlug?: string;
  taskId?: string;
  agentName?: string;
  message?: string;
  timestamp?: string;
  [key: string]: unknown;
}

function authHeaders() {
  const headers: Record<string, string> = {};
  if (OPENCLAW_TOKEN) {
    headers.Authorization = `Bearer ${OPENCLAW_TOKEN}`;
  }
  return headers;
}

export function getOpenClawConfig() {
  return {
    httpBase: OPENCLAW_HTTP,
    wsBase: OPENCLAW_WS,
    hasToken: Boolean(OPENCLAW_TOKEN),
  };
}

export async function getOpenClawHealth() {
  try {
    const response = await fetch(`${OPENCLAW_HTTP}/health`, {
      cache: 'no-store',
      headers: authHeaders(),
    });

    if (!response.ok) {
      return { connected: false, status: response.status, agents: [] as unknown[] };
    }

    const agentsResponse = await fetch(`${OPENCLAW_HTTP}/agents`, {
      cache: 'no-store',
      headers: authHeaders(),
    });
    const agents = agentsResponse.ok ? await agentsResponse.json() : [];
    return { connected: true, status: 200, agents: Array.isArray(agents) ? agents : [] };
  } catch {
    return { connected: false, status: 503, agents: [] as unknown[] };
  }
}

export async function sendOpenClawTask(payload: { projectSlug: string; agentName: string; prompt: string }) {
  return fetch(`${OPENCLAW_HTTP}/agents/task`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });
}