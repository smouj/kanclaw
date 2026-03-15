/**
 * KanClaw Model Configuration Service
 * 
 * Manages model configuration at project and agent level.
 * Supports defaults, overrides, and inheritance.
 */

import { prisma } from '@/lib/prisma';

export interface ModelConfig {
  id: string;
  projectId: string;
  agentId?: string | null;
  provider: string;
  model: string;
  temperature?: number | null;
  maxTokens?: number | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Default models available in KanClaw
export const AVAILABLE_MODELS = [
  { id: 'minimax-m2.5:free', name: 'MiniMax M2.5', provider: 'kilocode', emoji: '🔥', free: true },
  { id: 'minimax-m2.1:free', name: 'MiniMax M2.1', provider: 'kilocode', emoji: '⚡', free: true },
  { id: 'anthropic/sonnet', name: 'Claude Sonnet', provider: 'anthropic', emoji: '💎', free: false },
  { id: 'anthropic/opus', name: 'Claude Opus', provider: 'anthropic', emoji: '💎', free: false },
  { id: 'openai-codex/gpt-5.3-codex', name: 'GPT-5.3 Codex', provider: 'openai-codex', emoji: '🚀', free: false },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google', emoji: '🌟', free: true },
  { id: 'openrouter/auto', name: 'OpenRouter Auto', provider: 'openrouter', emoji: '🔀', free: true },
] as const;

export type ModelId = typeof AVAILABLE_MODELS[number]['id'];

// Get default model for a project
export async function getProjectDefaultModel(projectSlug: string): Promise<ModelConfig | null> {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true }
  });
  
  if (!project) return null;
  
  const result = await prisma.modelConfig.findFirst({
    where: { projectId: project.id, isDefault: true }
  });
  
  if (!result) return null;
  
  return {
    ...result,
    temperature: result.temperature ?? undefined,
    maxTokens: result.maxTokens ?? undefined
  };
}

// Get model config for a specific agent (with project fallback)
export async function getAgentModelConfig(
  projectSlug: string, 
  agentName?: string
): Promise<ModelConfig | null> {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    include: { agents: { where: agentName ? { name: agentName } : undefined } }
  });
  
  if (!project) return null;
  
  // First try agent-specific config
  if (project.agents.length > 0) {
    const agentConfig = await prisma.modelConfig.findFirst({
      where: { projectId: project.id, agentId: project.agents[0].id }
    });
    if (agentConfig) {
      return {
        ...agentConfig,
        temperature: agentConfig.temperature ?? undefined,
        maxTokens: agentConfig.maxTokens ?? undefined
      };
    }
  }
  
  // Fall back to project default
  return getProjectDefaultModel(projectSlug);
}

// Set default model for a project
export async function setProjectDefaultModel(
  projectSlug: string,
  provider: string,
  model: string,
  temperature?: number,
  maxTokens?: number
): Promise<ModelConfig> {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true }
  });
  
  if (!project) {
    throw new Error('Project not found');
  }
  
  // Remove existing defaults
  await prisma.modelConfig.updateMany({
    where: { projectId: project.id, isDefault: true },
    data: { isDefault: false }
  });
  
  // Create new default
  return prisma.modelConfig.create({
    data: {
      projectId: project.id,
      provider,
      model,
      temperature,
      maxTokens,
      isDefault: true
    }
  });
}

// Set model override for a specific agent
export async function setAgentModelOverride(
  projectSlug: string,
  agentName: string,
  provider: string,
  model: string,
  temperature?: number,
  maxTokens?: number
): Promise<ModelConfig> {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    include: { agents: { where: { name: agentName } } }
  });
  
  if (!project) {
    throw new Error('Project not found');
  }
  
  const agent = project.agents[0];
  if (!agent) {
    throw new Error('Agent not found');
  }
  
  // Remove existing override for this agent
  await prisma.modelConfig.deleteMany({
    where: { projectId: project.id, agentId: agent.id }
  });
  
  // Create new override
  return prisma.modelConfig.create({
    data: {
      projectId: project.id,
      agentId: agent.id,
      provider,
      model,
      temperature,
      maxTokens,
      isDefault: false
    }
  });
}

// Get effective model (agent override or project default or fallback)
export async function getEffectiveModel(
  projectSlug: string,
  agentName?: string,
  fallbackModel: string = 'minimax-m2.5:free'
): Promise<{ provider: string; model: string; temperature?: number; maxTokens?: number }> {
  // Try to get agent or project config
  const config = await getAgentModelConfig(projectSlug, agentName);
  
  if (config) {
    return {
      provider: config.provider,
      model: config.model,
      temperature: config.temperature ?? undefined,
      maxTokens: config.maxTokens ?? undefined
    };
  }
  
  // Return fallback
  const [provider, model] = fallbackModel.split('/');
  return { provider: provider || 'kilocode', model: fallbackModel };
}

// List all model configs for a project
export async function listProjectModelConfigs(projectSlug: string) {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true }
  });
  
  if (!project) return [];
  
  return prisma.modelConfig.findMany({
    where: { projectId: project.id },
    include: { 
      agent: { select: { id: true, name: true } } 
    },
    orderBy: { createdAt: 'desc' }
  });
}
