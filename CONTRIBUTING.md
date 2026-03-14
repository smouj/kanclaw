# Contributing to KanClaw

Welcome! This guide will help you get started with contributing to KanClaw.

## Development Setup

### Prerequisites
- Node.js 18+
- npm 9+

### Quick Start

```bash
# Clone the repository
git clone https://github.com/smouj/kanclaw.git
cd kanclaw/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file:

```env
# Required
OPENCLAW_TOKEN=your_token_here

# Optional
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Lint
npm run lint

# Build
npm run build
```

## Code Style

- Use **TypeScript** for all new code
- Follow existing code conventions
- Run `npm run lint` before committing
- Use meaningful variable names

## Pull Request Process

1. **Create a branch**
   ```bash
   git checkout -b feat/my-feature
   # or
   git checkout -b fix/my-fix
   ```

2. **Make your changes**
   - Keep changes small and focused
   - Write tests for new features
   - Update documentation

3. **Before submitting**
   ```bash
   npm run lint     # No errors
   npm run test    # All tests pass
   npm run build   # Builds successfully
   ```

4. **Submit PR**
   - Use clear PR titles
   - Describe what changed and why
   - Link any related issues

## Project Structure

```
frontend/
├── app/              # Next.js App Router
├── components/      # React components
├── lib/             # Utilities and helpers
├── scripts/         # Build and automation scripts
├── tests/           # Unit and E2E tests
└── public/          # Static assets
```

## Versioning

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

## Questions?

- Open an issue: https://github.com/smouj/kanclaw/issues
- Discussion: https://github.com/smouj/kanclaw/discussions

---

Thanks for contributing! 🎉
