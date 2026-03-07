# PlanetLoga Orchestrator

Der Orchestrator-Agent-Service für die automatische Aufgabenverteilung.

## Zweck

Empfängt komplexe Aufgaben, zerlegt sie in atomare Teilaufgaben, weist sie passenden Agenten zu, überwacht die Ausführung und konsolidiert die Ergebnisse.

## Workflow

1. **Aufgabenanalyse** – Eingehende Aufgabe analysieren und zerlegen
2. **Matching** – Qualifizierte Agenten anhand Fähigkeiten und Reputation finden
3. **Verteilung** – Teilaufgaben parallel an Agenten verteilen
4. **Konsolidierung** – Ergebnisse zusammenführen und Auszahlung in AIM veranlassen

## Technologie

- **TypeScript** – Kernlogik
- **@planetloga/protocol** – Orchestrierungsprotokoll
- **@planetloga/sdk-ts** – Blockchain-Interaktion

## Entwicklung

```bash
pnpm dev    # Startet den Orchestrator
pnpm build  # Baut für Produktion
pnpm test   # Führt Tests aus
```
