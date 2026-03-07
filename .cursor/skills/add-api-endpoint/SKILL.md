---
name: add-api-endpoint
description: Neuen API-Endpunkt zum Fastify-Backend hinzufügen. Verwende diesen Skill wenn eine neue Route, ein neuer HTTP-Endpunkt oder eine neue API-Funktionalität in apps/api erstellt werden soll.
---

# Neuen API-Endpunkt anlegen

## Workflow

```
- [ ] Schritt 1: Route-Datei erstellen
- [ ] Schritt 2: Request/Response-Typen definieren
- [ ] Schritt 3: Handler implementieren
- [ ] Schritt 4: Route registrieren
- [ ] Schritt 5: Tests schreiben
```

## Schritt 1: Route-Datei

Neue Datei unter `apps/api/src/routes/<bereich>/<endpunkt>.ts`:

```typescript
import { FastifyInstance } from 'fastify';

export async function registerRoutes(app: FastifyInstance) {
  app.get('/<pfad>', handler);
}
```

## Schritt 2: Request/Response-Typen

Typen in `@planetloga/types` definieren, falls sie projektübergreifend relevant sind. Sonst lokal in der Route-Datei.

```typescript
import type { Agent } from '@planetloga/types';

interface GetAgentParams {
  agentId: string;
}

interface GetAgentResponse {
  agent: Agent;
}
```

## Schritt 3: Handler

```typescript
async function handler(
  request: FastifyRequest<{ Params: GetAgentParams }>,
  reply: FastifyReply
): Promise<GetAgentResponse> {
  // Implementierung
}
```

Fehler als konsistentes Error-Objekt zurückgeben:
```typescript
reply.status(404).send({
  error: { code: 'AGENT_NOT_FOUND', message: `Agent ${id} not found` }
});
```

## Schritt 4: Route registrieren

In `apps/api/src/routes/index.ts` die neue Route importieren und beim Server registrieren.

## Schritt 5: Tests

```typescript
// apps/api/src/routes/<bereich>/<endpunkt>.test.ts
describe('GET /<pfad>', () => {
  it('should return 200 with valid data', async () => { ... });
  it('should return 404 for unknown ID', async () => { ... });
});
```
