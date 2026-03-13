import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

const ROOT_DIR = path.join(os.homedir(), '.kanclaw', 'workspace', 'projects');
const LEGACY_ROOT_DIR = path.join(process.cwd(), '.kanclaw', 'workspace', 'projects');
const CONFIG_DIR = path.join(os.homedir(), '.kanclaw', 'config');
const TEXT_EXTENSIONS = new Set(['.md', '.txt', '.json', '.ts', '.tsx', '.js', '.jsx', '.css', '.html', '.yml', '.yaml']);

export interface WorkspaceNode {
  name: string;
  path: string;
  kind: 'directory' | 'file';
  editable?: boolean;
  children?: WorkspaceNode[];
}

export function getProjectBasePath(slug: string) {
  return path.join(ROOT_DIR, slug);
}

export function getKanClawConfigPath(fileName: string) {
  return path.join(CONFIG_DIR, fileName);
}

async function ensureRootDirectories() {
  await fs.mkdir(ROOT_DIR, { recursive: true });
  await fs.mkdir(CONFIG_DIR, { recursive: true });
}

async function migrateLegacyWorkspace(slug: string) {
  const currentBase = getProjectBasePath(slug);
  const legacyBase = path.join(LEGACY_ROOT_DIR, slug);

  try {
    await fs.access(currentBase);
    return;
  } catch {}

  try {
    await fs.access(legacyBase);
    await fs.mkdir(path.dirname(currentBase), { recursive: true });
    await fs.cp(legacyBase, currentBase, { recursive: true });
  } catch {}
}

export async function createProjectFolders(slug: string, agents: string[]) {
  await ensureRootDirectories();
  await migrateLegacyWorkspace(slug);
  const base = getProjectBasePath(slug);
  const subdirs = ['agents', 'tasks', 'knowledge', 'decisions', 'artifacts', 'workspace'];

  await fs.mkdir(base, { recursive: true });
  for (const dir of subdirs) {
    await fs.mkdir(path.join(base, dir), { recursive: true });
  }

  await fs.writeFile(path.join(base, 'project-memory.md'), '# Project Memory\n', 'utf8');

  for (const agent of agents) {
    const agentDir = path.join(base, 'agents', agent);
    await fs.mkdir(agentDir, { recursive: true });
    await fs.writeFile(path.join(agentDir, 'SOUL.md'), `# ${agent} Soul\n`, 'utf8');
    await fs.writeFile(path.join(agentDir, 'TOOLS.md'), `# ${agent} Tools\n`, 'utf8');
    await fs.writeFile(path.join(agentDir, 'memory.md'), `# ${agent} Memory\n`, 'utf8');
  }

  return base;
}

export async function ensureProjectPath(slug: string, targetPath = '') {
  await ensureRootDirectories();
  await migrateLegacyWorkspace(slug);
  const base = getProjectBasePath(slug);
  const resolved = path.resolve(base, targetPath || '.');

  if (!resolved.startsWith(base)) {
    throw new Error('Invalid workspace path.');
  }

  return { base, resolved };
}

export async function getFileTree(slug: string, currentPath = ''): Promise<WorkspaceNode[]> {
  const { resolved } = await ensureProjectPath(slug, currentPath);
  const entries = await fs.readdir(resolved, { withFileTypes: true });

  const children = await Promise.all(
    entries
      .filter((entry) => !entry.name.startsWith('.'))
      .sort((a, b) => Number(b.isDirectory()) - Number(a.isDirectory()) || a.name.localeCompare(b.name))
      .map(async (entry) => {
        const absolutePath = path.join(resolved, entry.name);
        const relativePath = path.relative(getProjectBasePath(slug), absolutePath);

        if (entry.isDirectory()) {
          return {
            name: entry.name,
            path: relativePath,
            kind: 'directory' as const,
            children: await getFileTree(slug, relativePath),
          };
        }

        const ext = path.extname(entry.name).toLowerCase();
        return {
          name: entry.name,
          path: relativePath,
          kind: 'file' as const,
          editable: TEXT_EXTENSIONS.has(ext),
        };
      }),
  );

  return children;
}

export async function readProjectFile(slug: string, filePath: string) {
  const { resolved } = await ensureProjectPath(slug, filePath);
  const stat = await fs.stat(resolved);
  if (!stat.isFile()) {
    throw new Error('Target is not a file.');
  }
  return fs.readFile(resolved, 'utf8');
}

export async function writeProjectFile(slug: string, filePath: string, content: string) {
  const { resolved } = await ensureProjectPath(slug, filePath);
  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, content, 'utf8');
}

export async function appendProjectFile(slug: string, filePath: string, content: string) {
  const { resolved } = await ensureProjectPath(slug, filePath);
  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.appendFile(resolved, content, 'utf8');
}

export async function getFileMetadata(slug: string, filePath: string) {
  const { resolved } = await ensureProjectPath(slug, filePath);
  const stat = await fs.stat(resolved);
  return {
    absolutePath: resolved,
    relativePath: filePath,
    size: stat.size,
    updatedAt: stat.mtime.toISOString(),
    createdAt: stat.birthtime.toISOString(),
  };
}

export async function listWorkspaceSection(slug: string, section: string) {
  const { resolved } = await ensureProjectPath(slug, section);
  const entries = await fs.readdir(resolved, { withFileTypes: true }).catch(() => []);
  return Promise.all(
    entries
      .filter((entry) => !entry.name.startsWith('.'))
      .map(async (entry) => {
        const absolutePath = path.join(resolved, entry.name);
        const stat = await fs.stat(absolutePath);
        return {
          name: entry.name,
          path: path.relative(getProjectBasePath(slug), absolutePath),
          kind: entry.isDirectory() ? 'directory' : 'file',
          size: stat.size,
          updatedAt: stat.mtime.toISOString(),
        };
      }),
  );
}

export async function readWorkspacePreview(slug: string, filePath: string, limit = 1800) {
  const content = await readProjectFile(slug, filePath).catch(() => '');
  return content.slice(0, limit);
}