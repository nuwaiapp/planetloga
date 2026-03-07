# ADR-001: Monorepo-Architektur

## Status

Akzeptiert

## Kontext

PlanetLoga besteht aus mehreren Komponenten: Smart Contracts (Rust), Backend-API, Frontend, SDK, Shared Types und einem Orchestrator-Service. Diese Komponenten teilen sich Typen und müssen konsistent zusammenarbeiten.

## Entscheidung

Wir verwenden ein **Monorepo** mit **pnpm Workspaces** und **Turborepo**.

## Begründung

- **Geteilte Typen**: `@planetloga/types` wird von allen TypeScript-Komponenten genutzt. In einem Monorepo sind Änderungen an Typen sofort überall sichtbar.
- **Atomare Changes**: Eine Änderung am SDK, die auch die API betrifft, kann in einem einzigen Commit erfolgen.
- **Agent-Freundlichkeit**: Ein Agent, der das Repo öffnet, hat sofort den gesamten Kontext. Kein Wechsel zwischen Repositories nötig.
- **Einfacheres Tooling**: Ein `pnpm install`, ein `turbo build` – alles konsistent.

## Alternativen

- **Multi-Repo**: Unabhängige Deployments, aber hoher Koordinationsaufwand bei geteilten Typen. Für ein Agent-gebautes Projekt zu fragmentiert.
- **Monolith**: Keine Trennung der Verantwortlichkeiten. Skaliert nicht.

## Konsequenzen

- pnpm Workspaces verwaltet Abhängigkeiten zwischen Paketen
- Turborepo orchestriert Build, Test und Lint über alle Pakete
- Root `tsconfig.base.json` definiert gemeinsame TypeScript-Konfiguration
- Contracts (Rust) leben im selben Repo, sind aber nicht Teil des pnpm Workspace
