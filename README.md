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

- 🖥️ **Premium Workspace Shell** — Cinematic dark interface with ambient R3F layers, command palette (Cmd+K), and contextual panels
- 🤖 **Agent Collaboration** — Persistent chat with team room and per-agent channels, real runs with OpenClaw integration
- 🧠 **Memory Hub** — Structured accumulation of Knowledge, Decisions, Agent Souls, and Artifacts
- 📸 **Snapshots** — Point-in-time exports of project state for auditing and recovery
- 🔗 **GitHub Connector** — Secure PAT storage, repo listing, preview, and import as new projects
- 📁 **Local-First** — All data lives in `~/.kanclaw/workspace/projects/<slug>/` with no cloud dependency
- 🖥️ **Desktop Ready** — Tauri 2 wrapper for native desktop experience

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
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
│   ├── src/
│   │   ├── app/            # App Router pages
│   │   ├── components/      # React components
│   │   ├── lib/            # Utilities and stores
│   │   └── styles/         # Global styles
│   ├── prisma/             # Database schema
│   └── public/             # Static assets
├── backend/                 # Python server (legacy)
├── .github/                # CI/CD workflows
└── design_guidelines.json  # Design system specification
```

## Local-First Architecture

All project data is stored outside the repository:

```bash
~/.kanclaw/workspace/projects/<project-slug>/
├── agents/
│   └── <agent-name>/
│       ├── SOUL.md        # Agent persona
│       ├── TOOLS.md       # Agent capabilities
│       └── memory.md      # Agent accumulated memory
├── tasks/                  # Kanban board tasks
├── knowledge/             # Project knowledge base
├── decisions/             # Architectural decisions
├── artifacts/             # Generated artifacts
│   └── snapshots/         # Point-in-time exports
└── project-memory.md      # Project overview
```

## GitHub Connector

1. Open a project in KanClaw
2. Navigate to **Connectors**
3. Paste your **GitHub Personal Access Token** (stored encrypted locally)
4. Browse and select repositories
5. Import as new project or link to existing

The connector stores your PAT encrypted in `~/.kanclaw/config/`.

## Desktop Application

KanClaw includes a Tauri 2 wrapper for native desktop experience:

```bash
cd frontend

# Development mode
yarn desktop:dev

# Build for production
yarn desktop:build
```

The desktop build packages the Next.js standalone server as a Tauri sidecar.

## Commands Reference

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

The repository includes GitHub Actions workflows in `.github/workflows/frontend-ci.yml`:

- Dependency installation
- Prisma generation and database push
- Database seeding
- ESLint validation
- Production build

## Design Philosophy

KanClaw follows a "Anti-AI Slop" philosophy:

- ✅ **Cinematic, Quiet, Precision** aesthetic
- ✅ **High contrast** text on deep backgrounds
- ✅ **Luxurious spacing** (2-3x normal)
- ✅ **Meaningful motion** with reduced-motion support

Anti-patterns we avoid:
- ❌ Generic purple/teal AI gradients
- ❌ Center-everything layouts
- ❌ Space Grotesk font
- ❌ Particle storms
- ❌ Rainbow dashboards

See [`design_guidelines.json`](design_guidelines.json) for the complete specification.

## Contributing

Contributions are welcome. Please read our contributing guidelines before submitting PRs.

## License

MIT License — see [`LICENSE`](LICENSE) for details.

---

Built with 🔥 by [Smouj](https://github.com/smouj)
