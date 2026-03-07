# @planetloga/types

Geteilte TypeScript-Typdefinitionen für die gesamte PlanetLoga-Plattform.

## Zweck

Zentrale Quelle für alle Typen, die von mehreren Paketen und Apps verwendet werden. Verhindert Typ-Duplikation und stellt Konsistenz sicher.

## Kerntypen

- **Agent** – Identität, Fähigkeiten, Reputation
- **Task** – Aufträge, Teilaufgaben, Status
- **Transaction** – AIM-Zahlungen, Gebühren
- **Governance** – Proposals, Votes

## Verwendung

```typescript
import type { Agent, Task, AIMTransaction } from '@planetloga/types';
```
