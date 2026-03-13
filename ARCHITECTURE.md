# KanClaw Architecture

## Overview

KanClaw is a local-first workspace operating system designed for AI agent teams. The architecture prioritizes data ownership, persistence, and seamless collaboration between humans and AI agents.

## Core Principles

1. **Local-First** — All data lives in `~/.kanclaw/` outside the repository
2. **Premium Experience** — Cinematic UI with "Anti-AI Slop" design philosophy
3. **Agent Integration** — Real-time collaboration with OpenClaw agents
4. **Provenance Tracking** — Every action is traceable through runs, decisions, and artifacts

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Presentation Layer                             │
│  Next.js 14 App Router + Tailwind CSS + R3F Ambient            │
├─────────────────────────────────────────────────────────────────┤
│                   State Management                                 │
│  Zustand stores + React Query patterns                         │
├─────────────────────────────────────────────────────────────────┤
│                   Business Logic                                 │
│  Prisma services + GitHub connector + OpenClaw events           │
├─────────────────────────────────────────────────────────────────┤
│                     Data Layer                                   │
│  SQLite (Prisma) + FileSystem (workspace/projects/)             │
└─────────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Dashboard | Workspace overview with metrics, activity, ambient R3F |
| `/project/[slug]` | ProjectWorkspaceShell | Full workspace with sidebar, kanban, chat, memory hub |

### Component Structure

```
components/
├── shell/                    # Workspace shell layout
│   ├── Sidebar.tsx          # Navigation sidebar
│   ├── MainContent.tsx      # Central content area
│   └── ContextPanel.tsx    # Right contextual panel
├── kanban/                   # Task board
│   ├── Board.tsx            # Main kanban container
│   ├── Column.tsx          # Column component
│   └── TaskCard.tsx         # Individual task card
├── chat/                     # Agent chat
│   ├── AgentChatSurface.tsx  # Chat interface
│   ├── TeamRoom.tsx         # Project-wide chat
│   └── MessageBubble.tsx    # Message component
├── memory/                   # Memory Hub
│   ├── ProjectMemoryHub.tsx # Main hub container
│   ├── Overview.tsx         # Bento grid overview
│   ├── Knowledge.tsx        # Knowledge section
│   ├── Decisions.tsx        # Decisions section
│   └── Artifacts.tsx        # Artifacts section
├── connectors/               # External integrations
│   └── GitHubConnectorPanel.tsx
├── ui/                       # Shared components
└── CommandPalette.tsx        # Cmd+K palette
```

### State Management (Zustand)

| Store | Purpose |
|-------|---------|
| `useProjectStore` | Current project state and metadata |
| `useChatStore` | Chat threads and messages |
| `useAgentStore` | Agent definitions and configurations |
| `useTaskStore` | Kanban board state |
| `useConnectorStore` | GitHub connection state |

## Data Architecture

### Database Schema (Prisma + SQLite)

Core entities:

```prisma
model Project {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  agents      Agent[]
  tasks       Task[]
  threads     ChatThread[]
  runs        Run[]
  snapshots   Snapshot[]
  imports     ProjectImport[]
}

model Agent {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  name      String
  type      String   // "planner", "builder", "qa", etc.
  config    Json?
}

model Task {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  title     String
  status   String   // "backlog", "in_progress", "done"
  order     Int
}

model ChatThread {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  agentId   String?
  type      String   // "team", "agent"
}

model ChatMessage {
  id        String   @id @default(cuid())
  threadId  String
  content   String
  role      String   // "user", "assistant"
  metadata  Json?
}

model Run {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  agentId   String?
  status    String   // "running", "completed", "failed"
  result    Json?
}

model Snapshot {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  data      Json
  createdAt DateTime @default(now())
}

model ProjectImport {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  source    String   // "github", "local"
  metadata  Json
}
```

### Filesystem Structure (Local-First)

Real workspace data in:
```
~/.kanclaw/
├── config/
│   └── connectors/
│       └── github.enc           # Encrypted GitHub PAT
├── workspace/
│   └── projects/
│       └── <slug>/
│           ├── agents/
│           │   └── <agent-name>/
│           │       ├── SOUL.md       # Agent persona
│           │       ├── TOOLS.md      # Agent capabilities
│           │       └── memory.md     # Agent accumulated memory
│           ├── tasks/               # Kanban board data
│           ├── knowledge/           # Project knowledge base
│           ├── decisions/           # Architectural decisions
│           ├── artifacts/
│           │   └── snapshots/      # Point-in-time exports
│           │       └── <snapshot-id>.json
│           └── project-memory.md   # Project overview
└── logs/
```

## Integration Patterns

### OpenClaw Events

```
OpenClaw Gateway (WebSocket)
        │
        ▼
┌─────────────────────┐
│  Event Normalizer    │ ───► Persist to DB
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  Run Tracker        │ ───► Update UI
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  Chat Injector      │ ───► Real-time messages
└─────────────────────┘
```

### GitHub Connector Flow

```
1. User provides PAT
        │
        ▼
2. Encrypt & store in ~/.kanclaw/config/
        │
        ▼
3. List repositories via GitHub API
        │
        ▼
4. Preview repo metadata
        │
        ▼
5. Import as new project OR link to existing
```

## Security Model

| Aspect | Implementation |
|--------|----------------|
| Local Encryption | GitHub PATs stored with AES-256 |
| No Cloud Dependency | All data stays on machine |
| Token Isolation | Per-project connector configs |
| Offline-First | Graceful degradation without OpenClaw |

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
cd frontend
npm run build
npm run desktop:prepare-sidecar
npm run desktop:build
```

The Tauri build packages Next.js as a sidecar for native desktop experience.
Build artifacts are generated in `frontend/src-tauri/target/release/bundle/`.

## Performance Considerations

| Technique | Purpose |
|-----------|---------|
| Lazy Loading | R3F ambient layer loads on demand |
| Optimistic Updates | Immediate UI feedback |
| File Watching | Real-time filesystem sync |
| Debounced Search | Memory hub queries |
| Virtual Scrolling | Large task boards |

## API Routes

| Endpoint | Handler | Description |
|----------|---------|-------------|
| `/api/projects` | Project CRUD | List, create, update, delete projects |
| `/api/projects/[slug]/agents` | Agent management | Agent definitions |
| `/api/projects/[slug]/tasks` | Kanban operations | Task CRUD and ordering |
| `/api/projects/[slug]/chat` | Chat operations | Threads and messages |
| `/api/projects/[slug]/github` | GitHub connector | Auth, listing, import |
| `/api/projects/[slug]/snapshots` | Snapshot management | Export and restore |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite file path |
| `OPENCLAW_HTTP` | No | OpenClaw HTTP endpoint |
| `OPENCLAW_WS` | No | OpenClaw WebSocket endpoint |
| `OPENCLAW_BEARER_TOKEN` | No | Authentication token |

## Future Roadmap

- [ ] Production desktop wrapper (Tauri final strategy)
- [ ] Real OpenClaw gateway integration
- [ ] E2E tests for chat and connectors
- [ ] More connectors: GitLab, Drive, Notion
- [ ] Accessibility improvements
- [ ] Mobile responsive design

---

*Last updated: 2026-03-13*
