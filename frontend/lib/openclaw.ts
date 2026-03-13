import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';

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

function normalizeKeySegment(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 64);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseJsonOutput(stdout: string) {
  const trimmed = stdout.trim();
  if (!trimmed) return {};
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error('OpenClaw output is not valid JSON.');
  }
}

async function runOpenClawJson(args: string[], timeoutMs = 15000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const child = spawn('openclaw', args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';
    let done = false;

    const finish = (error?: Error, result?: unknown) => {
      if (done) return;
      done = true;
      if (timer) clearTimeout(timer);
      if (error) reject(error);
      else resolve(result);
    };

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });

    child.on('error', (error) => {
      finish(error instanceof Error ? error : new Error(String(error)));
    });

    child.on('close', (code) => {
      if (code !== 0) {
        const detail = stderr.trim() || stdout.trim() || `exit code ${String(code)}`;
        finish(new Error(`openclaw ${args.join(' ')} failed: ${detail}`));
        return;
      }

      try {
        finish(undefined, parseJsonOutput(stdout));
      } catch (error) {
        finish(error instanceof Error ? error : new Error(String(error)));
      }
    });

    const timer = setTimeout(() => {
      try {
        child.kill('SIGTERM');
      } catch {
        // ignore kill errors
      }
      finish(new Error(`openclaw ${args.join(' ')} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
}

async function callGatewayRpc(method: string, params: Record<string, unknown>, timeoutMs = 15000) {
  return runOpenClawJson(
    ['gateway', 'call', method, '--json', '--timeout', String(timeoutMs), '--params', JSON.stringify(params)],
    timeoutMs + 3000,
  );
}

type AgentIndex = {
  defaultId: string;
  ids: Set<string>;
  namesToId: Map<string, string>;
  expiresAt: number;
};

let agentIndexCache: AgentIndex | null = null;

async function getAgentIndex(): Promise<AgentIndex> {
  if (agentIndexCache && Date.now() < agentIndexCache.expiresAt) {
    return agentIndexCache;
  }

  try {
    const payload = (await callGatewayRpc('agents.list', {}, 12000)) as {
      defaultId?: string;
      agents?: Array<{ id?: string; name?: string }>;
    };

    const ids = new Set<string>();
    const namesToId = new Map<string, string>();

    for (const item of payload.agents || []) {
      if (!item?.id) continue;
      ids.add(item.id);
      if (item.name) {
        const normalizedName = normalizeKeySegment(item.name);
        if (normalizedName) namesToId.set(normalizedName, item.id);
      }
    }

    const index: AgentIndex = {
      defaultId: payload.defaultId || 'main',
      ids,
      namesToId,
      expiresAt: Date.now() + 60_000,
    };

    agentIndexCache = index;
    return index;
  } catch {
    const fallback: AgentIndex = {
      defaultId: 'main',
      ids: new Set(['main']),
      namesToId: new Map([['main', 'main']]),
      expiresAt: Date.now() + 15_000,
    };
    agentIndexCache = fallback;
    return fallback;
  }
}

async function resolveGatewayAgentId(agentName: string) {
  const index = await getAgentIndex();
  const normalized = normalizeKeySegment(agentName);

  if (normalized && index.ids.has(normalized)) {
    return normalized;
  }

  const byName = normalized ? index.namesToId.get(normalized) : undefined;
  if (byName) {
    return byName;
  }

  return index.defaultId || 'main';
}

function buildSessionKey(projectSlug: string, agentName: string, gatewayAgentId: string) {
  const project = normalizeKeySegment(projectSlug) || 'project';
  const agent = normalizeKeySegment(agentName) || 'agent';
  const safeGatewayAgent = normalizeKeySegment(gatewayAgentId) || 'main';
  return `agent:${safeGatewayAgent}:kanclaw:${project}:${agent}`;
}

function extractMessageText(content: unknown): string {
  if (typeof content === 'string') return content;

  if (Array.isArray(content)) {
    const parts: string[] = [];
    for (const entry of content) {
      if (!entry || typeof entry !== 'object') continue;
      const item = entry as { type?: string; text?: unknown };
      if (item.type === 'text' && typeof item.text === 'string') {
        parts.push(item.text);
      }
    }
    return parts.join('\n').trim();
  }

  if (content && typeof content === 'object' && 'text' in content) {
    const text = (content as { text?: unknown }).text;
    if (typeof text === 'string') return text;
  }

  return '';
}

async function waitForAssistantReply(sessionKey: string, sentAtMs: number, timeoutMs = 45_000): Promise<string | null> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const history = (await callGatewayRpc('chat.history', { sessionKey, limit: 14 }, 12000)) as {
      messages?: Array<{ role?: string; timestamp?: number; content?: unknown }>;
    };

    const messages = Array.isArray(history.messages) ? history.messages : [];

    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i];
      if (!message || message.role !== 'assistant') continue;
      const ts = Number(message.timestamp || 0);
      if (ts < sentAtMs) continue;

      const text = extractMessageText(message.content).trimStart();
      if (text) return text;
    }

    await delay(700);
  }

  return null;
}

async function sendViaGatewayRpc(payload: { projectSlug: string; agentName: string; prompt: string }) {
  const gatewayAgentId = await resolveGatewayAgentId(payload.agentName);
  const sessionKey = buildSessionKey(payload.projectSlug, payload.agentName, gatewayAgentId);
  const idempotencyKey = randomUUID();
  const sentAtMs = Date.now();

  await callGatewayRpc(
    'chat.send',
    {
      sessionKey,
      message: payload.prompt,
      idempotencyKey,
    },
    20000,
  );

  const reply = await waitForAssistantReply(sessionKey, sentAtMs, 45_000);

  return {
    id: idempotencyKey,
    taskId: idempotencyKey,
    status: reply ? 'completed' : 'started',
    agentId: gatewayAgentId,
    sessionKey,
    message: reply || 'Mensaje enviado a OpenClaw. La respuesta aún se está procesando.',
  };
}

async function sendViaLegacyHttp(payload: { projectSlug: string; agentName: string; prompt: string }) {
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

  if (env.http) {
    try {
      const response = await fetch(`${env.http}/health`, {
        cache: 'no-store',
        headers: authHeaders(),
      });

      if (response.ok) {
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

        return { connected: true, status: response.status, agents };
      }
    } catch {
      // continue to RPC fallback
    }
  }

  try {
    const health = (await callGatewayRpc('health', {}, 10000)) as { ok?: boolean };
    const agentsPayload = (await callGatewayRpc('agents.list', {}, 10000)) as { agents?: unknown[] };
    return {
      connected: Boolean(health?.ok ?? true),
      status: 200,
      agents: Array.isArray(agentsPayload?.agents) ? agentsPayload.agents : [],
    };
  } catch {
    return { connected: false, status: 503, agents: [] as unknown[] };
  }
}

export async function sendOpenClawTask(payload: { projectSlug: string; agentName: string; prompt: string }) {
  try {
    const result = await sendViaGatewayRpc(payload);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (rpcError) {
    try {
      const legacyResponse = await sendViaLegacyHttp(payload);
      if (legacyResponse.ok) {
        return legacyResponse;
      }

      if (legacyResponse.status !== 404 && legacyResponse.status !== 405) {
        return legacyResponse;
      }

      const legacyBody = await legacyResponse.text().catch(() => '');
      return new Response(
        JSON.stringify({
          error: 'OpenClaw no respondió con un endpoint compatible para chat.',
          rpcError: rpcError instanceof Error ? rpcError.message : String(rpcError),
          legacyStatus: legacyResponse.status,
          legacyBody,
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    } catch (legacyError) {
      return new Response(
        JSON.stringify({
          error: 'OpenClaw no está disponible.',
          rpcError: rpcError instanceof Error ? rpcError.message : String(rpcError),
          legacyError: legacyError instanceof Error ? legacyError.message : String(legacyError),
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  }
}
