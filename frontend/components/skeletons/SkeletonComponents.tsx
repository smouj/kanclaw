'use client';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded bg-surface2 ${className || ''}`}
    />
  );
}

// Skeleton para tarjeta de stats
export function StatCardSkeleton() {
  return (
    <div className="rounded border border-border bg-surface p-4">
      <Skeleton className="h-4 w-20 mb-2" />
      <Skeleton className="h-8 w-32" />
    </div>
  );
}

// Skeleton para lista de agentes
export function AgentListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded border border-border bg-surface">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton para thread de chat
export function ThreadSkeleton() {
  return (
    <div className="border-b border-border p-3">
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-12 ml-auto" />
      </div>
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}

// Skeleton para mensaje de chat
export function MessageSkeleton({ isOwn = false }: { isOwn?: boolean }) {
  return (
    <div className={`flex gap-3 p-4 ${isOwn ? 'flex-row-reverse' : ''}`}>
      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
      <div className={`flex-1 space-y-2 ${isOwn ? 'text-right' : ''}`}>
        <Skeleton className="h-4 w-20 inline-block" />
        <Skeleton className={`h-16 rounded-lg ${isOwn ? 'ml-auto w-3/4' : 'w-3/4'}`} />
      </div>
    </div>
  );
}

// Skeleton para kanban column
export function KanbanColumnSkeleton() {
  return (
    <div className="w-72 flex-shrink-0 rounded border border-border bg-surface p-3">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-8 rounded" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded" />
        ))}
      </div>
    </div>
  );
}

// Skeleton para file/folder
export function FileItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-2">
      <Skeleton className="h-5 w-5" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

// Skeleton para overview completo
export function OverviewSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Agents Section */}
      <div>
        <Skeleton className="h-6 w-32 mb-3" />
        <AgentListSkeleton />
      </div>

      {/* Recent Activity */}
      <div>
        <Skeleton className="h-6 w-40 mb-3" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded border border-border bg-surface">
              <Skeleton className="h-8 w-8 rounded" />
              <div className="flex-1">
                <Skeleton className="h-4 w-48 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
