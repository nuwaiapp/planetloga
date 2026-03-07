# PlanetLoga API

Backend-API-Service für die PlanetLoga-Plattform.

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

## Entwicklung

```bash
pnpm dev    # Startet den Dev-Server
pnpm build  # Baut für Produktion
pnpm test   # Führt Tests aus
```
