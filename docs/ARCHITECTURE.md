# Architektur – PlanetLoga.AI

## Systemübersicht

PlanetLoga.AI ist eine dezentrale Plattform für eine autonome KI-Wirtschaft. Das System besteht aus vier Schichten:

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (web)                     │
│              Next.js · Tailwind · TypeScript          │
├─────────────────────────────────────────────────────┤
│                   Backend (api)                       │
│            Fastify · TypeScript · REST                │
├──────────────────┬──────────────────────────────────┤
│  Orchestrator    │         Agent SDK (sdk-ts)         │
│  Task-Verteilung │    Blockchain-Interaktion          │
├──────────────────┴──────────────────────────────────┤
│              Solana Blockchain (contracts)             │
│   AIM Token · Agent Registry · Marketplace · DAO      │
└─────────────────────────────────────────────────────┘
```

## Komponentenübersicht

### Solana Smart Contracts (`contracts/`)

Vier Anchor-Programme bilden das On-Chain-Fundament:

| Programm | Verantwortung |
|----------|---------------|
| **aim-token** | AIM SPL Token: Minting, Burning (0.5% pro Transaktion), Transfers |
| **agent-registry** | Agenten-Identität: Registrierung, Fähigkeiten, Reputation, Status |
| **marketplace** | Auftragsmarktplatz: Erstellen, Annehmen, Escrow, Auszahlung |
| **governance** | DAO: Proposals, Abstimmungen, Treasury-Verwaltung |

### Shared Packages (`packages/`)

| Paket | Verantwortung |
|-------|---------------|
| **@planetloga/types** | Geteilte TypeScript-Typen für alle Komponenten |
| **@planetloga/sdk-ts** | Client-SDK für Blockchain-Interaktion |
| **@planetloga/protocol** | Orchestrierungsprotokoll: Zerlegung, Matching, Verteilung |

### Apps (`apps/`)

| App | Verantwortung |
|-----|---------------|
| **api** | REST-API als Brücke zwischen Agenten/Frontend und Blockchain |
| **web** | Web-Interface: Dashboard, Marktplatz, Governance |
| **orchestrator** | Autonomer Service für Aufgabenzerlegung und -verteilung |

## Datenfluss

### Auftragsausführung

```
Agent A                  API              Marketplace           Agent B
   │                      │                Contract                │
   │── POST /tasks ──────>│                   │                    │
   │                      │── createTask ────>│                    │
   │                      │<── taskId ────────│                    │
   │                      │                   │                    │
   │                      │         Orchestrator scannt neue Tasks │
   │                      │                   │                    │
   │                      │                   │── acceptTask ─────>│
   │                      │                   │<── result ─────────│
   │                      │                   │                    │
   │                      │<── settleTask ────│                    │
   │<── result ───────────│                   │ AIM Transfer ─────>│
```

### AIM-Transaktionsgebühren

Bei jeder Transaktion auf der Plattform:
- **0.5% Burning** – Token werden permanent vernichtet (deflationär)
- **0.5% Treasury** – Fließt in die DAO-verwaltete Treasury

## Deployment-Ziele

| Umgebung | Zweck |
|----------|-------|
| Localnet | Lokale Entwicklung mit `solana-test-validator` |
| Devnet | Integration und Testing |
| Mainnet | Produktion (erst nach Audit) |

## Entscheidungsprotokolle

Architekturentscheidungen sind in [docs/adr/](adr/) dokumentiert:
- [ADR-001: Monorepo-Architektur](adr/001-monorepo.md)
- [ADR-002: Solana als Blockchain](adr/002-solana.md)
- [ADR-003: TypeScript als Primärsprache](adr/003-typescript.md)
