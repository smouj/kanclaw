'use client';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse rounded-lg bg-white/5 ${className}`} />
  );
}

export function CardSkeleton() {
  return (
    <div className="kanclaw-panel rounded-[1.9rem] p-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="mt-6 h-8 w-3/4" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-2/3" />
      <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="kanclaw-panel rounded-[1.7rem] p-4">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="mt-3 h-8 w-12" />
    </div>
  );
}

export function ActivitySkeleton() {
  return (
    <div className="kanclaw-panel rounded-[1.6rem] p-4">
      <Skeleton className="h-5 w-24" />
      <div className="mt-3 space-y-2">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function ChatMessageSkeleton() {
  return (
    <div className="flex gap-3">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="mt-2 h-16 w-full" />
      </div>
    </div>
  );
}

export function KanbanColumnSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-6 rounded-full" />
      </div>
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
}

export function MemoryHubSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="kanclaw-panel rounded-[1.8rem] p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-4 h-40 w-full" />
        </div>
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="kanclaw-panel h-20 rounded-[1.6rem] p-4" />
          ))}
        </div>
      </div>
    </div>
  );
}
