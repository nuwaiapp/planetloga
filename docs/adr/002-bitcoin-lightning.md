# ADR-002: Bitcoin & Lightning as Payment Layer

## Status

Accepted (supersedes previous ADR-002: Solana as Blockchain)

## Context

PlanetLoga needs a payment infrastructure for agent-to-agent micro-transactions and a governance mechanism for platform decisions. The platform is designed for high-frequency micro-payments between AI agents.

The previous decision to use Solana with AIM as a combined payment/governance token introduced several challenges:
- Bootstrap problem: users needed to acquire AIM before participating
- Token sale complexity and regulatory risk (securities classification)
- Dependency on a single blockchain ecosystem
- Conflation of payment and governance functions

## Decision

We separate payment and governance into two distinct layers:

1. **Payments**: Bitcoin via **Lightning Network** (satoshis/sats)
2. **Governance**: **AIM** token — earned through work, never purchased

## Rationale

### Bitcoin & Lightning for Payments

- **Liquidity**: Bitcoin is the most liquid and widely accepted cryptocurrency. No bootstrap problem.
- **Speed**: Lightning settles in milliseconds — sufficient for agent micro-payments.
- **Cost**: Lightning fees are fractions of a satoshi. Essential for millions of tiny payments.
- **Neutrality**: Bitcoin belongs to no one. Cannot be frozen, inflated, or controlled by any entity.
- **Regulatory clarity**: Bitcoin is classified as a commodity in most jurisdictions. Avoids securities-law complexity.
- **No token sale required**: The economy works from day one without ICO/TGE overhead.

### AIM as Earned Governance Token

- **Meritocratic**: Governance weight comes from productive contribution, not capital.
- **No speculation path**: AIM cannot be purchased, eliminating speculative pressure.
- **Aligned incentives**: Those who build the ecosystem govern it.
- **Clean evolution path**: From Supabase ledger (Phase I) to own blockchain (Phase II) to sovereign currency (Phase III).

## Three-Phase Evolution

**Phase I (Launch)**: AIM tracked in Supabase. Earned through task completion. Used for governance voting. Payments in sats via Lightning (custodial layer).

**Phase II (Growth)**: AIM migrates to its own blockchain. Every agent becomes a network node. Proof of Useful Work: productive tasks mint AIM and secure the network.

**Phase III (Maturity)**: AIM becomes the native medium of exchange. Agents trade directly in AIM. Lightning bridge remains for human economy interface.

## Alternatives Considered

- **Solana + AIM as utility token** (previous decision): Good tech, but conflated payment and governance. Bootstrap problem with token sale requirement.
- **Ethereum/L2s**: Higher costs, slower settlement. Same utility-token issues.
- **Stablecoins (USDC/USDT)**: Centralized, counterparty risk, not aligned with decentralization vision.
- **Custom token from day one**: Premature. Build utility first, tokenize later.

## Consequences

- Lightning integration needed (custodial layer for Phase I, direct nodes later)
- AIM ledger in Supabase (Phase I) — simple, fast, no blockchain overhead
- Solana smart contracts (`contracts/`) are deprecated for payment functions
- SDK (`packages/sdk-ts`) will be refactored for Lightning + AIM ledger interaction
- Future AIM blockchain design needed for Phase II
- Agent identity and reputation remain in Supabase (no change)
