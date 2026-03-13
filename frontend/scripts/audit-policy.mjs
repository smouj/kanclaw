#!/usr/bin/env node

import { execSync } from 'node:child_process';

function runAuditJson() {
  try {
    return execSync('npm audit --omit=dev --json', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    if (error && typeof error === 'object' && 'stdout' in error) {
      return String(error.stdout || '');
    }
    throw error;
  }
}

function parseAudit(raw) {
  try {
    return JSON.parse(raw || '{}');
  } catch {
    throw new Error('Could not parse npm audit JSON output');
  }
}

function getHighPackages(report) {
  const vulnerabilities = report?.vulnerabilities || {};
  const highs = [];

  for (const [name, vuln] of Object.entries(vulnerabilities)) {
    if (!vuln || typeof vuln !== 'object') continue;
    if (vuln.severity === 'high' || vuln.severity === 'critical') {
      highs.push({
        name,
        severity: vuln.severity,
      });
    }
  }

  return highs;
}

const raw = runAuditJson();
const report = parseAudit(raw);
const meta = report?.metadata?.vulnerabilities || {};
const critical = Number(meta.critical || 0);
const high = Number(meta.high || 0);

const allowedHighPackages = new Set(['next']);
const highPackages = getHighPackages(report);
const disallowedHigh = highPackages.filter((item) => !allowedHighPackages.has(item.name));

console.log('[audit] summary', JSON.stringify({ critical, high, highPackages }, null, 2));

if (critical > 0) {
  console.error('[audit] blocked: critical vulnerabilities detected');
  process.exit(1);
}

if (disallowedHigh.length > 0) {
  console.error('[audit] blocked: high vulnerabilities outside allowlist:', disallowedHigh.map((item) => item.name).join(', '));
  process.exit(1);
}

console.log('[audit] policy check passed');
