# KanClaw Frontend

Technical documentation for the KanClaw frontend and control plane.

> **Note**: This document covers the technical implementation. For product overview, see the main [README.md](../README.md).

## Overview

KanClaw frontend is a Next.js 14 application that provides:
- **UI Layer**: Chat, Board, Files, Memory interfaces
- **Control Plane**: Backend services for project governance
- **API Layer**: REST endpoints for frontend integration

## Architecture

```
┌──────────────────────────────────────┐
│         KANCLAW UI                   │
│  Chat │ Board │ Files │ Memory       │
└──────────────┬───────────────────────┘
               │
┌──────────────▼───────────────────────┐
│      KANCLAW CONTROL PLANE            │
│  Context │ Models │ Provenance        │
│  Memory  │ Repo   │ Agent Policy      │
└──────────────┬───────────────────────┘
               │
┌──────────────▼───────────────────────┐
│         OPENCLAW                      │
│  Agent Runtime │ Tools │ Models        │
└──────────────────────────────────────┘
```

## Quick Start

```bash
cd frontend

# Install dependencies
npm install

# Development server (port 3020)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── api/              # API routes
│   ├── project/[slug]/   # Project pages
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── chat/             # Chat components
│   ├── board/             # Board components
│   ├── files/             # File explorer
│   ├── memory/            # Memory hub
│   └── control-plane/     # Control plane UI
├── lib/                   # Core services
│   ├── feature-flags.ts   # Feature flag system
│   ├── model-config.ts    # Model configuration
│   ├── provenance.ts      # Execution tracing
│   ├── memory-orchestrator.ts  # Memory management
│   ├── repo-intelligence.ts    # Workspace indexing
│   └── openclaw-adapter.ts    # OpenClaw bridge
├── prisma/               # Database schema
├── tests/                # Unit tests
└── docs/                 # Technical docs
```

## Control Plane Services

The control plane consists of backend services that manage project governance:

| Service | File | Status |
|---------|------|--------|
| Feature Flags | `lib/feature-flags.ts` | ✅ Stable |
| Model Config | `lib/model-config.ts` | ✅ Stable |
| Provenance | `lib/provenance.ts` | ✅ Stable |
| Memory Orchestrator | `lib/memory-orchestrator.ts` | 🔶 Opt-in |
| Repo Intelligence | `lib/repo-intelligence.ts` | 🔶 Opt-in |
| OpenClaw Adapter | `lib/openclaw-adapter.ts` | 🔶 Opt-in |

**Status Legend:**
- ✅ Stable: Enabled by default
- 🔶 Opt-in: Behind feature flag (disabled by default)

## Feature Flags

Configure via environment variables:

```bash
# Enabled by default
USE_AGENT_MODEL_OVERRIDES=true
USE_PROVENANCE_V2=true

# Disabled by default (opt-in)
KANCLAW_USE_KANCLAW_CONTEXT_ENGINE=false
KANCLAW_USE_MEMORY_ORCHESTRATOR=false
KANCLAW_USE_REPO_INTELLIGENCE=false
```

## API Endpoints

### Core APIs
- `POST /api/chat` - Send message to agent
- `GET /api/events` - SSE event stream

### Control Plane APIs
- `GET/PUT /api/projects/[slug]/settings` - Model configuration
- `GET /api/projects/[slug]/provenance` - Execution graph
- `GET /api/projects/[slug]/context` - Context pack
- `GET/POST /api/projects/[slug]/memory` - Memory summaries
- `GET /api/projects/[slug]/repo` - Workspace indexing

### Integration APIs
- `GET/POST /api/connectors/github` - GitHub connection
- `GET /api/connectors/github/repositories` - List repos

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `file:./dev.db` | Prisma database |
| `OPENCLAW_HTTP` | `http://127.0.0.1:18789` | OpenClaw HTTP |
| `OPENCLAW_WS` | `ws://127.0.0.1:18789/events` | OpenClaw WebSocket |
| `OPENCLAW_BEARER_TOKEN` | - | Auth token |

## Database Schema

Key tables:
- **Project**: Workspace container
- **Agent**: Project agents (official & custom)
- **Task**: Work items
- **Run**: Agent executions
- **ChatThread**: Conversation threads
- **ChatMessage**: Messages
- **ModelConfig**: Per-project/agent model settings
- **MemorySummary**: Curated memory & handoffs

See `prisma/schema.prisma` for complete schema.

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- feature-flags.test.ts
```

## Building

```bash
# Development build
npm run dev

# Production build (standalone)
npm run build

# Start production
PORT=3020 npm start
```

## Related Documentation

- [Architecture](../docs/ARCHITECTURE.md) - System design
- [API Reference](../docs/API_REFERENCE.md) - Endpoint docs
- [Control Plane](../docs/CONTROL_PLANE.md) - Backend services guide
