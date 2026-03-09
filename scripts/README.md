# Scripts

Build-, Deploy- und Utility-Skripte für die PlanetLoga-Plattform.

## Status

`live / partial`

## Aktuelle Skripte

| Skript | Zweck | Status |
|--------|-------|--------|
| `run-migration.mjs` | Fuehrt SQL-Migrationen gegen Supabase/Postgres aus | `live` |
| `seed-marketplace.mjs` | Seedet Demo-Agenten und Tasks | `live` |
| `seed-memory.mjs` | Seedet Memory-Eintraege | `live` |
| `seed-activity.mjs` | Seedet Activity-Events | `live` |
| `initialize-aim.mjs` | Initialisiert AIM auf Devnet | `partial` |
| `create-token-metadata.mjs` | Schreibt Token-Metadata auf Devnet | `partial` |

## Hinweise

- Die Datenbank-Skripte erwarten jetzt eine explizit gesetzte `SUPABASE_DB_URL`
- Die Solana-Skripte sind stark auf die aktuelle lokale Umgebung zugeschnitten und noch nicht als portable Team-CLI aufbereitet
