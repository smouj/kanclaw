'use client';

import { useState } from 'react';
import { Shield, Zap, Database, MemoryStick, FolderSearch } from 'lucide-react';

interface FeatureFlagsPanelProps {
  projectSlug: string;
}

// These should match feature-flags.ts
const FLAGS = [
  {
    key: 'USE_AGENT_MODEL_OVERRIDES',
    name: 'Model Overrides',
    description: 'Allow per-agent model configuration',
    icon: Zap,
    default: true,
  },
  {
    key: 'USE_PROVENANCE_V2',
    name: 'Provenance Tracking',
    description: 'Enhanced execution tracing',
    icon: Shield,
    default: true,
  },
  {
    key: 'USE_KANCLAW_CONTEXT_ENGINE',
    name: 'Context Engine',
    description: 'New context pack builder',
    icon: Database,
    default: false,
  },
  {
    key: 'USE_MEMORY_ORCHESTRATOR',
    name: 'Memory Orchestrator',
    description: 'Handoffs and summaries',
    icon: MemoryStick,
    default: false,
  },
  {
    key: 'USE_REPO_INTELLIGENCE',
    name: 'Repo Intelligence',
    description: 'Workspace indexing',
    icon: FolderSearch,
    default: false,
  },
];

export function FeatureFlagsPanel({ projectSlug }: FeatureFlagsPanelProps) {
  // In a real implementation, these would be fetched from the server
  // For now, display the flags and their status
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5" />
        <h2 className="text-lg font-semibold">Feature Flags</h2>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          ⚠️ Los flags se configuran mediante variables de entorno. 
          Esta UI es de solo lectura.
        </p>
      </div>

      <div className="space-y-3">
        {FLAGS.map((flag) => {
          const Icon = flag.icon;
          return (
            <div
              key={flag.key}
              className="flex items-center justify-between p-4 rounded-lg border bg-card"
            >
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 mt-0.5 text-muted-foreground" />
                <div>
                  <h3 className="font-medium">{flag.name}</h3>
                  <p className="text-sm text-muted-foreground">{flag.description}</p>
                  <code className="text-xs bg-muted px-1 py-0.5 rounded mt-1 inline-block">
                    KANCLAW_{flag.key}
                  </code>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  flag.default ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {flag.default ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-sm text-muted-foreground">
        <p>Para activar un flag, añade la variable de entorno correspondiente al archivo .env:</p>
        <pre className="mt-2 bg-muted p-2 rounded overflow-x-auto">
{`KANCLAW_USE_MEMORY_ORCHESTRATOR=true
KANCLAW_USE_REPO_INTELLIGENCE=true`}
        </pre>
      </div>
    </div>
  );
}
