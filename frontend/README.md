# KanClaw

A **Premium Local-First Workspace OS** for AI agent teams. KanClaw provides a control plane for project governance, context management, and agent coordination while delegating execution to OpenClaw.

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
│         OPENCLAW                     │
│  Agent Runtime │ Tools │ Models       │
└──────────────────────────────────────┘
```

## Tech Stack

- **Framework**: Next.js 14 (App Router, Standalone)
- **UI**: React 18, Tailwind CSS v3, Lucide React
- **Database**: Prisma + SQLite
- **Language**: TypeScript

## Quick Start

```bash
# Install dependencies
npm install

# Development
npm run dev

# Production build
npm run build
npm start
```

Visit http://localhost:3020

## Features

### Core
- **Multi-Agent Collaboration**: Official & custom agents
- **Real-Time Chat**: SSE-powered live execution
- **Kanban Board**: Task management
- **File Explorer**: Multi-source (workspace, GitHub, memory)
- **Memory Hub**: Project knowledge base

### Control Plane
- **Context Engine**: Curated context packs
- **Model Configuration**: Per-project/agent models
- **Provenance**: Full execution tracing
- **Memory Orchestrator**: Handoffs & summaries
- **Repo Intelligence**: Workspace indexing

### Integrations
- **GitHub**: Repository import & sync
- **OpenClaw**: Agent execution runtime
- **i18n**: EN/ES/FR support
- **PWA**: Installable app
- **Dark/Light**: Theme support

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - System design
- [API Reference](docs/API_REFERENCE.md) - Endpoint documentation
- [Control Plane](docs/CONTROL_PLANE.md) - Backend services

## Environment Variables

```bash
# Database
DATABASE_URL=file:./dev.db

# OpenClaw Integration
OPENCLAW_HTTP=http://127.0.0.1:18789
OPENCLAW_WS=ws://127.0.0.1:18789/events
OPENCLAW_BEARER_TOKEN=your-token

# Feature Flags
KANCLAW_USE_KANCLAW_CONTEXT_ENGINE=false
KANCLAW_USE_MEMORY_ORCHESTRATOR=false
KANCLAW_USE_REPO_INTELLIGENCE=false
```

## Production

### Build
```bash
npm run build
```

### Run
```bash
npm start
# or
PORT=3020 npm start
```

### Docker
```bash
docker build -t kanclaw .
docker run -p 3020:3020 kanclaw
```

## Project Structure

```
frontend/
├── app/              # Next.js app router
│   ├── api/         # API routes
│   └── project/     # Project pages
├── components/      # React components
├── lib/             # Core services
│   ├── control-plane/  # New services
│   └── ...
├── prisma/         # Database schema
└── docs/           # Documentation
```

## Control Plane Services

| Service | Purpose |
|---------|---------|
| Context | Build context packs |
| Model Config | Per-project/agent models |
| Provenance | Execution tracing |
| Memory | Summaries & handoffs |
| Repo | File indexing |
| Adapter | OpenClaw bridge |

## Feature Flags

| Flag | Default |
|------|---------|
| USE_AGENT_MODEL_OVERRIDES | true |
| USE_PROVENANCE_V2 | true |
| USE_KANCLAW_CONTEXT_ENGINE | false |
| USE_MEMORY_ORCHESTRATOR | false |
| USE_REPO_INTELLIGENCE | false |

## License

MIT
