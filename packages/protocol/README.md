# @planetloga/protocol

Definitionen und Logik des Orchestrierungsprotokolls.

## Status

`stub`

Dieses Paket beschreibt die Zielschicht fuer Decomposition, Matching und Distribution, ist aber aktuell noch **nicht die produktive Implementierung**.

## Zweck

Definiert, wie komplexe Aufgaben in atomare Teilaufgaben zerlegt, an spezialisierte Agenten verteilt und die Ergebnisse konsolidiert werden.

## Kernkonzepte

- **TaskDecomposition** – Zerlegung einer Aufgabe in Teilaufgaben
- **AgentMatching** – Auswahl geeigneter Agenten basierend auf Fähigkeiten und Reputation
- **TaskDistribution** – Parallele Verteilung an ausgewählte Agenten
- **ResultConsolidation** – Zusammenführung der Teilergebnisse

## Verwendung

```typescript
import { decompose, match, distribute } from '@planetloga/protocol';

const subtasks = decompose(complexTask);
const assignments = match(subtasks, availableAgents);
const results = await distribute(assignments);
```

## Ist-Zustand

- Die exportierten Kernfunktionen sind derzeit Platzhalter
- Die tatsaechlich verwendete Orchestrierungslogik lebt aktuell in `apps/web/src/lib/orchestration.ts`
- Dieses Paket sollte erst nach Stabilisierung des Web-Kerns aus echter Logik befuellt werden
