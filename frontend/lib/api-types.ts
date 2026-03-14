// API Response Types for KanClaw

// Base response wrapper
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Health check
export interface HealthResponse {
  app: string;
  openclaw: {
    connected: boolean;
    status: number;
    agents: Agent[];
  };
  config: {
    httpBase: string;
    wsBase: string;
    hasToken: boolean;
  };
}

// Agent
export interface Agent {
  id: string;
  name: string;
  identity?: {
    name: string;
    theme: string;
    emoji: string;
    avatar?: string;
    avatarUrl?: string;
  };
}

// Project
export interface Project {
  id: string;
  slug: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  agents: Agent[];
  settings?: ProjectSettings;
}

export interface ProjectSettings {
  theme?: string;
  language?: string;
  visibility?: 'public' | 'private';
}

// Thread
export interface Thread {
  id: string;
  projectId: string;
  agentId?: string;
  title: string;
  scope: 'TEAM' | 'AGENT';
  summary?: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export interface Message {
  id: string;
  threadId: string;
  role: 'human' | 'agent';
  actor: string;
  targetAgentName?: string;
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// Run
export interface Run {
  id: string;
  threadId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input?: string;
  output?: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

// Snapshot
export interface Snapshot {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  data: Record<string, unknown>;
  createdAt: string;
}

// Files
export interface FileNode {
  name: string;
  path: string;
  kind: 'file' | 'directory';
  children?: FileNode[];
  editable?: boolean;
}

// Delegation
export interface Delegation {
  id: string;
  actor: string;
  action: string;
  details?: string | Record<string, unknown>;
  timestamp: string;
}

// Import
export interface Import {
  id: string;
  provider: string;
  label: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
}

// Knowledge
export interface KnowledgeItem {
  id: string;
  path: string;
  title: string;
  snippet?: string;
  timestamp: string;
}

// Project Memory
export interface ProjectMemory {
  id: string;
  content: string;
  updatedAt: string;
}

// GitHub Status
export interface GitHubStatus {
  connected: boolean;
  mode: 'PAT' | 'OAuth' | 'none';
  username?: string;
  repositories?: string[];
}

// OpenClaw Config
export interface OpenClawConfig {
  httpBase: string;
  wsBase: string;
  hasToken: boolean;
}
