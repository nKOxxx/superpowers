#!/bin/bash
# Superpowers Installation Script
# Sets up all OpenClaw superpower skills

set -e

echo "🦞 Installing Superpowers for OpenClaw..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
echo "📋 Checking Node.js version..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+${NC}"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js 18+ required. Found: $(node --version)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node --version)${NC}"

# Check for npm
echo "📦 Checking npm..."
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm --version)${NC}"

# Install dependencies
echo ""
echo "📥 Installing dependencies..."
npm install

# Install Playwright browsers
echo ""
echo "🎭 Installing Playwright browsers..."
npx playwright install chromium

# Build TypeScript
echo ""
echo "🔨 Building TypeScript..."
npm run build

# Make scripts executable
echo ""
echo "🔧 Setting up executables..."
chmod +x dist/browse/scripts/browse.js
chmod +x dist/qa/scripts/qa.js
chmod +x dist/ship/scripts/ship.js
chmod +x dist/plan-ceo-review/scripts/plan-ceo-review.js

# Create symlinks in global bin (optional)
read -p "Create global commands? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    SUPER_DIR=$(pwd)
    
    # Check if user has write access to /usr/local/bin
    if [ -w /usr/local/bin ]; then
        BIN_DIR=/usr/local/bin
    else
        BIN_DIR="$HOME/.local/bin"
        mkdir -p "$BIN_DIR"
    fi
    
    ln -sf "$SUPER_DIR/dist/browse/scripts/browse.js" "$BIN_DIR/browse"
    ln -sf "$SUPER_DIR/dist/qa/scripts/qa.js" "$BIN_DIR/qa"
    ln -sf "$SUPER_DIR/dist/ship/scripts/ship.js" "$BIN_DIR/ship"
    ln -sf "$SUPER_DIR/dist/plan-ceo-review/scripts/plan-ceo-review.js" "$BIN_DIR/plan-ceo-review"
    
    echo -e "${GREEN}✅ Global commands installed to $BIN_DIR${NC}"
    echo "   Make sure $BIN_DIR is in your PATH"
fi

# Setup environment
echo ""
echo "⚙️  Environment setup..."
if [ ! -f ".env" ]; then
    cat > .env << EOF
# Superpowers Environment Configuration
# Copy this to .env.local and fill in your values

# GitHub (required for /ship)
GH_TOKEN=ghp_your_token_here

# Telegram (optional, for notifications)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Playwright (optional)
# PLAYWRIGHT_BROWSERS_PATH=/custom/path
EOF
    echo -e "${YELLOW}⚠️  Created .env file. Edit it with your credentials.${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Superpowers installation complete!${NC}"
echo ""
echo "Available commands:"
echo "  /browse <url>           - Browser automation"
echo "  /qa                     - Run tests"
echo "  /ship --repo=<r> --version=<v>  - Release"
echo "  /plan-ceo-review <feature>      - Product review"
echo ""
echo "Documentation:"
echo "  browse/SKILL.md         - Browser automation guide"
echo "  qa/SKILL.md             - QA testing guide"
echo "  ship/SKILL.md           - Release pipeline guide"
echo "  plan-ceo-review/SKILL.md - BAT framework guide"
echo ""
echo "Configuration:"
echo "  Edit superpowers.config.json to customize flows and settings"
echo ""
