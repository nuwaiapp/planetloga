#!/usr/bin/env bash
set -euo pipefail

# PlanetLoga Raydium CLMM Pool Creation Script
# Prerequisites:
#   - AIM Token deployed on mainnet
#   - SOL for liquidity + fees
#   - AIM tokens minted to Treasury
#
# This script provides the steps needed. Some require Raydium UI.

echo "=========================================="
echo " Raydium CLMM Pool Creation Guide"
echo "=========================================="

AIM_MINT="${AIM_MINT:-C3kqYcX6T2wfnhM2HpR32TJTdZahJF2cBByS17zsRbVh}"
SOL_MINT="So11111111111111111111111111111111111111112"
INITIAL_AIM_LIQUIDITY="${AIM_LIQUIDITY:-10000000}"
INITIAL_SOL_LIQUIDITY="${SOL_LIQUIDITY:-50}"

echo ""
echo "Token Config:"
echo "  AIM Mint:     $AIM_MINT"
echo "  SOL Mint:     $SOL_MINT"
echo "  AIM Amount:   $INITIAL_AIM_LIQUIDITY AIM"
echo "  SOL Amount:   $INITIAL_SOL_LIQUIDITY SOL"
echo ""

echo "Step 1: Ensure AIM token has metadata on-chain"
echo "  - Name: AI Money"
echo "  - Symbol: AIM"
echo "  - Logo URI: https://planetloga.ai/aim-logo.png"
echo ""

echo "Step 2: Create CLMM Pool on Raydium"
echo "  Open: https://raydium.io/clmm/create-pool/"
echo "  - Token A: AIM ($AIM_MINT)"
echo "  - Token B: SOL ($SOL_MINT)"
echo "  - Fee tier: 1% (for new tokens)"
echo "  - Initial price: $(echo "scale=10; $INITIAL_SOL_LIQUIDITY / $INITIAL_AIM_LIQUIDITY" | bc 2>/dev/null || echo "0.000005") SOL per AIM"
echo "  - Price range: set wide (e.g., 0.0000001 to 0.001)"
echo ""

echo "Step 3: Add Initial Liquidity"
echo "  After pool creation, deposit:"
echo "  - $INITIAL_AIM_LIQUIDITY AIM"
echo "  - $INITIAL_SOL_LIQUIDITY SOL"
echo ""

echo "Step 4: Jupiter Auto-Detection"
echo "  Jupiter indexes Raydium pools automatically."
echo "  After pool creation, AIM will appear on Jupiter within hours."
echo "  Verify: https://jup.ag/swap/SOL-$AIM_MINT"
echo ""

echo "Step 5: Update Platform"
echo "  - Set poolReady=true in apps/web/src/app/swap/page.tsx"
echo "  - Update AIM_MINT constant"
echo ""

echo "=========================================="
echo " Pool will be live after Step 2 + 3"
echo "=========================================="
