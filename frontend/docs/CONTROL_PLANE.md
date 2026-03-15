# KanClaw Control Plane

## What is the Control Plane?

The Control Plane is KanClaw's backend layer for **project governance**, **context management**, and **agent coordination**. It sits between the UI and OpenClaw (execution plane).

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│    UI       │────▶│  CONTROL PLANE   │────▶│  OPENCLAW  │
│ (Frontend)  │◀────│  (KanClaw)       │◀────│ (Execution) │
└─────────────┘     └──────────────────┘     └─────────────┘
```

## Responsibilities

### What KanClaw Controls
- **Project Context**: What memory, decisions, files enter the prompt
- **Model Configuration**: Which model each agent uses
- **Provenance**: Full trace of executions
- **Memory**: Curated summaries and handoffs
- **Agent Policies**: Official vs custom agents
- **Workspace**: File indexing and search

### What OpenClaw Handles
- **Agent Runtime**: Actual execution
- **Sessions**: Agent sessions and state
- **Tools**: File operations, shell, etc.
- **Streaming**: Real-time output
- **Model Calls**: LLM integration

## Services

### 1. Context Service
Decides what context is relevant for each request.

**Responsibilities:**
- Build context packs from memory, decisions, tasks, files
- Score and rank context items by relevance
- Separate durable vs operational vs ephemeral context
- Limit context size to avoid token waste

**Context Types:**
- **Core**: Project memory, key decisions
- **Supporting**: Recent runs, tasks, files
- **Ephemeral**: Current conversation

### 2. Model Config Service
Manages model selection per project/agent.

**Features:**
- Project-level default model
- Per-agent model override
- Model metadata (temperature, maxTokens)
- Available models list

**Models Supported:**
- MiniMax M2.5 (free)
- MiniMax M2.1 (free)
- Claude Sonnet
- Claude Opus
- GPT-5.3 Codex
- Gemini 2.5 Flash
- OpenRouter Auto

### 3. Provenance Service
Tracks full execution lineage.

**Tracks:**
- Message → Run → Task → Artifact
- Context used per execution
- Model used
- Duration and status

**Use Cases:**
- Chat message details
- Board task history
- Audit trails
- Debugging

### 4. Memory Orchestrator
Manages project and agent memory.

**Features:**
- Project durable memory
- Agent-specific memory
- Handoff summaries between agents
- Periodic activity summaries
- Curated memory for context

**Memory Types:**
- **Project**: Long-term knowledge
- **Agent**: Agent-specific context
- **Handoff**: Transfer summaries
- **Periodic**: Activity summaries

### 5. Repo Intelligence
Indexes workspace files.

**Features:**
- File tree generation
- Search functionality
- Important path detection
- Safe file reading

### 6. OpenClaw Adapter
Bridges KanClaw and OpenClaw.

**Features:**
- Pre-processes requests (enrich context)
- Post-processes responses (add provenance)
- Fallback to legacy mode
- Error handling

## Feature Flags

Control new features with flags:

| Flag | Default | When to Enable |
|------|---------|----------------|
| USE_AGENT_MODEL_OVERRIDES | true | Per-agent models |
| USE_PROVENANCE_V2 | true | Enhanced tracing |
| USE_KANCLAW_CONTEXT_ENGINE | false | New context pack |
| USE_MEMORY_ORCHESTRATOR | false | Handoffs |
| USE_REPO_INTELLIGENCE | false | File indexing |

### Enabling Flags

**Globally** (environment):
```bash
KANCLAW_USE_MEMORY_ORCHESTRATOR=true
```

**Per-project** (programmatic):
```typescript
// In feature-flags.ts
export const FEATURE_FLAGS = [
  {
    name: 'USE_MEMORY_ORCHESTRATOR',
    defaultEnabled: true,  // Change default
    rolloutPercentage: 50 // Gradual rollout
  }
]
```

## Migration Guide

### Legacy Mode (Default)
All features off - KanClaw works as before:
- Direct chat to OpenClaw
- Basic context
- No provenance tracking

### Enhanced Mode (Opt-in)
Features enabled via flags:
- Context packs
- Model overrides
- Provenance tracking
- Memory orchestrator

### Gradual Rollout
1. Enable flags in development
2. Test with sample projects
3. Enable for % of projects
4. Full rollout

## Architecture Principles

1. **Additive**: Never breaks existing functionality
2. **Compatible**: Feature flags for safe rollout
3. **Modular**: Each service is independent
4. **Observable**: Provenance for debugging
5. **Native**: Feels like KanClaw, not a separate system

## Future Enhancements

- [ ] Context pack UI (what enters prompt)
- [ ] Model usage analytics
- [ ] Agent handoff UI
- [ ] Provenance visualizer
- [ ] Memory editor UI
- [ ] Workspace sync status
