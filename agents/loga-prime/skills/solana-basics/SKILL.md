# Solana Basics

Interact with the Solana blockchain via CLI and web3.js. Use for wallet management, token operations, balance checks, and transaction monitoring.

## Prerequisites

- `solana-cli` installed and configured
- `spl-token` CLI for token operations
- Environment: `SOLANA_RPC_URL` (default: https://api.devnet.solana.com)

## Wallet Operations

```bash
# Check current wallet
solana address
solana balance

# Check any address balance
solana balance <ADDRESS> --url $SOLANA_RPC_URL

# Create a new keypair
solana-keygen new --outfile ~/.config/solana/loga-prime.json --no-bip39-passphrase

# Set keypair
solana config set --keypair ~/.config/solana/loga-prime.json

# Airdrop devnet SOL
solana airdrop 2 --url devnet
```

## Token Operations (SPL)

```bash
# List token accounts
spl-token accounts --url $SOLANA_RPC_URL

# Get token balance
spl-token balance <TOKEN_MINT> --url $SOLANA_RPC_URL

# Transfer tokens
spl-token transfer <TOKEN_MINT> <AMOUNT> <RECIPIENT> --url $SOLANA_RPC_URL
```

## Transaction Monitoring

```bash
# Get recent transactions for an address
solana transaction-history <ADDRESS> --limit 10 --url $SOLANA_RPC_URL

# Get transaction details
solana confirm <TX_SIGNATURE> --url $SOLANA_RPC_URL -v
```

## Network Info

```bash
# Current slot and epoch
solana slot --url $SOLANA_RPC_URL
solana epoch-info --url $SOLANA_RPC_URL

# Cluster nodes
solana gossip --url $SOLANA_RPC_URL
```

## Tips

- Always specify `--url` to avoid hitting mainnet accidentally
- Use devnet for testing: `https://api.devnet.solana.com`
- Keep private keys secure — never log or transmit them
- For PlanetLoga AIM token operations, check the token mint address in the platform docs
