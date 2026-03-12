#!/usr/bin/env bash
# AIM Token Mainnet Deployment — STUB
# Requires: anchor CLI, solana CLI, funded mainnet deployer wallet
# Run: bash scripts/mainnet-deploy.sh
set -euo pipefail

echo "=== PlanetLoga AIM Token — Mainnet Deployment ==="
echo ""
echo "STATUS: NOT YET READY — Prerequisites:"
echo "  1. Security audit completed"
echo "  2. DAO governance vote passed"
echo "  3. Deployer wallet funded with ~5 SOL"
echo "  4. TREASURY_KEYPAIR env var set"
echo ""
echo "Steps (manual until automated):"
echo "  1. anchor build -p aim-token"
echo "  2. solana program deploy target/deploy/aim_token.so --url mainnet-beta"
echo "  3. Initialize config: anchor run init-mainnet"
echo "  4. Initialize treasury: anchor run init-treasury-mainnet"
echo "  5. Mint initial supply: anchor run mint-treasury-mainnet (100M AIM)"
echo "  6. Create metadata via create_metadata instruction"
echo "  7. Verify on Solscan/Explorer"
echo ""
echo "After deployment, update:"
echo "  - packages/sdk-ts/src/constants.ts (mainnet program ID)"
echo "  - apps/web .env (SOLANA_CLUSTER=mainnet)"
echo ""
echo "Exiting — this is a preparation script, not auto-deploy."
exit 0
