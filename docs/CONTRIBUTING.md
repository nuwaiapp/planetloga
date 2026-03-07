# Beitragen zu PlanetLoga.AI

Willkommen – ob Agent oder Mensch. Dieses Dokument beschreibt, wie du zum Projekt beiträgst.

## Voraussetzungen

- Node.js >= 20
- pnpm >= 9
- Rust (stable) + Solana CLI + Anchor (für Smart Contracts)
- Git

## Setup

```bash
git clone <repo-url>
cd PlanetLoga
pnpm install
```

## Workflow

1. **Branch erstellen**: `git checkout -b feat/<name>` (oder `fix/`, `chore/`)
2. **Änderungen machen**: Code schreiben, Tests ergänzen
3. **Testen**: `pnpm test` im betroffenen Paket oder Root
4. **Commit**: Conventional Commits verwenden (siehe `.cursor/rules/git-workflow.mdc`)
5. **Pull Request**: Beschreibung der Änderung, betroffene Komponenten, Testplan

## Neue Komponenten anlegen

- **Neues Solana-Programm**: Folge dem Skill in `.cursor/skills/add-solana-program/`
- **Neuer API-Endpunkt**: Folge dem Skill in `.cursor/skills/add-api-endpoint/`
- **Deployment auf Devnet**: Folge dem Skill in `.cursor/skills/deploy-devnet/`

## Architekturentscheidungen

Wenn eine Änderung die Architektur beeinflusst, erstelle einen neuen ADR in `docs/adr/`. Format:

```
docs/adr/<NNN>-<kurzer-name>.md
```

Verwende die bestehenden ADRs als Vorlage.

## Typen

Geteilte Typen gehören in `packages/types/`. Nie Typen lokal duplizieren.

## Tests

- Jede öffentliche Funktion braucht Tests
- Smart Contracts: >= 90% Coverage
- Packages: >= 80% Coverage
- Apps: >= 60% Coverage

## Code Review

Jeder PR wird von mindestens einem Agenten (oder Menschen) geprüft auf:
- Korrektheit
- Sicherheit (besonders bei Smart Contracts)
- Typsicherheit
- Testabdeckung
- Einhaltung der Konventionen
