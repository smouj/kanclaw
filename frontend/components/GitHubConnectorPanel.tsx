'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/components/LanguageProvider';
import { GitHubRepoPicker, GitHubPreview } from '@/components/github';

interface GitHubConnectorPanelProps {
  initialStatus: { connected: boolean; mode: string; username: string | null };
  projectSlug?: string;
}

interface RepositoryItem {
  id: number;
  fullName: string;
  name: string;
  owner: { login: string };
  description: string | null;
  private: boolean;
  defaultBranch: string;
  url: string;
  htmlUrl: string;
  pushedAt: string;
  updatedAt: string;
  language: string | null;
  stargazersCount: number;
  forksCount: number;
}

export function GitHubConnectorPanel({ initialStatus, projectSlug }: GitHubConnectorPanelProps) {
  const { t } = useI18n();
  const [status, setStatus] = useState(initialStatus);
  const [token, setToken] = useState('');
  const [selectedRepo, setSelectedRepo] = useState<RepositoryItem | null>(null);
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

  async function importRepository(mode: 'create' | 'attach') {
    if (!selectedRepo) return;
    setLoading(true);
    const response = await fetch('/api/connectors/github', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'import',
        owner: selectedRepo.owner.login,
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
        
        <div className="mt-4">
          {!status.connected ? (
            <div className="text-center py-12 text-text-muted">
              <p className="text-sm">Conecta tu cuenta de GitHub para ver tus repositorios</p>
            </div>
          ) : selectedRepo ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {/* Selected repo details */}
              <div>
                <button
                  onClick={() => setSelectedRepo(null)}
                  className="text-sm text-text-muted hover:text-text-primary mb-3"
                >
                  ← Volver a la lista
                </button>
                <GitHubPreview
                  repo={selectedRepo}
                  onImport={importRepository}
                  loading={loading}
                  projectSlug={projectSlug}
                />
              </div>
            </div>
          ) : (
            <GitHubRepoPicker
              onSelect={setSelectedRepo}
              selectedRepo={selectedRepo}
              projectSlug={projectSlug}
            />
          )}
        </div>
      </section>
    </div>
  );
}
