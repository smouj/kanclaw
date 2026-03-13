#!/bin/bash
set -e

# KanClaw One-Command Installer
# Usage: curl -sL https://raw.githubusercontent.com/smouj/kanclaw/main/scripts/install.sh | bash

echo "🧠 Installing KanClaw..."

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Visit https://nodejs.org"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed."; exit 1; }

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js 20+ is required. Current: $(node -v)"
    exit 1
fi

# Clone repository
KANCLAW_DIR="${KANCLAW_DIR:-$HOME/kanclaw}"
if [ -d "$KANCLAW_DIR" ]; then
    echo "📁 KanClaw already exists at $KANCLAW_DIR"
    read -p "⚠️  Overwrite? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Installation cancelled"
        exit 1
    fi
    rm -rf "$KANCLAW_DIR"
fi

echo "📦 Cloning repository..."
git clone --depth 1 https://github.com/smouj/kanclaw.git "$KANCLAW_DIR"

# Install dependencies
echo "📚 Installing dependencies..."
cd "$KANCLAW_DIR/frontend"
npm install

# Setup environment
echo "⚙️  Setting up environment..."
cp .env.example .env

# Initialize database
echo "🗄️  Initializing database..."
npm run db:generate
npm run db:push

# Optional: Seed demo data
if [ "${KANCLAW_SEED:-true}" = "true" ]; then
    echo "🌱 Seeding demo data..."
    npm run seed
fi

# Start server
echo "🚀 Starting KanClaw..."
echo ""
echo "✅ Installation complete!"
echo "   Open http://localhost:3000 in your browser"
echo ""
echo "📁 Project location: $KANCLAW_DIR"
echo "🧠 To start later: cd $KANCLAW_DIR/frontend && npm run dev"
echo ""
