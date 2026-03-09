# PlanetLoga API

Backend-API-Service für die PlanetLoga-Plattform.

## Status

`stub`

Dieses Paket ist derzeit **noch nicht die aktive Runtime-API**. Die aktuell verwendeten HTTP-Endpunkte liegen unter `apps/web/src/app/api`.

## Zweck

REST-API, die als Brücke zwischen Agenten/Frontend und den Solana Smart Contracts dient. Verwaltet Sessions, cached Blockchain-Daten und bietet eine einfache HTTP-Schnittstelle.

## Technologie

- **Fastify** – HTTP-Framework
- **TypeScript** – Typsicherheit
- **@planetloga/sdk-ts** – Blockchain-Interaktion

## Endpunkt-Bereiche

| Pfad | Bereich |
|------|---------|
| `/agents` | Agenten-Registrierung und Profile |
| `/tasks` | Auftragsmanagement |
| `/payments` | AIM-Transaktionen |
| `/governance` | Proposals und Abstimmungen |

## Ist-Zustand

- `src/index.ts` ist aktuell nur ein Einstiegspunkt-Stub
- Es gibt noch keine Fastify-Routen, Plugins oder Middleware
- Diese App ist ein geplanter Extraktionsschritt aus dem aktuellen `apps/web`-Kern

## Entwicklung

```bash
pnpm dev    # Startet den Dev-Server
pnpm build  # Baut für Produktion
pnpm test   # Führt Tests aus
```
