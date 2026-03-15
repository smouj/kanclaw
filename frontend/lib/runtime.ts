/**
 * KanClaw Runtime Manager
 * 
 * Provides isolated runtime environments for each KanClaw project on top of OpenClaw.
 * Runtime root: ~/.kanclaw/openclaw-runtime/projects/<slug>/
 * 
 * Structure:
 * - workspace/     : Main project workspace (linked to kanclaw workspace)
 * - tmp/          : Ephemeral files for this project runtime
 * - attachments/   : File attachments for this project
 * - sessions/     : Session data for this project
 * - cache/        : Cache files
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

// Runtime root for all KanClaw projects
export const KANCLAW_RUNTIME_ROOT = path.join(os.homedir(), '.kanclaw', 'openclaw-runtime', 'projects');

// Feature flags for runtime isolation
export const RUNTIME_FEATURE_FLAGS = {
  USE_KANCLAW_RUNTIME_ROOT: process.env.KANCLAW_USE_RUNTIME_ROOT !== 'false',
  USE_SESSION_ISOLATION_V2: process.env.KANCLAW_SESSION_V2 !== 'false',
  USE_RUNTIME_METADATA: process.env.KANCLAW_RUNTIME_METADATA !== 'false',
};

/**
 * Normalize a slug for safe filesystem usage
 */
function normalizeSlug(slug: string): string {
  return slug
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 64);
}

/**
 * Get the runtime root path for a specific project
 */
export function getRuntimeRoot(slug: string): string {
  const normalized = normalizeSlug(slug);
  return path.join(KANCLAW_RUNTIME_ROOT, normalized);
}

/**
 * Get workspace subdirectory within runtime
 */
export function getRuntimeWorkspace(slug: string): string {
  return path.join(getRuntimeRoot(slug), 'workspace');
}

/**
 * Get tmp subdirectory within runtime
 */
export function getRuntimeTmp(slug: string): string {
  return path.join(getRuntimeRoot(slug), 'tmp');
}

/**
 * Get attachments subdirectory within runtime
 */
export function getRuntimeAttachments(slug: string): string {
  return path.join(getRuntimeRoot(slug), 'attachments');
}

/**
 * Get sessions subdirectory within runtime
 */
export function getRuntimeSessions(slug: string): string {
  return path.join(getRuntimeRoot(slug), 'sessions');
}

/**
 * Get cache subdirectory within runtime
 */
export function getRuntimeCache(slug: string): string {
  return path.join(getRuntimeRoot(slug), 'cache');
}

/**
 * Ensure all runtime directories exist for a project
 * Creates the runtime root and all subdirectories if they don't exist
 * Idempotent - safe to call multiple times
 */
export async function ensureRuntimeExists(slug: string): Promise<{
  ok: boolean;
  runtimeRoot: string;
  workspace: string;
  tmp: string;
  attachments: string;
  sessions: string;
  cache: string;
  error?: string;
}> {
  const runtimeRoot = getRuntimeRoot(slug);
  const workspace = getRuntimeWorkspace(slug);
  const tmp = getRuntimeTmp(slug);
  const attachments = getRuntimeAttachments(slug);
  const sessions = getRuntimeSessions(slug);
  const cache = getRuntimeCache(slug);

  try {
    const fsPromises = await import('node:fs/promises');
    
    // Create all directories
    await fsPromises.mkdir(runtimeRoot, { recursive: true });
    await fsPromises.mkdir(workspace, { recursive: true });
    await fsPromises.mkdir(tmp, { recursive: true });
    await fsPromises.mkdir(attachments, { recursive: true });
    await fsPromises.mkdir(sessions, { recursive: true });
    await fsPromises.mkdir(cache, { recursive: true });
    
    // Create metadata file if it doesn't exist
    const metadataPath = path.join(runtimeRoot, 'runtime.json');
    try {
      await fsPromises.access(metadataPath);
    } catch {
      // File doesn't exist, create it
      const metadata = {
        projectSlug: slug,
        createdAt: new Date().toISOString(),
        version: '1.0.0',
        normalizedSlug: normalizeSlug(slug),
      };
      await fsPromises.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
    }
    
    return {
      ok: true,
      runtimeRoot,
      workspace,
      tmp,
      attachments,
      sessions,
      cache,
    };
  } catch (error) {
    return {
      ok: false,
      runtimeRoot,
      workspace,
      tmp,
      attachments,
      sessions,
      cache,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Check if runtime exists for a project
 */
export async function runtimeExists(slug: string): Promise<boolean> {
  try {
    const fsPromises = await import('node:fs/promises');
    await fsPromises.access(getRuntimeRoot(slug));
    return true;
  } catch {
    return false;
  }
}

/**
 * Get runtime metadata for a project
 */
export async function getRuntimeMetadata(slug: string): Promise<{
  exists: boolean;
  projectSlug?: string;
  createdAt?: string;
  version?: string;
  normalizedSlug?: string;
  lastUsed?: string;
} | null> {
  const metadataPath = path.join(getRuntimeRoot(slug), 'runtime.json');
  
  try {
    const fsPromises = await import('node:fs/promises');
    const content = await fsPromises.readFile(metadataPath, 'utf8');
    const metadata = JSON.parse(content);
    
    // Update lastUsed
    metadata.lastUsed = new Date().toISOString();
    await fsPromises.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
    
    return { exists: true, ...metadata };
  } catch {
    return null;
  }
}

/**
 * Build enhanced session key for project isolation
 */
export function buildIsolatedSessionKey(
  projectSlug: string,
  agentName: string,
  gatewayAgentId: string = 'main'
): string {
  const normalizedProject = normalizeSlug(projectSlug);
  const normalizedAgent = normalizeSlug(agentName);
  const safeGatewayAgent = normalizeSlug(gatewayAgentId) || 'main';
  
  // New format: kanclaw:<project>:<agent>@<gateway>
  // This ensures clear isolation from other OpenClaw usages
  return `kanclaw:${normalizedProject}:${normalizedAgent}@${safeGatewayAgent}`;
}

/**
 * Build runtime metadata to pass to OpenClaw
 */
export function buildRuntimeMetadata(projectSlug: string, agentName: string): {
  source: string;
  projectSlug: string;
  agentName: string;
  runtimeRoot: string;
  workspaceRoot: string;
  agentWorkspace: string;
  tmpRoot: string;
  sessionKey: string;
  timestamp: string;
} {
  const runtimeRoot = getRuntimeRoot(projectSlug);
  const workspaceRoot = getRuntimeWorkspace(projectSlug);
  const agentWorkspace = path.join(workspaceRoot, 'agents', agentName);
  const tmpRoot = getRuntimeTmp(projectSlug);
  const sessionKey = buildIsolatedSessionKey(projectSlug, agentName);
  
  return {
    source: 'kanclaw',
    projectSlug,
    agentName,
    runtimeRoot,
    workspaceRoot,
    agentWorkspace,
    tmpRoot,
    sessionKey,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Build enhanced system prompt for KanClaw runtime isolation
 */
export function buildEnhancedSystemPrompt(payload: {
  projectSlug: string;
  agentName: string;
  runtimeMetadata?: ReturnType<typeof buildRuntimeMetadata>;
}): string {
  const { projectSlug, agentName } = payload;
  const runtimeMetadata = payload.runtimeMetadata || buildRuntimeMetadata(projectSlug, agentName);
  
  const lines = [
    '=== KANCLAW RUNTIME ISOLATION ===',
    `KANCLAW_SOURCE=kanclaw`,
    `KANCLAW_PROJECT=${projectSlug}`,
    `KANCLAW_AGENT=${agentName}`,
    `KANCLAW_RUNTIME_ROOT=${runtimeMetadata.runtimeRoot}`,
    `KANCLAW_WORKSPACE_ROOT=${runtimeMetadata.workspaceRoot}`,
    `KANCLAW_AGENT_WORKSPACE=${runtimeMetadata.agentWorkspace}`,
    `KANCLAW_TMP_ROOT=${runtimeMetadata.tmpRoot}`,
    '',
    'IMPORTANT: This session is running in an isolated KanClaw runtime.',
    `Workspace: ${runtimeMetadata.workspaceRoot}`,
    `Agent workspace: ${runtimeMetadata.agentWorkspace}`,
    '',
    'RULES:',
    '1. ALWAYS use the workspace directories under this runtime root.',
    '2. NEVER default to ~/.openclaw/workspace unless explicitly requested.',
    '3. Read/write SOUL.md, TOOLS.md, and memory.md from agent_workspace.',
    '4. Use tmp/ for temporary files specific to this project.',
    '5. Keep this project\'s files completely separate from other projects.',
    '',
    `Session key: ${runtimeMetadata.sessionKey}`,
    '================================',
  ];
  
  return lines.join('\n');
}

/**
 * Link the KanClaw workspace to the runtime workspace
 * This allows sharing files between the project workspace and the runtime
 */
export async function linkWorkspaceToRuntime(
  projectSlug: string, 
  kanclawWorkspacePath: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const runtimeWorkspace = getRuntimeWorkspace(projectSlug);
    const fsPromises = await import('node:fs/promises');
    
    // Check if runtime workspace exists
    try {
      await fsPromises.access(runtimeWorkspace);
    } catch {
      // Create runtime first
      await ensureRuntimeExists(projectSlug);
    }
    
    // Check if link already exists
    try {
      const linkStat = await fsPromises.lstat(runtimeWorkspace);
      if (linkStat.isSymbolicLink()) {
        // Link exists, verify it points to correct path
        const target = await fsPromises.readlink(runtimeWorkspace);
        if (target === kanclawWorkspacePath) {
          return { ok: true }; // Already linked correctly
        }
        // Different target, remove old link
        await fsPromises.unlink(runtimeWorkspace);
      } else {
        // Not a symlink, it's a real directory - don't replace
        return { ok: true };
      }
    } catch {
      // Doesn't exist, will create
    }
    
    // Create symlink
    await fsPromises.symlink(kanclawWorkspacePath, runtimeWorkspace);
    
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Generate a unique idempotency key for this project/agent combination
 */
export function generateIdempotencyKey(projectSlug: string, agentName: string): string {
  return `${normalizeSlug(projectSlug)}-${normalizeSlug(agentName)}-${randomUUID().slice(0, 8)}`;
}

/**
 * Get all runtime roots (for debugging/cleanup)
 */
export async function listRuntimes(): Promise<Array<{
  slug: string;
  root: string;
  exists: boolean;
}>> {
  try {
    const fsPromises = await import('node:fs/promises');
    const entries = await fsPromises.readdir(KANCLAW_RUNTIME_ROOT);
    
    const runtimes = [];
    for (const entry of entries) {
      const root = path.join(KANCLAW_RUNTIME_ROOT, entry);
      try {
        const stat = await fsPromises.stat(root);
        if (stat.isDirectory()) {
          runtimes.push({
            slug: entry,
            root,
            exists: true,
          });
        }
      } catch {
        // Skip invalid entries
      }
    }
    
    return runtimes;
  } catch {
    return [];
  }
}

/**
 * Delete runtime for a project (cleanup)
 */
export async function deleteRuntime(slug: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const fsPromises = await import('node:fs/promises');
    const runtimeRoot = getRuntimeRoot(slug);
    
    await fsPromises.rm(runtimeRoot, { recursive: true, force: true });
    
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
