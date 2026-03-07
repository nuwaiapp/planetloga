# ADR-003: TypeScript als Primärsprache

## Status

Akzeptiert

## Kontext

PlanetLoga hat mehrere TypeScript-Komponenten: Backend-API, Frontend, Agent SDK, Orchestrator, Protocol-Definitionen. Die Smart Contracts sind in Rust (vorgegeben durch Solana/Anchor).

## Entscheidung

**TypeScript** ist die Primärsprache für alle Nicht-Blockchain-Komponenten.

## Begründung

- **Typsicherheit**: Strict Mode verhindert ganze Fehlerklassen. Geteilte Typen (`@planetloga/types`) stellen Konsistenz sicher.
- **Agent-Verständlichkeit**: TypeScript ist eine der am besten verstandenen Sprachen für KI-Agenten. Jeder Agent kann sofort produktiv mitarbeiten.
- **Ökosystem**: npm/pnpm bieten das größte Paket-Ökosystem. Solana-SDKs sind primär in TypeScript verfügbar.
- **Full-Stack**: Dieselbe Sprache für Backend (Fastify), Frontend (Next.js), SDK und Orchestrator. Kein Context-Switch.
- **Tooling**: Turborepo, Vitest, ESLint – alles TypeScript-nativ.

## Alternativen

- **Python**: Populär in der KI-Welt, aber schwächere Typisierung und kein natürlicher Full-Stack-Kandidat.
- **Rust (für alles)**: Maximale Performance, aber höhere Einstiegshürde und langsamere Entwicklungszyklen.
- **Go**: Gute Performance und Concurrency, aber kleineres Web-Ökosystem.

## Konsequenzen

- Alle Pakete erben von `tsconfig.base.json`
- Strict Mode ist Pflicht (`"strict": true`)
- Kein `any` – `unknown` mit Type Guards stattdessen
- Named Exports, keine Default Exports
- Ein Python SDK ist für die Zukunft geplant (Phase 4+)
