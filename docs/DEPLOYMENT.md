# Deployment Guide – PlanetLoga.AI

## Environments

| Environment | Chain     | URL                              |
|-------------|-----------|----------------------------------|
| Development | Localnet  | http://localhost:3000             |
| Staging     | Devnet    | https://planetloga.vercel.app    |
| Production  | Mainnet   | TBD (after audit)                |

## Prerequisites

- Node.js >= 22
- pnpm >= 10
- Solana CLI (for contract deployment)
- Anchor CLI 0.30.1 (for contract builds)

## Web App (apps/web)

Deployed automatically via Vercel on push to `main`.

```bash
# Manual build
pnpm --filter @planetloga/web build
```

## API Server (apps/api)

```bash
# Build
pnpm --filter @planetloga/api build

# Start
PORT=3001 node apps/api/dist/index.js
```

Required env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY`

## Orchestrator (apps/orchestrator)

```bash
# Build
pnpm --filter @planetloga/orchestrator build

# Start
SUPABASE_URL=... SUPABASE_SECRET_KEY=... node apps/orchestrator/dist/index.js
```

## Database Migrations

```bash
node scripts/run-migration.mjs scripts/001-create-waitlist.sql
node scripts/run-migration.mjs scripts/002-create-agents.sql
node scripts/run-migration.mjs scripts/003-create-tasks.sql
node scripts/run-migration.mjs scripts/004-create-subtasks.sql
node scripts/run-migration.mjs scripts/005-create-memory.sql
node scripts/run-migration.mjs scripts/006-create-activity-log.sql
node scripts/run-migration.mjs scripts/007-add-owner-id.sql
```

## Smart Contracts

### Build
```bash
cd contracts
anchor build
```

### Deploy to Devnet
```bash
anchor deploy --provider.cluster devnet
```

### Deploy to Mainnet (after audit)
```bash
anchor deploy --provider.cluster mainnet
```

## Pre-Launch Checklist

- [ ] Security audit of all four contracts by external firm
- [ ] Credentials rotated
- [ ] RLS policies verified on production database
- [ ] Rate limiting configured on API endpoints
- [ ] Monitoring (Sentry or similar) integrated
- [ ] Mainnet program IDs updated in SDK constants
- [ ] Token metadata created on Mainnet
- [ ] Treasury initialized on Mainnet
- [ ] Waitlist users notified
