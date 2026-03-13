import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { NextRequest, NextResponse } from 'next/server';

const cfgPath = process.env.KANCLAW_OPENCLAW_CONFIG_PATH || path.join(os.homedir(), '.kanclaw', 'config', 'openclaw.json');

function isLoopbackHost(hostname: string) {
  const normalized = hostname.trim().toLowerCase();
  return normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1';
}

function isPublicUrl(value: string) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return !isLoopbackHost(url.hostname);
  } catch {
    return false;
  }
}

async function ensureDir() {
  await fs.mkdir(path.dirname(cfgPath), { recursive: true });
}

export async function GET() {
  try {
    const raw = await fs.readFile(cfgPath, 'utf8');
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ httpUrl: '', wsUrl: '', bearerToken: '' });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const payload = {
    httpUrl: String(body.httpUrl || ''),
    wsUrl: String(body.wsUrl || ''),
    bearerToken: String(body.bearerToken || ''),
  };

  const publicHttp = isPublicUrl(payload.httpUrl);
  const publicWs = isPublicUrl(payload.wsUrl);
  if ((publicHttp || publicWs) && !payload.bearerToken.trim()) {
    return NextResponse.json(
      {
        error: 'Bearer token requerido para OpenClaw remoto. Configura OPENCLAW_BEARER_TOKEN antes de guardar URLs públicas.',
      },
      { status: 400 },
    );
  }

  await ensureDir();
  await fs.writeFile(cfgPath, JSON.stringify(payload, null, 2), 'utf8');
  return NextResponse.json({ ok: true, path: cfgPath });
}
