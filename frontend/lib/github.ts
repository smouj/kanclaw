import 'server-only';

import { prisma } from '@/lib/prisma';
import { clearGitHubConnectorConfig, getGitHubConnectorConfig, getGitHubToken, saveGitHubConnectorConfig } from '@/lib/local-config';
import { appendProjectFile, createProjectFolders, readWorkspacePreview, writeProjectFile } from '@/utils/fs';

const GITHUB_API_BASE_URL = 'https://api.github.com';
const GITHUB_HEADERS = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'KanClaw-Project-OS',
};

function withAuth(token: string) {
  return {
    ...GITHUB_HEADERS,
    Authorization: `Bearer ${token}`,
  };
}

export async function verifyAndStoreGitHubToken(token: string) {
  const response = await fetch(`${GITHUB_API_BASE_URL}/user`, {
    headers: withAuth(token),
    cache: 'no-store',
  });

  if (!response.ok) {
    return { ok: false as const, status: response.status, error: 'GitHub rechazó el token.' };
  }

  const user = await response.json();
  await saveGitHubConnectorConfig({ token, username: user.login, scopes: [] });
  return { ok: true as const, username: user.login };
}

export async function getGitHubStatus() {
  const config = await getGitHubConnectorConfig();
  if (!config) {
    return { connected: false, mode: 'PAT', username: null };
  }
  return { connected: true, mode: config.mode.toUpperCase(), username: config.username };
}

export async function clearGitHubStatus() {
  await clearGitHubConnectorConfig();
}

export async function listGitHubRepositories() {
  const token = await getGitHubToken();
  if (!token) {
    throw new Error('GitHub no está configurado.');
  }

  const response = await fetch(`${GITHUB_API_BASE_URL}/user/repos?sort=updated&per_page=50`, {
    headers: withAuth(token),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`GitHub devolvió ${response.status}.`);
  }

  const repositories = await response.json();
  return repositories.map((repo: Record<string, unknown>) => ({
    id: repo.id,
    name: repo.name,
    owner: { login: (repo.owner as Record<string, unknown>)?.login as string },
    fullName: repo.full_name,
    description: repo.description,
    private: repo.private,
    defaultBranch: repo.default_branch,
    url: repo.html_url,
    pushedAt: repo.pushed_at,
  }));
}

async function fetchRawFile(token: string, owner: string, repo: string, filePath: string, ref?: string) {
  const response = await fetch(`${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/contents/${filePath}${ref ? `?ref=${ref}` : ''}`, {
    headers: {
      ...withAuth(token),
      Accept: 'application/vnd.github.raw+json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  return response.text();
}

export async function getGitHubRepositoryMetadata(owner: string, repo: string) {
  const token = await getGitHubToken();
  if (!token) {
    throw new Error('GitHub no está configurado.');
  }

  const repoResponse = await fetch(`${GITHUB_API_BASE_URL}/repos/${owner}/${repo}`, {
    headers: withAuth(token),
    cache: 'no-store',
  });

  if (!repoResponse.ok) {
    throw new Error(`No se pudo abrir ${owner}/${repo}.`);
  }

  const repoData = await repoResponse.json();
  const defaultBranch = repoData.default_branch as string;

  const [readmeResponse, treeResponse, packageJson, pyproject, requirements] = await Promise.all([
    fetch(`${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/readme`, {
      headers: withAuth(token),
      cache: 'no-store',
    }),
    fetch(`${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`, {
      headers: withAuth(token),
      cache: 'no-store',
    }),
    fetchRawFile(token, owner, repo, 'package.json', defaultBranch),
    fetchRawFile(token, owner, repo, 'pyproject.toml', defaultBranch),
    fetchRawFile(token, owner, repo, 'requirements.txt', defaultBranch),
  ]);

  let readme = '';
  if (readmeResponse.ok) {
    const readmeData = await readmeResponse.json();
    if (readmeData.content) {
      readme = Buffer.from(readmeData.content, 'base64').toString('utf8');
    }
  }

  const treeData = treeResponse.ok ? await treeResponse.json() : { tree: [] };
  const shallowTree = Array.isArray(treeData.tree)
    ? treeData.tree.slice(0, 250).map((item: Record<string, unknown>) => ({
        path: item.path,
        type: item.type,
        size: item.size || 0,
      }))
    : [];

  return {
    owner,
    repo,
    fullName: repoData.full_name,
    description: repoData.description,
    defaultBranch,
    url: repoData.html_url,
    visibility: repoData.private ? 'private' : 'public',
    topics: repoData.topics || [],
    readme,
    manifests: {
      'package.json': packageJson,
      'pyproject.toml': pyproject,
      'requirements.txt': requirements,
    },
    tree: shallowTree,
  };
}

export async function importGitHubRepository(input: {
  owner: string;
  repo: string;
  mode: 'create' | 'attach';
  projectSlug?: string;
  projectName?: string;
}) {
  const metadata = await getGitHubRepositoryMetadata(input.owner, input.repo);
  let project = input.projectSlug
    ? await prisma.project.findUnique({ where: { slug: input.projectSlug } })
    : null;

  if (!project && input.mode === 'create') {
    const projectName = input.projectName || metadata.repo;
    const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    project = await prisma.project.create({
      data: {
        slug,
        name: projectName,
        description: metadata.description || `Imported from ${metadata.fullName}`,
        chatThreads: {
          create: [{ title: 'Team Room', scope: 'TEAM', summary: `Sala importada desde ${metadata.fullName}` }],
        },
      },
    });
    await createProjectFolders(slug, []);
  }

  if (!project) {
    throw new Error('Proyecto no encontrado para vincular la importación.');
  }

  // Check if project already has a GitHub import (only 1 allowed)
  const existingImport = await prisma.projectImport.findFirst({
    where: {
      projectId: project.id,
      provider: 'github',
    },
  });

  if (existingImport) {
    throw new Error('Este proyecto ya tiene un repositorio GitHub vinculado. Solo se permite uno por proyecto.');
  }

  await prisma.projectImport.create({
    data: {
      projectId: project.id,
      provider: 'github',
      kind: input.mode === 'create' ? 'project' : 'linked_context',
      label: metadata.fullName,
      owner: metadata.owner,
      name: metadata.repo,
      externalId: metadata.fullName,
      sourceUrl: metadata.url,
      defaultBranch: metadata.defaultBranch,
      status: 'connected',
      summary: metadata.description || `Imported from GitHub`,
      metadata: JSON.stringify(metadata),
    },
  });

  await writeProjectFile(project.slug, 'knowledge/github-readme.md', metadata.readme || '# README no disponible\n');
  await writeProjectFile(project.slug, 'workspace/github-tree.json', JSON.stringify(metadata.tree, null, 2));
  await appendProjectFile(
    project.slug,
    'project-memory.md',
    `\n## GitHub Import\n- Repo: ${metadata.fullName}\n- Branch: ${metadata.defaultBranch}\n- URL: ${metadata.url}\n`,
  );

  const manifestPreview = Object.entries(metadata.manifests)
    .filter(([, value]) => typeof value === 'string' && value.length > 0)
    .map(([fileName, value]) => `\n### ${fileName}\n\n${String(value).slice(0, 1800)}\n`)
    .join('\n');

  if (manifestPreview) {
    await writeProjectFile(project.slug, 'knowledge/github-manifests.md', `# Repository manifests\n${manifestPreview}`);
  }

  await prisma.activityLog.create({
    data: {
      projectId: project.id,
      actor: 'System',
      action: 'github_import_completed',
      details: JSON.stringify({ owner: input.owner, repo: input.repo, mode: input.mode }),
    },
  });

  await prisma.snapshot.create({
    data: {
      projectId: project.id,
      title: `Snapshot · ${metadata.fullName}`,
      summary: `Importación de ${metadata.fullName} en ${metadata.defaultBranch}`,
      payload: JSON.stringify({
        readmePreview: await readWorkspacePreview(project.slug, 'knowledge/github-readme.md'),
        treeCount: metadata.tree.length,
      }),
    },
  });

  return { project, metadata };
}