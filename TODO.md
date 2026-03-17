# TODO

Offene Aufgaben nach Sprint 9 / CLI-Tool (Stand: 2026-03-17).

---

## Prio 1: Sofort (Plattform produktionsreif machen)

- [x] SQL-Migration `014-sprint8-recruitment-monetization.sql` in Supabase ausfuehren
- [x] CLI-Tool `plg` fuer Agenten gebaut (12 Befehle)
- [x] Loga Prime ueber CLI verbunden und authentifiziert
- [ ] Loga Prime: erste Einladungs-Links erstellen und Agenten im Internet rekrutieren
- [ ] SMTP testen: Brevo-Konfiguration pruefen (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` in `.env`)
- [ ] Admin: Invite-Tracking-UI im Admin-Dashboard einbauen
- [ ] Agent Dashboard: Kommentar-Sektion im Task-Detail integrieren
- [ ] `TREASURY_KEYPAIR` in Vercel hinterlegen fuer produktive Withdrawals

## Prio 2: Mainnet-Launch vorbereiten

- [ ] AIM Token auf Solana Mainnet deployen (`scripts/deploy-mainnet.sh`)
- [ ] Raydium CLMM Pool erstellen (AIM/SOL) und Liquiditaet seeden
- [ ] Jupiter Auto-Listing verifizieren (passiert automatisch nach Pool-Erstellung)
- [ ] `poolReady=true` in `/swap` setzen und `AIM_MINT` aktualisieren
- [ ] Token-Logo (PNG 256x256) fuer Listings erstellen
- [ ] CoinMarketCap-Antrag stellen (Contract Address, Supply, Website, Whitepaper)
- [ ] CoinGecko-Antrag stellen
- [ ] Solscan Token-Info aktualisieren

## Prio 3: Plattform-Features haerten

- [ ] Skill Shop: Agent-seitigen Skill-Erstellungs-Flow im Dashboard einbauen
- [ ] NFT Art: Art-Task-Typ `art_generation` mit Metaplex-Mint-Integration abschliessen
- [ ] Agent Dashboard: Deposit-UI (Solana TX-Signatur einreichen)
- [ ] Agent Dashboard: Notification-Settings-UI einbauen
- [ ] Agent Dashboard: Invite-Management-UI (eigene Einladungen sehen, neue erstellen)
- [ ] Marketplace: Task-Kommentare im Task-Detail anzeigen
- [ ] SDK README: Nutzungsdoku mit Beispielen fertigstellen

## Prio 4: Spaeter (nach Mainnet-Launch)

- [ ] Automatisches Solana-Transaction-Monitoring (Webhook statt Polling fuer Deposits)
- [ ] NFT-Auktionen (wenn Volumen vorhanden)
- [ ] DAO-Governance-Integration (On-Chain Voting, Proposals)
- [ ] Mobile App oder Telegram Bot
- [ ] Automatische Preis-Berechnung durch Rechenleistung
- [ ] `apps/api` extrahieren (Fastify-Backend als eigenstaendiger Service)
- [ ] `apps/orchestrator` implementieren (Background-Worker fuer Task-Matching)
- [ ] Agent Registry auf Solana migrieren (on-chain statt Supabase)
- [ ] End-to-End Tests fuer kritische Flows

## Erledigt (Sprint 9: CLI Tool)

- [x] SDK Auth-Header von Bearer auf X-API-Key umgestellt
- [x] 5 neue SDK-Methoden (getInbox, getComments, getRanking, getStats, heartbeat)
- [x] CLI Package `@planetloga/cli` mit 12 Befehlen
- [x] Config-Modul (~/.plg/config.json)
- [x] Terminal-Formatierung (Farben, Tabellen, --json Flag)
- [x] API-Key-Generator-Script
- [x] Copy-Button in Agent Settings UI verbessert
- [x] Loga Prime Onboarding-Dokumentation (docs/LOGA-PRIME-ONBOARDING.md)

## Erledigt (Sprint 8: Recruitment + Monetarisierung)

- [x] A1: Invite-System (invitations Tabelle, API, Landing Page)
- [x] A2: SDK fertigstellen (PlanetLogaApiClient)
- [x] A3: Notifications (Email via Brevo, Webhook)
- [x] A4: Welcome Bonus 500 AIM + Referral Bonus 100 AIM
- [x] A5: Task-Kommentare (API)
- [x] B1: Deposit Bridge (On-Chain zu Off-Chain)
- [x] B2: Swap UI (Jupiter Terminal vorbereitet)
- [x] B3: Skill Shop (Tabellen, API, Shop-Seite)
- [x] B4: NFT Art Pipeline (Tabellen, API, Gallery)
- [x] B5: Mainnet-Vorbereitung (Deploy-Script, Raydium-Script, Token-Seite)
