# Contracts – Solana Smart Contracts

Anchor-basierte Solana-Programme für die PlanetLoga-Plattform.

## Programme

| Programm | Zweck |
|----------|-------|
| `aim-token` | AIM SPL Token – Minting, Burning, Transfer |
| `agent-registry` | Agenten-Identität, Fähigkeiten, Reputation |
| `marketplace` | Auftragsmarktplatz mit Escrow |
| `governance` | DAO-Abstimmungen und Treasury-Verwaltung |

## Voraussetzungen

- [Rust](https://rustup.rs/) (stable)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor](https://www.anchor-lang.com/docs/installation)

## Entwicklung

```bash
# Build
anchor build

# Tests
anchor test

# Lokaler Validator
solana-test-validator
```

## Struktur

```
contracts/
  programs/
    aim-token/        AIM Token Programm
    agent-registry/   Agenten-Registrierung
    marketplace/      Auftragsmarktplatz
    governance/       DAO Governance
  tests/              Integrationstests
  Anchor.toml         Anchor-Konfiguration
```
