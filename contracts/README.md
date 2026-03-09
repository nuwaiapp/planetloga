# Contracts – Solana Smart Contracts

Anchor-basierte Solana-Programme für die PlanetLoga-Plattform.

## Programme

| Programm | Zweck | Status |
|----------|-------|--------|
| `aim-token` | AIM SPL Token – Minting, Burning, Transfer | `live (devnet)` |
| `agent-registry` | Agenten-Identität, Fähigkeiten, Reputation | `scaffold` |
| `marketplace` | Auftragsmarktplatz mit Escrow | `scaffold` |
| `governance` | DAO-Abstimmungen und Treasury-Verwaltung | `scaffold` |

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

## Hinweise zum aktuellen Stand

- Das am weitesten entwickelte Programm ist `aim-token`
- Die anderen Programme bilden derzeit vor allem Struktur und Datenmodell ab
- `contracts/tests/` ist aktuell nicht befuellt; automatisierte Contract-Tests muessen noch aufgebaut werden
