#!/bin/bash
set -e

echo "Installing ClawHub skills for Loga Prime..."

npx clawhub install solana-basics
echo "✓ solana-basics"

npx clawhub install firecrawl-search
echo "✓ firecrawl-search"

npx clawhub install web-browser-automation --force
echo "✓ web-browser-automation"

npx clawhub install mycelium-skill --force
echo "✓ mycelium-skill"

echo ""
echo "All skills installed. Configure Discord via bundled skill:"
echo "  openclaw skills setup discord"
echo ""
echo "Done."
