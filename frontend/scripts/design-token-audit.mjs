#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const TARGET_FILES = [
  'components/ProjectWorkspaceShell.tsx',
  'components/AgentChatSurface.tsx',
  'components/KanbanBoard.tsx',
  'components/ProjectMemoryHub.tsx',
  'components/FileExplorer.tsx',
  'components/GitHubConnectorPanel.tsx',
];

const bannedPatterns = [
  { re: /text-zinc-\d+/g, message: 'Use text-text-primary|secondary|muted tokens instead of text-zinc-*' },
  { re: /bg-zinc-\d+/g, message: 'Use bg-surface|bg-surface2|bg-background tokens instead of bg-zinc-*' },
  { re: /border-zinc-\d+/g, message: 'Use border-border token instead of border-zinc-*' },
  { re: /text-\$\{/g, message: 'Avoid dynamic Tailwind class interpolation for text color; use explicit token classes' },
  { re: /border-subtle\d+/g, message: 'Invalid token class detected (border-subtleXXX). Use border-border' },
  { re: /bg-white\/[0-9.]+/g, message: 'Use theme tokens instead of fixed bg-white/* in project views' },
];

const files = TARGET_FILES.map((f) => join(ROOT, f));
const findings = [];

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  for (const p of bannedPatterns) {
    const matches = content.match(p.re);
    if (matches && matches.length > 0) {
      findings.push({ file, pattern: p.re.toString(), count: matches.length, message: p.message });
    }
  }
}

if (findings.length > 0) {
  console.error('❌ Design token audit failed. Inconsistent styles found:');
  for (const f of findings) {
    console.error(`- ${f.file}: ${f.count}x ${f.message}`);
  }
  process.exit(1);
}

console.log('✅ Design token audit passed. UI tokens are consistent.');
