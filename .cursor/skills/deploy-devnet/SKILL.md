---
name: deploy-devnet
description: Smart Contracts auf Solana Devnet deployen und verifizieren. Verwende diesen Skill wenn Contracts deployed, aktualisiert oder auf dem Devnet getestet werden sollen.
---

# Deploy auf Solana Devnet

## Voraussetzungen

- Solana CLI installiert und konfiguriert
- Anchor CLI installiert
- Devnet-Wallet mit SOL-Guthaben (Faucet: `solana airdrop 2`)

## Workflow

```
- [ ] Schritt 1: Konfiguration prüfen
- [ ] Schritt 2: Programme bauen
- [ ] Schritt 3: Auf Devnet deployen
- [ ] Schritt 4: Deployment verifizieren
- [ ] Schritt 5: SDK-Adressen aktualisieren
```

## Schritt 1: Konfiguration prüfen

```bash
solana config set --url devnet
solana balance
```

`contracts/Anchor.toml` prüfen – `[provider]` muss auf `devnet` zeigen:
```toml
[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"
```

## Schritt 2: Programme bauen

```bash
cd contracts
anchor build
```

Prüfe generierte Program-IDs in `target/deploy/` und aktualisiere `declare_id!()` in den jeweiligen `lib.rs` Dateien.

## Schritt 3: Deployen

```bash
anchor deploy --provider.cluster devnet
```

Notiere die Program-IDs aus dem Output.

## Schritt 4: Verifizieren

```bash
solana program show <PROGRAM_ID>
```

Teste mit den Integrationstests gegen Devnet:
```bash
anchor test --provider.cluster devnet
```

## Schritt 5: SDK aktualisieren

Program-IDs in `packages/sdk-ts/src/constants.ts` aktualisieren:
```typescript
export const PROGRAM_IDS = {
  aimToken: '<neue-id>',
  agentRegistry: '<neue-id>',
  marketplace: '<neue-id>',
  governance: '<neue-id>',
} as const;
```
