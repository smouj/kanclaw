# KanClaw Architecture

## Overview

KanClaw is a **Premium Local-First Workspace OS** for AI agent teams. It provides a control plane that manages project context, memory, and agent coordination while delegating execution to OpenClaw.

```
┌─────────────────────────────────────────────────────────────┐
│                      KANCLAW UI                              │
│  (Chat, Board, Files, Memory, Settings)                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  KANCLAW CONTROL PLANE                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │   Context    │ │    Model     │ │  Provenance  │       │
│  │   Service    │ │    Config    │ │   Service    │       │
│  └──────────────┘ └──────────────┘ └──────────────┘       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │    Memory    │ │     Repo     │ │    Agent    │       │
│  │  Orchestrator│ │ Intelligence │ │   Policy    │       │
│  └──────────────┘ └──────────────┘ └──────────────┘       │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    OPENCLAW                                  │
│              (Execution Plane)                               │
│  - Agent Runtime                                             │
│  - Sessions & Tools                                          │
│  - Model Integration                                         │
│  - Streaming & Events                                        │
└─────────────────────────────────────────────────────────────┘
```

## Control Plane Services

### 1. Context Service (`lib/context.ts`)
- Builds project context packs
- Selects relevant memory, decisions, tasks, files
- Separates durable, operational, ephemeral context

### 2. Model Config (`lib/model-config.ts`)
- Per-project default models
- Per-agent overrides
- Provider + model + temperature + maxTokens

### 3. Provenance (`lib/provenance.ts`)
- Message → Run → Task → Artifact tracing
- Full execution graph
- UI integration for chat/board

### 4. Memory Orchestrator (`lib/memory-orchestrator.ts`)
- Project durable memory
- Agent-specific memory
- Handoff summaries between agents
- Periodic compaction

### 5. Repo Intelligence (`lib/repo-intelligence.ts`)
- Workspace indexing
- File tree & search
- Important paths detection

### 6. OpenClaw Adapter (`lib/openclaw-adapter.ts`)
- Pre-processes requests with context
- Post-processes with provenance
- Fallback to legacy mode

## Data Models

### Core Tables
- **Project**: Workspace container
- **Agent**: Project agents (official & custom)
- **Task**: Work items
- **Run**: Agent executions
- **ChatThread**: Conversation threads
- **ChatMessage**: Messages in threads
- **Snapshot**: Project snapshots
- **ActivityLog**: Audit trail

### Control Plane Tables
- **ModelConfig**: Per-project/agent model settings
- **MemorySummary**: Curated memory & handoffs

## API Structure

### Core APIs
- `/api/chat` - Chat messaging
- `/api/events` - SSE events
- `/api/runs` - Run management
- `/api/tasks` - Task management

### Control Plane APIs
- `/api/projects/[slug]/settings` - Model configuration
- `/api/projects/[slug]/provenance` - Execution tracing
- `/api/projects/[slug]/context` - Context packs
- `/api/projects/[slug]/memory` - Memory & handoffs
- `/api/projects/[slug]/repo` - Workspace indexing

### Integration APIs
- `/api/official-agents` - Official agent templates
- `/api/connectors/github` - GitHub integration
- `/api/openclaw/config` - OpenClaw configuration

## Feature Flags

| Flag | Default | Description |
|------|---------|-------------|
| USE_AGENT_MODEL_OVERRIDES | true | Per-agent model config |
| USE_PROVENANCE_V2 | true | Enhanced tracing |
| USE_KANCLAW_CONTEXT_ENGINE | false | New context engine |
| USE_MEMORY_ORCHESTRATOR | false | Handoffs & summaries |
| USE_REPO_INTELLIGENCE | false | Workspace indexing |

## OpenClaw Integration

### Request Flow
```
User Message → KanClaw API → Context Builder → OpenClaw → Response
                                           ↓
                                    Provenance Tracker
```

### Event Flow
```
OpenClaw Events → KanClaw SSE → UI Updates
```

### Configuration
OpenClaw connection is configured via:
- Environment variables: `OPENCLAW_HTTP`, `OPENCLAW_WS`, `OPENCLAW_BEARER_TOKEN`
- Config file: `~/.kanclaw/config/openclaw.json`

## Development

### Local Setup
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
npm start
```

### Database
```bash
npx prisma db push    # Apply schema
npx prisma studio     # Visual editor
```

## Production

### Environment Variables
```
DATABASE_URL=file:./dev.db
OPENCLAW_HTTP=http://127.0.0.1:18789
OPENCLAW_WS=ws://127.0.0.1:18789/events
KANCLAW_USE_KANCLAW_CONTEXT_ENGINE=false
```

### Ports
- KanClaw UI: 3020
- OpenClaw: 18789
