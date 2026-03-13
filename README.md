# KanClaw

<p align="center">
  <img src="https://kanclaw.com/logo-dark.png" alt="KanClaw" width="200" />
</p>

<p align="center">
  <strong>Premium Local-First Living Workspace OS for AI Agent Teams</strong>
</p>

<p align="center">
  <a href="https://kanclaw.com">
    <img src="https://img.shields.io/badge/Live-kanclaw.com-000000?style=for-the-badge" alt="Website" />
  </a>
  <a href="https://github.com/smouj/kanclaw">
    <img src="https://img.shields.io/github/stars/smouj/kanclaw?style=for-the-badge" alt="Stars" />
  </a>
  <a href="https://github.com/smouj/kanclaw/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/smouj/kanclaw?style=for-the-badge" alt="License" />
  </a>
  <a href="https://discord.gg/kanclaw">
    <img src="https://img.shields.io/badge/Discord-KanClaw-5865F2?style=for-the-badge" alt="Discord" />
  </a>
</p>

---

## What is KanClaw?

KanClaw is a **premium local-first workspace operating system** for AI agent teams. It provides a persistent, cinematic environment where humans and AI agents collaborate on projects with structured memory, task management, real-time chat, and deep GitHub integration.

Unlike cloud-based solutions, KanClaw stores all data locally in `~/.kanclaw/`, giving you complete ownership of your team's knowledge, decisions, and artifacts.

## Why KanClaw?

| Problem | KanClaw Solution |
|---------|-----------------|
| Scattered context across prompts | Structured Memory Hub with Knowledge, Decisions, Artifacts |
| No persistence between sessions | Local-first storage with SQLite + filesystem |
| Blind delegation to AI agents | Runs with real-time tracking and provenance |
| Disconnected tooling | GitHub connector with PAT-based auth, local encryption |
| Generic AI interfaces | Premium cinematic design with "Anti-AI Slop" philosophy |

## Key Features

### 🖥️ Premium Workspace Shell
- Cinematic dark interface with ambient R3F layers
- Command palette (Cmd+K) for quick navigation
- Contextual panels (sidebar, main content, right rail)
- Persistent navigation across views

### 🤖 Agent Collaboration
- **Team Room** — Project-wide chat for human-agent collaboration
- **Per-Agent Channels** — Direct conversations with individual agents
- **Real Runs** — Live execution tracking with OpenClaw integration
- **Offline Grace** — Honest state when OpenClaw is unavailable

### 🧠 Memory Hub
Structured accumulation of project knowledge:
- **Overview** — Bento grid with project metrics
- **Knowledge** — Structured information base
- **Decisions** — Architectural choices and rationale
- **Artifacts** — Generated outputs and exports
- **Agent Souls** — Agent personas (SOUL.md)
- **Runs** — Execution history and provenance

### 📸 Snapshots
- Point-in-time exports of project state
- JSON artifacts for auditing and recovery
- Covers tasks, runs, decisions, knowledge, and artifacts

### 🔗 GitHub Connector
- Secure PAT storage (encrypted locally)
- Repository listing and search
- Preview before import
- Import as new project or link to existing

### 📁 Local-First Architecture
All data lives in `~/.kanclaw/`:
```
~/.kanclaw/workspace/projects/<slug>/
├── agents/          # Agent definitions + memory
├── tasks/           # Kanban board
├── knowledge/       # Knowledge base
├── decisions/       # Architectural decisions
├── artifacts/       # Generated outputs
│   └── snapshots/  # Point-in-time exports
└── project-memory.md
```

### 🖥️ Desktop Ready
- Tauri 2 wrapper for native experience
- Next.js standalone server as sidecar
- Local-first preserved in desktop mode

## Screenshots

| View | Description |
|------|-------------|
| Dashboard | Workspace overview with ambient R3F background |
| Project Workspace | Full shell with sidebar + panels |
| Kanban Board | Drag-and-drop task management |
| Agent Chat | Team Room + per-agent channels |
| Memory Hub | Bento grid with knowledge/decisions/artifacts |
| GitHub Connector | PAT input, repo listing, import flow |
| Command Palette | Cmd+K quick actions |

*See [`screenshots/`](screenshots/) for required visual assets.*

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand |
| Drag & Drop | @dnd-kit |
| 3D Ambient | React Three Fiber (R3F) |
| Database | Prisma + SQLite |
| Desktop | Tauri 2 |
| AI Integration | OpenClaw (WebSocket events) |
| GitHub | REST API with local PAT storage |

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- (Optional) Tauri CLI for desktop builds

### Installation

```bash
# Clone the repository
git clone https://github.com/smouj/kanclaw.git
cd kanclaw/frontend

# Install dependencies
npm install
# or
yarn install

# Copy environment template
cp .env.example .env

# Generate Prisma client and create database
npm run db:generate
npm run db:push

# (Optional) Seed demo project
npm run seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

```env
DATABASE_URL="file:./dev.db"
OPENCLAW_HTTP="http://localhost:3001"
OPENCLAW_WS="ws://localhost:3001/events"
OPENCLAW_BEARER_TOKEN=""
```

## Project Structure

```
kanclaw/
├── frontend/                 # Next.js 14 application
│   ├── app/                # App Router pages
│   │   ├── page.tsx       # Dashboard
│   │   └── project/
│   │       └── [slug]/
│   │           └── page.tsx  # Project workspace
│   ├── components/          # React components
│   │   ├── shell/         # Workspace shell
│   │   ├── kanban/        # Task board
│   │   ├── chat/          # Agent chat
│   │   ├── memory/        # Memory Hub
│   │   ├── connectors/    # GitHub connector
│   │   └── ui/            # Shared components
│   ├── prisma/            # Database schema
│   └── public/            # Static assets
├── backend/                 # Python server (legacy)
├── .github/                # CI/CD workflows
├── design_guidelines.json  # Design system spec
└── screenshots/            # Visual documentation
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run seed` | Load demo project data |
| `npm run lint` | Run ESLint |
| `yarn desktop:dev` | Run Tauri dev mode |
| `yarn desktop:build` | Build Tauri app |

## CI/CD

The repository includes GitHub Actions workflows:

- **Frontend CI** — `.github/workflows/frontend-ci.yml`
  - Dependency installation
  - Prisma generate + db push
  - Database seeding
  - ESLint validation
  - Production build

## Design Philosophy

KanClaw follows a "Anti-AI Slop" philosophy:

### Core Principles
- ✅ **Cinematic, Quiet, Precision** aesthetic
- ✅ **High contrast** text on deep backgrounds
- ✅ **Luxurious spacing** (2-3x normal)
- ✅ **Meaningful motion** with reduced-motion support
- ✅ **Glass morphism** with backdrop blur

### Typography
- **Headings:** Manrope
- **Body:** IBM Plex Sans
- **Mono:** JetBrains Mono

### Color Palette
- Canvas: `#020202`
- Surface: `#0A0A0A`, `#121212`, `#1A1A1A`
- Border: `#1F1F1F`, `#2A2A2A`
- Text: `#EDEDED`, `#A1A1AA`, `#52525B`

### Anti-Patterns (Never Use)
- ❌ Generic purple/teal AI gradients
- ❌ Center-everything layouts
- ❌ Space Grotesk font
- ❌ Particle storms
- ❌ Rainbow dashboards
- ❌ Generic centered AI assistant emojis

See [`design_guidelines.json`](design_guidelines.json) for the complete specification.

## Architecture

For detailed system architecture, see [`ARCHITECTURE.md`](ARCHITECTURE.md):

- System layers (Presentation → State → Business → Data)
- Database schema (Prisma entities)
- Filesystem structure
- Component architecture
- Integration patterns (OpenClaw, GitHub)
- Security model
- Performance considerations

## Contributing

Contributions are welcome. Please:

1. Fork the repository
2. Create a feature branch
3. Follow the design guidelines in `design_guidelines.json`
4. Run lint and build before submitting PRs

## License

MIT License — see [`LICENSE`](LICENSE) for details.

---

Built with 🔥 by [Smouj](https://github.com/smouj)

*KanClaw — Your Local-First AI Agent Workspace*
