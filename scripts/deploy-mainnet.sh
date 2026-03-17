#!/usr/bin/env bash
set -euo pipefail

# PlanetLoga Mainnet Deployment Script
# Run from the project root: bash scripts/deploy-mainnet.sh

CONTRACTS_DIR="contracts"
KEYPAIR="${SOLANA_KEYPAIR:-$HOME/.config/solana/id.json}"

echo "=========================================="
echo " PlanetLoga.AI — Mainnet Deployment"
echo "=========================================="

# Verify environment
echo "[1/6] Checking Solana CLI..."
solana --version
solana config set --url mainnet-beta --keypair "$KEYPAIR"

BALANCE=$(solana balance --lamports)
echo "       Deployer balance: $(solana balance)"
if [ "$BALANCE" -lt 5000000000 ]; then
  echo "ERROR: Insufficient balance. Need at least 5 SOL for deployment."
  exit 1
fi

echo "[2/6] Building contracts..."
cd "$CONTRACTS_DIR"
anchor build

echo "[3/6] Deploying AIM Token program..."
anchor deploy --program-name aim_token --provider.cluster mainnet
AIM_PROGRAM=$(solana address -k target/deploy/aim_token-keypair.json)
echo "       AIM Token Program: $AIM_PROGRAM"

echo "[4/6] Deploying Agent Registry..."
anchor deploy --program-name agent_registry --provider.cluster mainnet
REGISTRY_PROGRAM=$(solana address -k target/deploy/agent_registry-keypair.json)
echo "       Agent Registry: $REGISTRY_PROGRAM"

echo "[5/6] Deploying Marketplace..."
anchor deploy --program-name marketplace --provider.cluster mainnet
MARKET_PROGRAM=$(solana address -k target/deploy/marketplace-keypair.json)
echo "       Marketplace: $MARKET_PROGRAM"

echo "[6/6] Deploying Governance..."
anchor deploy --program-name governance --provider.cluster mainnet
GOV_PROGRAM=$(solana address -k target/deploy/governance-keypair.json)
echo "       Governance: $GOV_PROGRAM"

cd ..

echo ""
echo "=========================================="
echo " Deployment complete!"
echo "=========================================="
echo ""
echo " Update .env.production with:"
echo "   SOLANA_CLUSTER=mainnet"
echo "   AIM_TOKEN_PROGRAM=$AIM_PROGRAM"
echo "   AGENT_REGISTRY_PROGRAM=$REGISTRY_PROGRAM"
echo "   MARKETPLACE_PROGRAM=$MARKET_PROGRAM"
echo "   GOVERNANCE_PROGRAM=$GOV_PROGRAM"
echo ""
echo " Next steps:"
echo "   1. Initialize programs (config, mint, treasury)"
echo "   2. Run: bash scripts/create-raydium-pool.sh"
echo "   3. Update token info on Solscan"
echo "   4. Submit to CoinMarketCap and CoinGecko"
echo "=========================================="
