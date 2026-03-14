'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/components/LanguageProvider';

interface GitHubConnectorPanelProps {
  initialStatus: { connected: boolean; mode: string; username: string | null };
  projectSlug: string;
}

interface RepositoryItem {
  id: number;
  fullName: string;
  name: string;
  owner: string;
  description?: string;
  defaultBranch: string;
  url: string;
}

export function GitHubConnectorPanel({ initialStatus, projectSlug }: GitHubConnectorPanelProps) {
  const { t } = useI18n();
  const [status, setStatus] = useState(initialStatus);
  const [token, setToken] = useState('');
  const [repositories, setRepositories] = useState<RepositoryItem[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<RepositoryItem | null>(null);
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [localFolderPath, setLocalFolderPath] = useState('');
  const [loading, setLoading] = useState(false);

  async function connectGitHub() {
    setLoading(true);
    const response = await fetch('/api/connectors/github', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'connect', token }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      toast.error(data.error || t('connectors.connectError'));
      return;
    }
    setStatus({ connected: true, mode: 'PAT', username: data.username });
    setToken('');
    toast.success(t('connectors.connectedOk'));
  }

  async function loadRepositories() {
    setLoading(true);
    const response = await fetch('/api/connectors/github/repositories');
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      toast.error(data.error || t('connectors.loadError'));
      return;
    }
    setRepositories(data);
  }

  async function loadPreview(repo: RepositoryItem) {
    setSelectedRepo(repo);
    setPreview(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/connectors/github?owner=${repo.owner}&repo=${repo.name}`);
      const data = await response.json();
      setLoading(false);
      if (!response.ok) {
        toast.error(data.error || t('connectors.previewError'));
        return;
      }
      setPreview(data);
    } catch (error) {
      setLoading(false);
      toast.error(t('connectors.previewError'));
    }
  }

  async function importRepository(mode: 'create' | 'attach') {
    if (!selectedRepo) return;
    setLoading(true);
    const response = await fetch('/api/connectors/github', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'import',
        owner: selectedRepo.owner,
        repo: selectedRepo.name,
        mode,
        projectSlug: mode === 'attach' ? projectSlug : undefined,
        projectName: mode === 'create' ? selectedRepo.name : undefined,
      }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      toast.error(data.error || t('connectors.importError'));
      return;
    }
    toast.success(mode === 'create' ? t('connectors.importCreated') : t('connectors.importAttached'));
    window.location.href = mode === 'create' ? `/project/${data.project.slug}` : `/project/${projectSlug}`;
  }

  async function importLocalFolder(mode: 'create' | 'attach') {
    setLoading(true);
    const response = await fetch('/api/import/local-folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ absolutePath: localFolderPath, mode, projectSlug: mode === 'attach' ? projectSlug : undefined }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      toast.error(data.error || t('connectors.localImportError'));
      return;
    }
    toast.success(t('connectors.localConnected'));
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.76fr_1.24fr]">
      <section className="rounded-[1.8rem] border border-border bg-surface p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-text-muted">{t('connectors.github')}</p>
            <h3 className="mt-2 text-xl font-semibold theme-text-strong">{t('connectors.connectImport')}</h3>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs ${status.connected ? 'border-border theme-text-strong' : 'border-border text-text-muted'}`} data-testid="github-connector-status">
            {status.connected ? `PAT · ${status.username}` : t('connectors.notConfigured')}
          </span>
        </div>

        <div className="mt-5 space-y-3">
          <Input value={token} onChange={(event) => setToken(event.target.value)} placeholder={t('connectors.patPlaceholder')} data-testid="github-token-input" />
          <Button type="button" onClick={connectGitHub} disabled={!token || loading} data-testid="github-connect-button">{t('connectors.github')}</Button>
          <Button type="button" variant="outline" onClick={loadRepositories} disabled={!status.connected || loading} data-testid="github-load-repositories-button">{t('connectors.loadRepos')}</Button>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <p className="text-xs uppercase tracking-[0.28em] text-text-muted">{t('connectors.localImport')}</p>
          <div className="mt-3 space-y-3">
            <Input value={localFolderPath} onChange={(event) => setLocalFolderPath(event.target.value)} placeholder={t('connectors.localPathPlaceholder')} data-testid="local-folder-path-input" />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => importLocalFolder('attach')} disabled={!localFolderPath || loading} data-testid="local-folder-attach-button">{t('connectors.attachProject')}</Button>
              <Button type="button" onClick={() => importLocalFolder('create')} disabled={!localFolderPath || loading} data-testid="local-folder-create-button">{t('connectors.createProject')}</Button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[1.8rem] border border-border bg-surface p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-text-muted">{t('connectors.repoBrowser')}</p>
        <div className="mt-4 grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
            {repositories.length === 0 ? <p className="rounded-[1.4rem] border border-dashed border-border theme-surface-soft p-4 text-sm text-text-muted">{t('connectors.loadRepos')}...</p> : null}
            {repositories.map((repo) => (
              <button key={repo.id} type="button" onClick={() => loadPreview(repo)} className={`w-full rounded-[1.4rem] border p-4 text-left transition ${selectedRepo?.id === repo.id ? 'border-border bg-surface2' : 'border-border theme-surface-soft hover:border-border'}`} data-testid={`github-repo-item-${repo.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
                <p className="text-sm font-medium theme-text-strong">{repo.fullName}</p>
                <p className="mt-2 text-xs leading-5 text-text-muted">{repo.description || t('connectors.noDescription')}</p>
              </button>
            ))}
          </div>

          <div className="rounded-[1.5rem] border border-border theme-surface-soft p-4">
            {!preview ? <p className="text-sm text-text-muted">{t('connectors.selectRepo')}</p> : null}
            {preview ? (
              <div className="space-y-4" data-testid="github-repo-preview-panel">
                <div>
                  <h4 className="text-lg font-semibold theme-text-strong">{String(preview.fullName)}</h4>
                  <p className="mt-2 text-sm text-text-secondary">{String(preview.description || '')}</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <InfoCard label={t('connectors.defaultBranch')} value={String(preview.defaultBranch || '')} />
                  <InfoCard label={t('connectors.visibility')} value={String(preview.visibility || '')} />
                </div>
                <div className="rounded-[1.3rem] border border-border bg-surface2 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-text-muted">{t('connectors.readmePreview')}</p>
                  <pre className="mt-3 whitespace-pre-wrap text-xs leading-6 text-text-secondary">{String(preview.readme || '').slice(0, 1400) || t('connectors.readmeUnavailable')}</pre>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => importRepository('attach')} disabled={loading} data-testid="github-import-attach-button">{t('connectors.attachProject')}</Button>
                  <Button type="button" onClick={() => importRepository('create')} disabled={loading} data-testid="github-import-create-button">{t('connectors.createProject')}</Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-border bg-surface2 p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-text-muted">{label}</p>
      <p className="mt-3 text-sm theme-text-strong">{value}</p>
    </div>
  );
}