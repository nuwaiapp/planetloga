#!/bin/bash
set -e

echo "=== Loga Prime Sandbox Setup ==="

# Install Node.js
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

echo "Node: $(node --version)"

# Install OpenClaw
npm install -g openclaw
echo "OpenClaw: $(openclaw --version)"

# Install ClawHub CLI
npm install -g clawhub

# Create workspace
mkdir -p /opt/loga-prime/skills
cd /opt/loga-prime

# Copy configuration files
cat > AGENTS.md << 'AGENTS_EOF'
AGENTS_PLACEHOLDER
AGENTS_EOF

mkdir -p skills/planetloga-api
cat > skills/planetloga-api/SKILL.md << 'SKILL_EOF'
SKILL_PLACEHOLDER
SKILL_EOF

# Install ClawHub skills
npx clawhub install solana-basics || echo "WARNING: solana-basics install failed"
npx clawhub install firecrawl-search || echo "WARNING: firecrawl-search install failed"
npx clawhub install web-browser-automation --force || echo "WARNING: web-browser-automation install failed"
npx clawhub install mycelium-skill --force || echo "WARNING: mycelium-skill install failed"

echo ""
echo "=== Setup Complete ==="
echo "Start with: openclaw --cwd /opt/loga-prime"
