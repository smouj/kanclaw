# KanClaw Architecture

## Overview

KanClaw is a local-first workspace operating system designed for AI agent teams. The architecture prioritizes data ownership, persistence, and seamless collaboration between humans and AI agents.

## Core Principles

1. **Local-First** — All data lives in `~/.kanclaw/` outside the repository
2. **Premium Experience** — Cinematic UI with "Anti-AI Slop" design philosophy
3. **Agent Integration** — Real-time collaboration with OpenClaw agents
4. **Provenance Tracking** — Every action is traceable through runs, decisions, and artifacts

## System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  Next.js 14 App Router + Tailwind + R3F Ambient           │
├─────────────────────────────────────────────────────────────┤
│                    State Management                         │
│  Zustand stores + React Query patterns                    │
├─────────────────────────────────────────────────────────────┤
│                    Business Logic                          │
│  Prisma services + GitHub connector + OpenClaw events      │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer                               │
│  SQLite (Prisma) + FileSystem (workspace/projects/)       │
└─────────────────────────────────────────────────────────────┘
```

## Data Architecture

### Database (Prisma + SQLite)

Core entities:
- **Project** — Workspace containers
- **Agent** — Agent definitions with SOUL/TOOLS/memory
- **Task** — Kanban board items
- **ChatThread** — Persistent conversation threads
- **ChatMessage** — Individual messages with provenance
- **Run** — Agent execution tracking
- **Snapshot** — Point-in-time exports
- **ProjectImport** — GitHub/local import records

### Filesystem (Local-First)

Real workspace data in:
```
~/.kanclaw/
├── config/
│   └── connectors/     # Encrypted GitHub PATs
├── workspace/
│   └── projects/
│       └── <slug>/
│           ├── agents/
│           ├── tasks/
│           ├── knowledge/
│           ├── decisions/
│           ├── artifacts/
│           └── project-memory.md
└── logs/
```

## Component Architecture

### Frontend Components

```
components/
├── shell/              # Workspace shell layout
│   ├── Sidebar.tsx
│   ├── MainContent.tsx
│   └── ContextPanel.tsx
├── kanban/             # Task board
│   ├── Board.tsx
│   ├── Column.tsx
│   └── TaskCard.tsx
├── chat/              # Agent chat
│   ├── TeamRoom.tsx
│   ├── AgentChannel.tsx
│   └── MessageBubble.tsx
├── memory/            # Memory Hub
│   ├── Overview.tsx
│   ├── Knowledge.tsx
│   ├── Decisions.tsx
│   └── Artifacts.tsx
├── connectors/        # External integrations
│   └── GitHubConnector.tsx
└── ui/                # Shared components
```

### State Stores (Zustand)

- **useProjectStore** — Current project state
- **useChatStore** — Chat threads and messages
- **useAgentStore** — Agent definitions
- **useTaskStore** — Kanban board state
- **useConnectorStore** — GitHub connection state

## Integration Patterns

### OpenClaw Events

```
OpenClaw Gateway (WebSocket)
        │
        ▼
┌───────────────────┐
│  Event Normalizer │ ───► Persist to DB
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  Run Tracker      │ ───► Update UI
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  Chat Injector   │ ───► Real-time messages
└───────────────────┘
```

### GitHub Connector Flow

```
User provides PAT
        │
        ▼
Encrypt & store in ~/.kanclaw/config/
        │
        ▼
List repositories via GitHub API
        │
        ▼
Preview repo metadata
        │
        ▼
Import as new project OR link to existing
```

## Security Model

1. **Local Encryption** — GitHub PATs stored with AES-256
2. **No Cloud Dependency** — All data stays on machine
3. **Token Isolation** — Per-project connector configs
4. **Offline-First** — Graceful degradation without OpenClaw

## Deployment Options

### Development
```bash
npm run dev  # Next.js dev server
```

### Production
```bash
npm run build
npm run start
```

### Desktop (Tauri)
```bash
yarn desktop:build
```

The Tauri build packages Next.js as a sidecar for native desktop experience.

## Performance Considerations

- **Lazy Loading** — R3F ambient layer loads on demand
- **Optimistic Updates** — Immediate UI feedback
- **File Watching** — Real-time filesystem sync
- **Debounced Search** — Memory hub queries
- **Virtual Scrolling** — Large task boards

## Future Roadmap

- [ ] Production desktop wrapper (Tauri final strategy)
- [ ] Real OpenClaw gateway integration
- [ ] E2E tests for chat and connectors
- [ ] More connectors: GitLab, Drive, Notion
- [ ] Accessibility improvements

---

Last updated: 2026-03-13
