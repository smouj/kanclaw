# KanClaw Architecture

## Overview

KanClaw is a **local-first workspace operating system** designed for AI agent teams. The architecture prioritizes data ownership, persistence, and seamless collaboration between humans and AI agents.

## Core Principles

1. **Local-First** — All data lives in `~/.kanclaw/` outside the repository
2. **Premium Experience** — Cinematic UI with "Anti-AI Slop" design philosophy
3. **Agent Integration** — Real-time collaboration with OpenClaw agents
4. **Provenance Tracking** — Every action is traceable through runs, decisions, and artifacts
5. **Self-Hosted** — One instance per user/team, full data ownership

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Presentation Layer                             │
│  Next.js 14 App Router + Tailwind CSS + Custom Design System   │
├─────────────────────────────────────────────────────────────────┤
│                   State Management                                 │
│  React Context + Custom Hooks                                   │
├─────────────────────────────────────────────────────────────────┤
│                   Business Logic                                 │
│  Prisma ORM + OpenClaw Gateway API + FileSystem                 │
├─────────────────────────────────────────────────────────────────┤
│                     Data Layer                                   │
│  SQLite (Prisma) + FileSystem (workspace/projects/)            │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router, Standalone) |
| UI | React 18, TypeScript, Tailwind CSS v3 |
| Styling | Custom design system with CSS variables |
| Database | SQLite with Prisma ORM |
| State | React Context + Custom Hooks |
| PWA | Service Worker, Web App Manifest |
| Icons | Lucide React |
| Deployment | Node.js, Docker |

## Frontend Architecture

### Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | HomePageClient | Dashboard with project cards, OpenClaw status, activity |
| `/project/[slug]` | ProjectWorkspaceShell | Full workspace with sidebar, kanban, chat, memory hub |

### Component Structure

```
components/
├── ui/                       # Base UI components
│   ├── button.tsx           # Custom button variants
│   ├── input.tsx            # Styled inputs
│   └── textarea.tsx         # Styled textareas
├── AmbientCanvas.tsx        # R3F ambient background
├── CommandPalette.tsx       # Ctrl+K command palette
├── ConfirmDialog.tsx       # Delete confirmations
├── LanguageSelector.tsx    # i18n language picker
├── OpenClawConfig.tsx      # OpenClaw connection panel
├── ProjectCreateForm.tsx   # New project form
├── ProjectMemoryHub.tsx    # Memory/knowledge management
├── ProjectSidebar.tsx      # Project navigation
├── TaskCard.tsx           # Kanban task cards
├── ThemeToggle.tsx         # Dark/light mode toggle
└── PromptInput.tsx        # Agent chat input
```

### Design System

The UI uses a **Premium Black/Silver** aesthetic:

- **Backgrounds**: Dark gradients (`rgba(10,10,10,0.95)` → `rgba(5,5,5,0.98)`)
- **Borders**: Subtle white borders (`rgba(255,255,255,0.08)`)
- **Accents**: Green (`#10b981`) for connected states
- **Typography**: Inter font, tracking spacing for headers

Key CSS variables:
```css
--kc-surface: #0a0a0a;
--kc-surface2: #141414;
--kc-border: rgba(255,255,255,0.08);
--kc-text-primary: #f4f4f5;
--kc-text-muted: #71717a;
--kc-accent-green: #10b981;
```

## Backend Architecture

### API Routes

```
app/api/
├── health/route.ts         # Gateway health check
├── metrics/route.ts        # OpenClaw metrics
├── openclaw/
│   ├── config/route.ts     # OpenClaw configuration
│   └── send-task/route.ts  # Task delegation
├── projects/
│   ├── route.ts            # List/create projects
│   └── [id]/route.ts       # Get/update/delete project
├── runs/route.ts           # Run history
├── tasks/route.ts          # Task management
└── snapshots/route.ts      # Memory snapshots
```

### Database Schema (Prisma)

```prisma
model Project {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  agents      Agent[]
  tasks       Task[]
  runs        Run[]
  snapshots   Snapshot[]
}

model Agent {
  id        String   @id @default(cuid())
  name      String
  role      String?
  projectId String
  project   Project  @relation(fields: [projectId], references: [id])
}

model Task {
  id          String   @id @default(cuid())
  title       String
  status      String   @default("todo")
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
}

model Run {
  id        String   @id @default(cuid())
  title     String
  status    String
  projectId String
  project   Project  @relation(fields: [projectId], references: [id])
}
```

## Data Flow

```
User Action → React Component → API Route → Prisma → SQLite
                ↓
         OpenClaw Gateway → AI Agent → Response
                ↓
         Real-time Update → WebSocket/Polling → UI Refresh
```

## Deployment

### Production Build

```bash
cd frontend
npm run build  # Outputs to .next/
```

### Docker

```yaml
services:
  kanclaw:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - kanclaw-data:/home/node/.kanclaw
```

## Security

- **No authentication by default** — Local-first, self-hosted
- **Optional auth token** — Via `KANCLAW_AUTH_TOKEN`
- **CSP headers** — Content Security Policy configured
- **Rate limiting** — Built-in Next.js protection
- **Input sanitization** — All inputs validated

## Performance

- **Static generation** — For public pages
- **Server components** — Reduced client bundle
- **Image optimization** — Next.js Image component
- **Font optimization** — @next/font
