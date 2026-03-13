import { NextResponse } from 'next/server';
import { getOpenClawConfig, getOpenClawHealth } from '@/lib/openclaw';

export async function GET() {
  const [health, config] = await Promise.all([getOpenClawHealth(), Promise.resolve(getOpenClawConfig())]);
  return NextResponse.json({
    app: 'kanclaw',
    openclaw: health,
    config,
  });
}