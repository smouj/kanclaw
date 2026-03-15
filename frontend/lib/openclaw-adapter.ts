/**
 * KanClaw OpenClaw Adapter
 * 
 * Adapter layer between KanClaw's control plane and OpenClaw's execution plane.
 * - Builds context packs before sending to OpenClaw
 * - Normalizes requests
 * - Tracks provenance
 * - Handles responses and telemetry
 */

import { isFeatureEnabled, isFeatureEnabledForProject } from './feature-flags';
import { getEffectiveModel } from './model-config';
import { buildMessageProvenance } from './provenance';
import { getCuratedMemoryForContext } from './memory-orchestrator';

export interface OpenClawRequest {
  projectSlug: string;
  threadId: string;
  agentName?: string;
  content: string;
  contextItems: ContextItem[];
  model?: string;
  metadata?: Record<string, any>;
}

export interface ContextItem {
  id: string;
  kind: string;
  title: string;
  path?: string;
  runId?: string;
  taskId?: string;
  threadId?: string;
  snippet?: string;
}

export interface OpenClawResponse {
  ok: boolean;
  messageId?: string;
  thread?: any;
  error?: string;
  metadata?: Record<string, any>;
}

// Build enhanced context for OpenClaw
export async function buildEnhancedContext(
  projectSlug: string,
  query: string,
  agentName?: string,
  existingContext: ContextItem[] = []
): Promise<{
  contextItems: ContextItem[];
  model: { provider: string; model: string; temperature?: number; maxTokens?: number };
  metadata: Record<string, any>;
}> {
  const contextItems = [...existingContext];
  const metadata: Record<string, any> = {
    contextEngine: 'legacy',
    builtAt: new Date().toISOString()
  };
  
  // Get model configuration
  let model = await getEffectiveModel(projectSlug, agentName);
  
  // Try to use new context engine if enabled
  const useContextEngine = await isFeatureEnabledForProject('USE_KANCLAW_CONTEXT_ENGINE', projectSlug);
  
  if (useContextEngine) {
    try {
      // Get curated memory
      const memory = await getCuratedMemoryForContext(projectSlug, query, 2000);
      
      if (memory.entries.length > 0) {
        // Add memory items to context
        for (const entry of memory.entries.slice(0, 5)) {
          contextItems.push({
            id: entry.id,
            kind: 'memory_summary',
            title: entry.title,
            snippet: entry.content.slice(0, 200)
          });
        }
        metadata.contextEngine = 'v2';
        metadata.memoryEntries = memory.entries.length;
      }
    } catch (error) {
      // Fallback to legacy - don't break the flow
      console.error('Context engine error:', error);
    }
  }
  
  return { contextItems, model, metadata };
}

// Pre-process chat request for OpenClaw
export async function adaptChatRequest(
  request: OpenClawRequest
): Promise<{
  enriched: OpenClawRequest;
  provenance: { contextEngine: string; builtAt: string };
}> {
  const { contextItems, model, metadata } = await buildEnhancedContext(
    request.projectSlug,
    request.content,
    request.agentName,
    request.contextItems
  );
  
  const enriched: OpenClawRequest = {
    ...request,
    contextItems,
    model: `${model.provider}/${model.model}`,
    metadata: {
      ...request.metadata,
      ...metadata,
      temperature: model.temperature,
      maxTokens: model.maxTokens
    }
  };
  
  return {
    enriched,
    provenance: {
      contextEngine: metadata.contextEngine as string,
      builtAt: metadata.builtAt as string
    }
  };
}

// Post-process response from OpenClaw
export async function adaptChatResponse(
  response: OpenClawResponse,
  request: OpenClawRequest,
  provenance: { contextEngine: string; builtAt: string }
): Promise<OpenClawResponse> {
  // If successful, track provenance
  if (response.ok && response.messageId) {
    try {
      // Build provenance for the message
      const msgProvenance = await buildMessageProvenance(response.messageId);
      
      // Add provenance metadata to response
      return {
        ...response,
        metadata: {
          ...response.metadata,
          provenance: {
            tracked: true,
            contextEngine: provenance.contextEngine,
            builtAt: provenance.builtAt,
            messageProvenance: msgProvenance
          }
        }
      };
    } catch (error) {
      // Don't fail the response if provenance fails
      console.error('Provenance tracking error:', error);
    }
  }
  
  return response;
}

// Full adapter: pre-process request, call OpenClaw, post-process response
export async function executeWithAdapter(
  request: OpenClawRequest,
  openClawExecutor: (req: OpenClawRequest) => Promise<OpenClawResponse>
): Promise<OpenClawResponse> {
  // Check if adapter is enabled
  const useAdapter = await isFeatureEnabledForProject('USE_KANCLAW_CONTEXT_ENGINE', request.projectSlug);
  
  if (!useAdapter) {
    // Direct pass-through - legacy mode
    return openClawExecutor(request);
  }
  
  // Pre-process
  const { enriched, provenance } = await adaptChatRequest(request);
  
  // Execute
  const response = await openClawExecutor(enriched);
  
  // Post-process
  return adaptChatResponse(response, request, provenance);
}

// Get telemetry for a project
export async function getProjectTelemetry(projectSlug: string) {
  const useProvenance = isFeatureEnabled('USE_PROVENANCE_V2');
  
  if (!useProvenance) {
    return { enabled: false, message: 'Provenance V2 not enabled' };
  }
  
  // Would fetch from provenance service
  return { enabled: true, projectSlug };
}
