'use client';

import { useState } from 'react';

interface MemoryHubProps {
  projectMemory: string;
  knowledge: Array<{ name: string; path: string; updatedAt: string }>;
  decisions: Array<{ name: string; path: string; updatedAt: string }>;
  artifacts: Array<{ name: string; path: string; updatedAt: string }>;
  runs: Array<{ id: string; title: string; status: string; createdAt: string | Date; metadata?: unknown }>;
  delegations: Array<{ id: string; action: string; actor: string; timestamp: string | Date; details?: unknown }>;
  snapshots: Array<{ id: string; title: string; summary: string; createdAt: string | Date }>;
  imports: Array<{ id: string; provider: string; label: string; status: string; summary?: string | null }>;
  agentSurfaces: Array<{ id: string; name: string; role: string; soul: string; tools: string; memory: string }>;
}

const tabs = ['overview', 'knowledge', 'decisions', 'artifacts', 'souls', 'runs', 'delegations', 'snapshots'] as const;

export function ProjectMemoryHub(props: MemoryHubProps) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('overview');

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`rounded-full px-3 py-2 text-xs uppercase tracking-[0.24em] transition ${activeTab === tab ? 'bg-white text-black' : 'border border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-100'}`} data-testid={`memory-tab-${tab}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' ? (
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[1.8rem] border border-white/8 bg-white/[0.025] p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Project Memory</p>
            <pre className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-300" data-testid="project-memory-content">{props.projectMemory}</pre>
          </section>
          <section className="grid gap-4">
            {[
              ['Knowledge files', props.knowledge.length],
              ['Decision files', props.decisions.length],
              ['Artifacts', props.artifacts.length],
              ['Runs', props.runs.length],
              ['Snapshots', props.snapshots.length],
              ['Imports', props.imports.length],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-[1.6rem] border border-white/8 bg-white/[0.025] p-4" data-testid={`memory-metric-${String(label).toLowerCase().replace(/\s+/g, '-')}`}>
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{label}</p>
                <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
              </div>
            ))}
          </section>
        </div>
      ) : null}

      {activeTab === 'knowledge' ? <MemoryList title="Knowledge" items={props.knowledge} empty="Todavía no hay conocimiento persistido." /> : null}
      {activeTab === 'decisions' ? <MemoryList title="Decisions" items={props.decisions} empty="Todavía no hay decisiones registradas." /> : null}
      {activeTab === 'artifacts' ? <MemoryList title="Artifacts" items={props.artifacts} empty="Todavía no hay artefactos generados." /> : null}

      {activeTab === 'souls' ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {props.agentSurfaces.map((agent) => (
            <article key={agent.id} className="rounded-[1.8rem] border border-white/8 bg-white/[0.025] p-5" data-testid={`memory-agent-card-${agent.name.toLowerCase()}`}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">{agent.role || 'Sin rol'}</span>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <PreviewCard title="Soul" value={agent.soul} />
                <PreviewCard title="Tools" value={agent.tools} />
                <PreviewCard title="Memory" value={agent.memory} />
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {activeTab === 'runs' ? <TimelineList title="Runs" items={props.runs.map((run) => ({ id: run.id, title: run.title, subtitle: run.status, timestamp: run.createdAt }))} empty="Aún no hay runs registrados." /> : null}
      {activeTab === 'delegations' ? <TimelineList title="Delegations" items={props.delegations.map((log) => ({ id: log.id, title: `${log.actor} · ${log.action}`, subtitle: typeof log.details === 'string' ? log.details : JSON.stringify(log.details), timestamp: log.timestamp }))} empty="No hay delegaciones visibles todavía." /> : null}
      {activeTab === 'snapshots' ? <TimelineList title="Snapshots" items={props.snapshots.map((snapshot) => ({ id: snapshot.id, title: snapshot.title, subtitle: snapshot.summary, timestamp: snapshot.createdAt }))} empty="No se han creado snapshots todavía." /> : null}
    </div>
  );
}

function MemoryList({ title, items, empty }: { title: string; items: Array<{ name: string; path: string; updatedAt: string }>; empty: string }) {
  return (
    <section className="rounded-[1.8rem] border border-white/8 bg-white/[0.025] p-5">
      <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">{title}</p>
      {items.length === 0 ? <p className="mt-6 text-sm text-zinc-500">{empty}</p> : null}
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <article key={item.path} className="rounded-[1.4rem] border border-white/7 bg-black/40 p-4" data-testid={`memory-file-${item.path.replace(/[^a-zA-Z0-9]+/g, '-')}`}>
            <p className="text-sm font-medium text-white">{item.name}</p>
            <p className="mt-1 text-xs text-zinc-500">{item.path}</p>
            <p className="mt-3 text-xs text-zinc-400">Actualizado {new Date(item.updatedAt).toLocaleString('es-ES')}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function TimelineList({ title, items, empty }: { title: string; items: Array<{ id: string; title: string; subtitle: string; timestamp: string | Date }>; empty: string }) {
  return (
    <section className="rounded-[1.8rem] border border-white/8 bg-white/[0.025] p-5">
      <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">{title}</p>
      {items.length === 0 ? <p className="mt-6 text-sm text-zinc-500">{empty}</p> : null}
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-[1.4rem] border border-white/7 bg-black/40 p-4" data-testid={`timeline-item-${item.id}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-white">{item.title}</p>
              <time className="text-xs text-zinc-500">{new Date(item.timestamp).toLocaleString('es-ES')}</time>
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{item.subtitle}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function PreviewCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] border border-white/7 bg-black/40 p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{title}</p>
      <pre className="mt-3 whitespace-pre-wrap text-xs leading-6 text-zinc-300">{value || 'Sin contenido todavía.'}</pre>
    </div>
  );
}