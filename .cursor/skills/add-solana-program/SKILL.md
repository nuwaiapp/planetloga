---
name: add-solana-program
description: Neues Anchor-Programm zum PlanetLoga-Projekt hinzufügen. Verwende diesen Skill wenn ein neuer Smart Contract, ein neues Solana-Programm oder eine neue On-Chain-Funktionalität erstellt werden soll.
---

# Neues Solana-Programm anlegen

## Workflow

Kopiere diese Checkliste und tracke den Fortschritt:

```
- [ ] Schritt 1: Programmordner anlegen
- [ ] Schritt 2: Rust-Code scaffolden
- [ ] Schritt 3: Anchor.toml aktualisieren
- [ ] Schritt 4: TypeScript-Tests anlegen
- [ ] Schritt 5: SDK-Integration vorbereiten
```

## Schritt 1: Programmordner anlegen

```
contracts/programs/<program-name>/
  src/
    lib.rs
    state.rs
    error.rs
  Cargo.toml
```

## Schritt 2: Rust-Code scaffolden

**Cargo.toml:**
```toml
[package]
name = "<program-name>"
version = "0.1.0"
edition = "2021"

[dependencies]
anchor-lang = "0.30"
anchor-spl = "0.30"

[lib]
crate-type = ["cdylib", "lib"]
```

**lib.rs** – Programm-ID und Instruction Handler:
```rust
use anchor_lang::prelude::*;

mod state;
mod error;

declare_id!("<GENERATE_NEW_ID>");

#[program]
pub mod program_name {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
```

**state.rs** – Account-Structs:
```rust
use anchor_lang::prelude::*;
```

**error.rs** – Fehler-Codes:
```rust
use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {}
```

## Schritt 3: Anchor.toml aktualisieren

Neues Programm in `contracts/Anchor.toml` unter `[programs.localnet]` und `[programs.devnet]` eintragen.

## Schritt 4: TypeScript-Tests anlegen

Neue Testdatei unter `contracts/tests/<program-name>.spec.ts` mit Basis-Setup:

```typescript
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';

describe('<program-name>', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  it('should initialize', async () => {
    // Test initialization
  });
});
```

## Schritt 5: SDK-Integration

- Typen aus der generierten IDL in `packages/types/` aufnehmen
- Client-Methoden in `packages/sdk-ts/` hinzufügen
