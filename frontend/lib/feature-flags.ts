/**
 * KanClaw Feature Flags
 * 
 * This module provides feature flags for gradual rollout of new functionality.
 * Flags can be enabled/disabled globally or per-project.
 * 
 * Usage:
 * - import { isFeatureEnabled, FEATURE_FLAGS } from '@/lib/feature-flags';
 * - isFeatureEnabled('USE_KANCLAW_CONTEXT_ENGINE')
 * - isFeatureEnabled('USE_AGENT_MODEL_OVERRIDES', projectSlug)
 */

export interface FeatureFlag {
  name: string;
  description: string;
  defaultEnabled: boolean;
  rolloutPercentage?: number; // 0-100, for gradual rollout
}

// Feature definitions
export const FEATURE_FLAGS: FeatureFlag[] = [
  {
    name: 'USE_KANCLAW_CONTEXT_ENGINE',
    description: 'Use the new KanClaw context engine for building project context',
    defaultEnabled: false,
  },
  {
    name: 'USE_AGENT_MODEL_OVERRIDES',
    description: 'Allow per-agent model configuration',
    defaultEnabled: true,
  },
  {
    name: 'USE_PROVENANCE_V2',
    description: 'Enhanced provenance tracking for runs and messages',
    defaultEnabled: true,
  },
  {
    name: 'USE_MEMORY_ORCHESTRATOR',
    description: 'Enhanced memory management with handoffs and summaries',
    defaultEnabled: false,
  },
  {
    name: 'USE_REPO_INTELLIGENCE',
    description: 'Enhanced repository context and file intelligence',
    defaultEnabled: false,
  },
  {
    name: 'USE_CONTEXT_PACK',
    description: 'Use context packs instead of flat context building',
    defaultEnabled: false,
  },
];

// Get all feature flag names
export function getFeatureFlagNames(): string[] {
  return FEATURE_FLAGS.map(f => f.name);
}

// Check if a feature is enabled globally
export function isFeatureEnabled(flagName: string): boolean {
  const flag = FEATURE_FLAGS.find(f => f.name === flagName);
  if (!flag) return false;
  
  // Check environment variable override
  const envVar = `KANCLAW_${flagName}`;
  if (process.env[envVar] !== undefined) {
    return process.env[envVar] === 'true';
  }
  
  return flag.defaultEnabled;
}

// Check if a feature is enabled with potential per-project override
export async function isFeatureEnabledForProject(
  flagName: string, 
  projectSlug?: string
): Promise<boolean> {
  // First check global setting
  if (!isFeatureEnabled(flagName)) {
    return false;
  }
  
  // If there's a project and rollout percentage, check it
  const flag = FEATURE_FLAGS.find(f => f.name === flagName);
  if (projectSlug && flag?.rolloutPercentage !== undefined) {
    // Use project slug hash for consistent rollout
    const hash = projectSlug.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    const projectPercent = Math.abs(hash) % 100;
    return projectPercent < flag.rolloutPercentage;
  }
  
  return true;
}

// Get all enabled features
export function getEnabledFeatures(): string[] {
  return FEATURE_FLAGS.filter(f => isFeatureEnabled(f.name)).map(f => f.name);
}

// Feature flag middleware helper
export function getFeatureFlagsForClient(): Record<string, boolean> {
  const flags: Record<string, boolean> = {};
  for (const flag of FEATURE_FLAGS) {
    flags[flag.name] = isFeatureEnabled(flag.name);
  }
  return flags;
}
