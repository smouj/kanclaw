'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, Loader2, GitBranch, Star, GitFork, 
  Lock, Globe, ChevronDown, ChevronRight, 
  FolderOpen, FileCode, FileText, AlertCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface GitHubRepository {
  id: number;
  name: string;
  owner: { login: string };
  fullName: string;
  description: string | null;
  private: boolean;
  defaultBranch: string;
  url: string;
  pushedAt: string;
  updatedAt: string;
  htmlUrl: string;
  language: string | null;
  stargazersCount: number;
  forksCount: number;
}

interface GitHubRepoPickerProps {
  onSelect: (repo: GitHubRepository) => void;
  selectedRepo?: GitHubRepository | null;
  projectSlug?: string;
}

type SortOption = 'updated' | 'pushed' | 'created' | 'full_name';
type FilterOption = 'all' | 'owner' | 'member' | 'public' | 'private';

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4F5D95',
  'C++': '#f34b7d',
  C: '#555555',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Vue: '#41b883',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
};

export function GitHubRepoPicker({ onSelect, selectedRepo, projectSlug }: GitHubRepoPickerProps) {
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search & Filter
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('updated');
  const [filter, setFilter] = useState<FilterOption>('all');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Load initial repos
  const loadRepositories = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true);
      setPage(1);
      setRepositories([]);
    } else {
      setLoadingMore(true);
    }
    
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: reset ? '1' : String(page),
        per_page: '100',
        sort,
        direction: 'desc',
        type: filter,
      });
      
      const response = await fetch(`/api/connectors/github/repositories?${params}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar repositorios');
      }
      
      if (reset) {
        setRepositories(data.repositories);
      } else {
        setRepositories(prev => [...prev, ...data.repositories]);
      }
      
      setHasMore(data.hasMore);
      setTotalCount(data.totalCount || data.loadedCount);
      if (reset && data.hasMore) setPage(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page, sort, filter]);

  // Initial load
  useEffect(() => {
    loadRepositories(true);
  }, [sort, filter]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Filter repos client-side for instant search
  const filteredRepos = useMemo(() => {
    if (!debouncedSearch) return repositories;
    
    const query = debouncedSearch.toLowerCase();
    return repositories.filter(repo => 
      repo.name.toLowerCase().includes(query) ||
      repo.fullName.toLowerCase().includes(query) ||
      repo.owner.login.toLowerCase().includes(query) ||
      repo.description?.toLowerCase().includes(query)
    );
  }, [repositories, debouncedSearch]);

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'hoy';
    if (days === 1) return 'ayer';
    if (days < 7) return `${days}d`;
    if (days < 30) return `${Math.floor(days / 7)}sem`;
    if (days < 365) return `${Math.floor(days / 30)}mes`;
    return `${Math.floor(days / 365)}a`;
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar repositorios..."
            className="pl-10 bg-surface border-border"
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {/* Sort Dropdown */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary"
          >
            <option value="updated">Recién actualizados</option>
            <option value="pushed">Último push</option>
            <option value="created">Más recientes</option>
            <option value="full_name">Nombre A-Z</option>
          </select>
          
          {/* Filter Dropdown */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterOption)}
            className="text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary"
          >
            <option value="all">Todos</option>
            <option value="owner">Miertos</option>
            <option value="member">Miembros</option>
            <option value="public">Públicos</option>
            <option value="private">Privados</option>
          </select>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>
          {loading ? 'Cargando...' : `${filteredRepos.length} repositorios`}
          {totalCount > 0 && !loading && !debouncedSearch && totalCount > repositories.length && (
            <span className="ml-1">de {totalCount}</span>
          )}
        </span>
        {debouncedSearch && (
          <span className="text-text-secondary">
            Filtrado: {filteredRepos.length} resultados
          </span>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
          <Button variant="ghost" size="sm" onClick={() => loadRepositories(true)} className="ml-auto">
            Reintentar
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
        </div>
      )}

      {/* Repository List */}
      {!loading && !error && (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {filteredRepos.length === 0 ? (
            <div className="text-center py-8 text-text-muted">
              {debouncedSearch ? (
                <>
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No hay resultados para &quot;{debouncedSearch}&quot;</p>
                </>
              ) : (
                <>
                  <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No se encontraron repositorios</p>
                </>
              )}
            </div>
          ) : (
            filteredRepos.map((repo) => (
              <button
                key={repo.id}
                onClick={() => onSelect(repo)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedRepo?.id === repo.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-surface hover:border-border-hover'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {repo.private ? (
                        <Lock className="w-3 h-3 text-amber-400" />
                      ) : (
                        <Globe className="w-3 h-3 text-emerald-400" />
                      )}
                      <span className="font-medium text-text-primary truncate">
                        {repo.owner.login}/{repo.name}
                      </span>
                    </div>
                    
                    {repo.description && (
                      <p className="text-xs text-text-muted mt-1 line-clamp-2">
                        {repo.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                      {repo.language && (
                        <span className="flex items-center gap-1">
                          <span 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: LANGUAGE_COLORS[repo.language] || '#666' }}
                          />
                          {repo.language}
                        </span>
                      )}
                      {repo.stargazersCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {repo.stargazersCount}
                        </span>
                      )}
                      {repo.forksCount > 0 && (
                        <span className="flex items-center gap-1">
                          <GitFork className="w-3 h-3" />
                          {repo.forksCount}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <GitBranch className="w-3 h-3" />
                        {repo.defaultBranch}
                      </span>
                      <span>{formatDate(repo.pushedAt)}</span>
                    </div>
                  </div>
                  
                  {selectedRepo?.id === repo.id && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Load More */}
      {!loading && !error && hasMore && !debouncedSearch && (
        <Button
          variant="outline"
          onClick={() => {
            setPage(prev => prev + 1);
            loadRepositories(false);
          }}
          disabled={loadingMore}
          className="w-full"
        >
          {loadingMore ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Cargando más...
            </>
          ) : (
            `Cargar más (${totalCount - repositories.length} restantes)`
          )}
        </Button>
      )}
    </div>
  );
}