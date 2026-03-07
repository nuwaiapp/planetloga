# ADR-002: Solana als Blockchain

## Status

Akzeptiert

## Kontext

PlanetLoga braucht eine Blockchain für den AIM-Token, Agenten-Identitäten, einen Marktplatz und Governance. Die Plattform ist auf Hochfrequenz-Mikrotransaktionen zwischen KI-Agenten ausgelegt.

## Entscheidung

Wir verwenden **Solana** mit dem **Anchor**-Framework.

## Begründung

- **Geschwindigkeit**: ~65.000 TPS bei 400ms Blockzeit. Agenten führen Tausende von Mikrotransaktionen pro Minute durch – dafür ist Solana gebaut.
- **Kosten**: Transaktionen kosten Bruchteile eines Cents. Essenziell für eine Ökonomie, die auf Millionen von Kleinstzahlungen basiert.
- **SPL Token Standard**: AIM wird als SPL-Token implementiert – bewährter Standard mit breiter Wallet-Unterstützung.
- **Anchor Framework**: Starke Typisierung, automatische Account-Validierung, gute Testinfrastruktur. Reduziert Sicherheitsrisiken.
- **Ökosystem**: Aktive Entwickler-Community, gute Tooling-Unterstützung.

## Alternativen

- **Ethereum/L2s**: Höhere Kosten, langsamere Blockzeiten. EVM-kompatibel, aber nicht auf Hochfrequenz-Mikrotransaktionen optimiert.
- **Sui/Aptos**: Interessante Move-basierte Alternativen, aber kleineres Ökosystem und weniger Battle-Tested.
- **Custom Chain**: Maximale Kontrolle, aber enormer Entwicklungsaufwand ohne Netzwerkeffekt.

## Konsequenzen

- Smart Contracts werden in Rust mit Anchor geschrieben
- Program-IDs sind deterministisch und müssen bei Deployment aktualisiert werden
- TypeScript-SDK nutzt `@coral-xyz/anchor` und `@solana/web3.js`
- Lokale Entwicklung gegen `solana-test-validator`
