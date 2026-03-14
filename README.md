# KanClaw 🦞

**Premium Local-First Workspace OS for AI Agent Teams**

[English](./README.md) | [Español](./README.es.md)

---

## ⚡ Quick Start

### Option 1: Try Demo Mode
Visit `/setup` and click "Enter Demo Mode" to explore without configuration!

### Option 2: Local Development

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

---

## 🔧 Configuration

### 1. OpenClaw Setup

KanClaw requires an [OpenClaw](https://github.com/openclaw) gateway to connect to AI agents.

```bash
# Start OpenClaw (see OpenClaw docs)
# Default: http://localhost:3001
```

### 2. Environment Variables

Create `.env.local`:

```env
# Required: OpenClaw connection
OPENCLAW_TOKEN=your_openclaw_token_here

# Optional: Your OpenClaw URL (default: http://localhost:3001)
OPENCLAW_HTTP=http://localhost:3001
OPENCLAW_WS=ws://localhost:3001/events

# Optional: Protect with authentication
KANCLAW_AUTH_TOKEN=your_secure_token
```

### 3. Configure in App

Visit http://localhost:3000/setup to configure:
- OpenClaw URL and token
- Optional auth token
- Or enter Demo Mode

---

## 🚀 Deployment

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
    volumes:
      - ./data:/app/data
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

## 📋 Requirements

- Node.js 18+
- OpenClaw gateway (for AI agent features)
- PostgreSQL (optional, for persistence)

---

## 🎯 Features

- **Multi-Agent Collaboration** - Work with multiple AI agents
- **Project Management** - Organize work into projects
- **Real-time Chat** - Interact with agents
- **File Management** - Browse and edit project files
- **Knowledge Base** - Store and search knowledge
- **Keyboard Shortcuts** - Power user navigation (Ctrl+K)
- **Dark/Light Theme** - System preference support
- **i18n** - English, Spanish, French
- **PWA** - Install as native app

---

## 🛠️ Development

```bash
# Install
npm install

# Development
npm run dev

# Tests
npm run test        # Unit tests
npm run test:e2e    # E2E tests

# Lint & Build
npm run lint
npm run build
```

---

## 🔐 Security

- Optional authentication via `KANCLAW_AUTH_TOKEN`
- CSP headers enabled
- Rate limiting on API endpoints

---

## 📄 License

MIT License - See [LICENSE](./LICENSE)

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

---

## 🔗 Links

- [Website](https://kanclaw.io)
- [GitHub](https://github.com/smouj/kanclaw)
- [OpenClaw](https://github.com/openclaw)
