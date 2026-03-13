import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function readFileConfig() {
  try {
    const cfgPath = process.env.KANCLAW_OPENCLAW_CONFIG_PATH || path.join(os.homedir(), '.kanclaw', 'config', 'openclaw.json');
    if (!fs.existsSync(cfgPath)) return {} as Record<string, string>;
    const raw = fs.readFileSync(cfgPath, 'utf8');
    const parsed = JSON.parse(raw) as { httpUrl?: string; wsUrl?: string; bearerToken?: string };
    return {
      OPENCLAW_HTTP: parsed.httpUrl || '',
      OPENCLAW_WS: parsed.wsUrl || '',
      OPENCLAW_BEARER_TOKEN: parsed.bearerToken || '',
    };
  } catch {
    return {} as Record<string, string>;
  }
}

function getEnv() {
  const f = readFileConfig();
  return {
    http: process.env.OPENCLAW_HTTP || f.OPENCLAW_HTTP || 'http://127.0.0.1:18789',
    ws: process.env.OPENCLAW_WS || f.OPENCLAW_WS || 'ws://127.0.0.1:18789/events',
    token: process.env.OPENCLAW_BEARER_TOKEN || f.OPENCLAW_BEARER_TOKEN || '',
  };
}

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
  const env = getEnv();
  const headers: Record<string, string> = {};
  if (env.token) {
    headers.Authorization = `Bearer ${env.token}`;
  }
  return headers;
}

export function getOpenClawConfig() {
  const env = getEnv();
  return {
    httpBase: env.http,
    wsBase: env.ws,
    hasToken: Boolean(env.token),
  };
}

export async function getOpenClawHealth() {
  const env = getEnv();
  if (!env.http) {
    return { connected: false, status: 500, agents: [] as unknown[] };
  }

  try {
    const response = await fetch(`${env.http}/health`, {
      cache: 'no-store',
      headers: authHeaders(),
    });

    if (!response.ok) {
      return { connected: false, status: response.status, agents: [] as unknown[] };
    }

    let agents: unknown[] = [];
    try {
      const agentsResponse = await fetch(`${env.http}/agents`, {
        cache: 'no-store',
        headers: authHeaders(),
      });
      const contentType = agentsResponse.headers.get('content-type') || '';
      if (agentsResponse.ok && contentType.includes('application/json')) {
        const body = await agentsResponse.json();
        agents = Array.isArray(body) ? body : [];
      }
    } catch {
      agents = [];
    }

    return { connected: true, status: 200, agents };
  } catch {
    return { connected: false, status: 503, agents: [] as unknown[] };
  }
}

export async function sendOpenClawTask(payload: { projectSlug: string; agentName: string; prompt: string }) {
  const env = getEnv();
  if (!env.http) {
    throw new Error('OPENCLAW_HTTP is missing.');
  }

  return fetch(`${env.http}/agents/task`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });
}
