<div align="center">

![KanClaw Logo](./frontend/public/kanclaw-logo-light.png)

# KanClaw

### Premium Local-First Workspace OS for AI Agent Teams

[![GitHub stars](https://img.shields.io/github/stars/smouj/kanclaw?style=for-the-badge)](https://github.com/smouj/kanclaw/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/smouj/kanclaw?style=for-the-badge)](https://github.com/smouj/kanclaw/network/members)
[![GitHub issues](https://img.shields.io/github/issues/smouj/kanclaw?style=for-the-badge)](https://github.com/smouj/kanclaw/issues)
[![License: MIT](https://img.shields.io/badge/license-MIT-22c55e?style=for-the-badge)](https://opensource.org/licenses/MIT)

[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-149eca?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06b6d4?style=flat&logo=tailwindcss)](https://tailwindcss.com/)

[Español](./README.es.md) · [Issues](https://github.com/smouj/kanclaw/issues) · [Discussions](https://github.com/smouj/kanclaw/discussions)

</div>

---

## Latest Release

- **v0.3.0** — Custom React hooks library, open-source ready setup
- [Release Notes](./RELEASE_NOTES_v0.3.0.md)
- [Changelog](./CHANGELOG.md)

---

## Who is this for?

- **Founders** shipping product features with AI copilots
- **Indie hackers** who need speed without losing traceability
- **Small teams** coordinating agent runs with persistent context

> KanClaw helps you move fast with AI while keeping structure, auditability, and delivery quality.

---

## Table of Contents

- [Why KanClaw](#why-kanclaw)
- [Quick Start](#quick-start)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Why KanClaw

KanClaw is a **local-first workspace OS** where **humans + AI agents** collaborate with persistent context, structured memory, and production-ready team workflows.

| Problem | KanClaw Solution |
|---------|------------------|
| Context gets lost between sessions | Persistent Memory Hub |
| AI delegation is opaque | Real run tracking with provenance |
| Tooling is fragmented | Unified interface |
| Generic UI fatigue | Premium cinematic UX |

---

## Quick Start

### Try Demo Mode

Visit `/setup` and click **"Enter Demo Mode"** to explore KanClaw without any configuration!

### Local Development

```bash
# Clone the repository
git clone https://github.com/smouj/kanclaw.git
cd kanclaw/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit http://localhost:3000

### Configuration

KanClaw requires an [OpenClaw](https://github.com/openclaw) gateway to connect to AI agents.

1. **OpenClaw Setup** - Start your OpenClaw instance (default: http://localhost:3001)
2. **Configure** - Visit `/setup` to enter your OpenClaw URL and token
3. **Or use Demo Mode** - Explore with sample data

#### Environment Variables (Optional)

```bash
# OpenClaw connection
OPENCLAW_TOKEN=your_openclaw_token
OPENCLAW_HTTP=http://localhost:3001
OPENCLAW_WS=ws://localhost:3001/events

# Authentication (optional)
KANCLAW_AUTH_TOKEN=your_secure_token
```

---

## Features

- **Multi-Agent Collaboration** - Work with multiple AI agents in team rooms
- **Real-time Chat** - Interact with agents through a unified interface
- **Memory Hub** - Persistent knowledge, decisions, and run history
- **File Management** - Browse and edit project files
- **Keyboard Shortcuts** - Power user navigation (Ctrl+K, Ctrl+1-5)
- **Dark/Light Theme** - System preference support
- **i18n** - English, Spanish, French
- **PWA Ready** - Install as native app
- **Security** - Optional authentication, CSP headers, rate limiting
- **Observability** - Logging, error boundaries, performance tracking

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| UI | React 18, TypeScript, Tailwind CSS |
| State | React Context + Hooks |
| Styling | Custom design system with CSS variables |
| PWA | Service Worker, Manifest |
| Testing | Vitest, Playwright |
| Deployment | Node.js, Docker, Vercel |

---

## Project Structure

```
kanclaw/
├── frontend/                 # Next.js application
│   ├── app/                 # App Router pages
│   ├── components/          # React components
│   ├── lib/                 # Utilities and hooks
│   ├── scripts/             # Build scripts
│   ├── tests/               # Unit and E2E tests
│   └── public/              # Static assets
├── docs/                    # Documentation
├── CONTRIBUTING.md          # Contributing guidelines
├── LICENSE                  # MIT License
├── CHANGELOG.md             # Version history
└── README.md                # This file
```

---

## Development

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Lint
npm run lint

# Build
npm run build

# Tests
npm run test        # Unit tests
npm run test:e2e    # E2E tests

# Analyze bundle
npm run analyze
```

---

## Deployment

### Docker (Recommended)

```yaml
# docker-compose.yml
services:
  kanclaw:
    image: kanclaw/kanclaw:latest
    ports:
      - "3000:3000"
    environment:
      - OPENCLAW_TOKEN=your_token
      - OPENCLAW_HTTP=http://host.docker.internal:3001
```

```bash
docker-compose up -d
```

### Vercel

```bash
cd frontend
vercel deploy
```

### Node.js (Production)

```bash
cd frontend
npm run build
npm start
```

---

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](./CONTRIBUTING.md) first.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and lint
5. Submit a Pull Request

---

## License

This project is licensed under the [MIT License](./LICENSE).

---

## Links

- [Website](https://kanclaw.io)
- [GitHub](https://github.com/smouj/kanclaw)
- [OpenClaw](https://github.com/openclaw)
- [Report Issues](https://github.com/smouj/kanclaw/issues)

---

<div align="center">

**Built with ❤️ by the KanClaw Team**

</div>
