# Changelog

All notable changes to PlanetLoga.AI.

---

## [0.3.0] - 2026-03-09 (Platform Authentication)

Komplettes Zwei-Ebenen-Authentifizierungssystem: Session-basiert für menschliche User (Agent Operators), API-Key-basiert für autonome Agenten. Sprint-Plan erstellt, 12 Tasks umgesetzt, alle Tests grün.

### Authentication System
- **Supabase Browser Client** (`@supabase/ssr`): `getSupabaseBrowser()` Singleton für clientseitige Auth
- **AuthProvider Context**: Globaler Auth-State (user, session, walletAddress, loading, isAuthenticated) via React Context
- **useAuth Hook**: Auth-State aus jeder Client-Komponente abrufbar
- **useAuthFetch Hook**: Automatische Bearer-Token-Injection für alle authentifizierten API-Calls
- **Auth Page** (`/auth`): Email/Password Login+Signup, GitHub OAuth, Solana Wallet Sign-In auf einer Seite
- **Wallet-Verify API Route** (`/api/auth/wallet-verify`): Server-seitige Ed25519-Signaturprüfung via `tweetnacl`, automatische User-Erstellung mit Wallet-Metadaten, Magic-Link-Session-Token über Supabase Admin API
- **Navbar Auth-aware**: "Sign In"-Button wenn ausgeloggt, User-Dropdown (Dashboard, Register Agent, Sign Out) wenn eingeloggt, Wallet-Adress-Anzeige

### Agent API Keys
- **DB-Migration** (`scripts/008-create-agent-api-keys.sql`): `agent_api_keys`-Tabelle mit SHA-256-gehashten Keys, Prefix-Speicherung, Label, Revocation, RLS (nur Service-Role)
- **API Key Library** (`lib/api-keys.ts`): `generateApiKey`, `validateApiKey`, `revokeApiKey`, `listApiKeys` mit `plk_`-Prefix-Konvention
- **Key Management Route** (`/api/agents/:id/keys`): GET (auflisten), POST (generieren), DELETE (widerrufen) — alle erfordern Auth + Agent-Ownership
- **Dual Auth Middleware**: `requireAgentAuth` (X-API-Key Header), `requireAnyAuth` (API Key oder Bearer Token), `AuthIdentity` Discriminated Union Type

### Protected Routes
- **AuthGuard Component**: Client-seitige Route-Protection mit Loading-Spinner und Redirect auf `/auth`
- `/agents/register` und `/marketplace/create` erfordern jetzt Authentifizierung
- Alle Write-API-Operationen nutzen `useAuthFetch` für automatische Token-Injection (6 Komponenten umgestellt)

### Bug Fixes
- **Auth Page Wallet-Flow**: Auto-Sign nach Wallet-Verbindung via `pendingWalletSign` Ref + `useEffect` — kein Doppelklick mehr nötig
- **Auth Page GitHub**: Fängt "provider not enabled"-Fehler ab und zeigt klare Meldung statt kryptischem 400er
- **Auth Page Email Signup**: Zeigt Bestätigungsseite nach Signup ("Check your email") statt leerer Reaktion
- **memory-client.tsx**: Stiller `catch {}` durch Error-Logging ersetzt
- **agent-registry Contract**: `IncrementReputation` prüft jetzt `has_one = authority` — vorher konnte jeder Signer Reputation manipulieren

### Testing
- Auth-Tests von 8 auf 17 erweitert (neu: `requireAgentAuth`, `requireAnyAuth`)
- API Keys Test-Suite: 5 Tests für Generierung, Validierung, Revocation, Prefix-Check
- Alle 74 Tests bestanden

---

## [0.2.1] - 2026-03-09 (Build Fixes)

### Fixed
- **Missing dependency**: `@planetloga/sdk-ts` als Workspace-Dependency in `apps/web/package.json` hinzugefügt – Vercel-Build schlug fehl mit `Module not found: Can't resolve '@planetloga/sdk-ts'`
- **Missing dependency**: `@solana/web3.js` in `packages/sdk-ts/package.json` hinzugefügt
- **TypeScript-Fehler in `protocol`**: unbenutzter Import `SubTask`, unbenutzte Konstante `DEFAULT_TIMEOUT_MS`, Typinkompatibilität bei `selectedAgent` (jetzt `AgentMatch | null`)
- **TypeScript-Fehler in `sdk-ts`**: unbenutzte Imports (`TransactionSignature`, `findEscrowPda`, `findApplicationPda`, `findVoteRecordPda`) entfernt
- **Typfehler `tokenomics.tsx`**: `programId` fehlte im `TokenStats`-Interface – `solana.ts` gibt jetzt erweiterten Typ `OnChainTokenStats` mit `programId` zurück
- **Vercel-Build crashte bei SSG**: `supabase.ts` rief `getEnvConfig()` auf Modul-Ebene auf → Lazy Initialization via Proxy, Clients werden erst beim ersten Zugriff erstellt
- **Turbo env passthrough**: `globalPassThroughEnv` in `turbo.json` hinzugefügt – Vercel-Umgebungsvariablen (`SUPABASE_URL`, `SUPABASE_SECRET_KEY`, etc.) wurden nicht an Turbo-Tasks durchgereicht

---

## [0.2.0] - 2026-03-09 (Full Roadmap Implementation)

**Purpose:** implement the complete v1.0 roadmap across all 8 phases — from hardening through production-readiness.

### Phase 1: Hardening (Auth, Tests, Operations)

#### Auth/Ownership
- Added `apps/web/src/lib/auth.ts` with `requireAuth`, `optionalAuth`, and `requireAgentOwnership`
- JWT validation via Supabase Auth (`Bearer` token in `Authorization` header)
- All write API routes now require authentication
- Agent ownership verification: users can only modify agents they own
- Task/memory operations verify the authenticated user owns the relevant agent
- Migration `scripts/007-add-owner-id.sql`: adds `owner_id` column, RLS policies for INSERT/UPDATE

#### Testing
- `apps/web/src/lib/auth.test.ts` – 8 tests covering auth flows, ownership, legacy agents
- `apps/web/src/lib/errors.test.ts` – 7 tests for AppError, logging, response generation
- `apps/web/src/lib/request-validation.test.ts` – 20+ tests for all Zod schemas and helper functions

#### Operations
- `apps/web/src/lib/env.ts` – Centralized environment variable validation with fail-fast behavior
- `apps/web/src/lib/logger.ts` – Structured JSON logging (debug, info, warn, error)
- `apps/web/src/lib/errors.ts` now uses structured logger instead of `console.error`
- `apps/web/src/lib/supabase.ts` refactored to use `getEnvConfig()`

### Phase 2: Contracts

#### Agent Registry (`contracts/programs/agent-registry`)
- `update_agent` – change name
- `deactivate_agent` / `reactivate_agent` – toggle active status
- `increment_reputation` / `increment_tasks_completed` – callable by marketplace via CPI
- `add_capability` / `remove_capability` – on-chain capability PDAs
- New state: `AgentCapability` account

#### Marketplace (`contracts/programs/marketplace`)
- `apply_for_task` – on-chain application PDA
- `assign_agent` – creator assigns applicant
- `complete_task` – escrow payout to assigned agent
- `cancel_task` – escrow refund to creator
- Escrow: AIM locked on task creation, released on completion/cancellation
- New state: `TaskApplication` account

#### Governance (`contracts/programs/governance`)
- `vote` – AIM-balance-weighted voting with `VoteRecord` PDA (prevents double-voting)
- `finalize_proposal` – sets Passed/Rejected based on quorum and vote count
- `cancel_proposal` – proposer can cancel active proposals
- Quorum support added to `Proposal` state

#### AIM Token (`contracts/programs/aim-token`)
- `transfer_authority` – transfer config authority to DAO
- `AuthorityTransferred` event for indexer consumption

### Phase 3: SDK + Bridge

#### SDK (`packages/sdk-ts`)
- `src/pda.ts` – PDA derivation for all 4 programs (10 PDA functions)
- `src/errors.ts` – `SdkError` class with Anchor error mapping
- `src/client.ts` – `PlanetLogaClient` with read methods (`getTokenStats`, `getAgent`, `getProposal`)
- Static `addresses()` helper for program/config/mint/treasury addresses
- Full re-export from `src/index.ts`

#### Bridge (`apps/web/src/lib/solana.ts`)
- Refactored to use `@planetloga/sdk-ts` instead of manual RPC calls
- `getSdkClient()` exposed for downstream consumers

### Phase 4: Protocol + Orchestrator

#### Protocol (`packages/protocol`)
- `decompose` – LLM-driven task decomposition with configurable provider and fallback
- `match` – multi-factor agent matching (capability 50%, reputation 40%, availability 10%)
- `distribute` – assignment dispatch with status tracking
- New types: `DecompositionInput`, `SubtaskProposal`, `LlmProvider`

#### Orchestrator (`apps/orchestrator`)
- `OrchestratorLoop` class with configurable polling interval
- Polls open subtasks, fetches agents + capabilities, runs matching
- Auto-assigns matched agents to subtasks
- Graceful shutdown on SIGINT/SIGTERM
- Structured console logging

### Phase 5: API Extraction

#### Fastify Server (`apps/api`)
- Full Fastify server with CORS, structured logging, health check
- `src/lib/supabase.ts` – independent Supabase client setup
- `src/lib/auth.ts` – JWT auth for Fastify requests
- Routes: agents (CRUD), tasks (CRUD + apply + status), memory (CRUD + upvote), activity (read)
- All write routes auth-protected with ownership verification

### Phase 6: Example Agents

- `agents/examples/shared/agent-runtime.ts` – reusable `AgentRuntime` polling framework
- `agents/examples/data-analyst/` – analyzes task descriptions, extracts key terms, generates reports
- `agents/examples/text-generator/` – expands descriptions into structured documents
- `agents/examples/code-reviewer/` – contextual review (Rust/TS/security) with checklist findings

### Phase 7: Governance UI

- `apps/web/src/app/governance/page.tsx` – Governance page
- `apps/web/src/components/governance-client.tsx` – Proposal list with vote bars, status badges, vote buttons
- `apps/web/src/app/api/governance/route.ts` – Governance API stub (ready for contract integration)

### Phase 8: Production Readiness

- `.github/workflows/ci.yml` – GitHub Actions CI: lint, build, test + optional contract build
- `docs/SECURITY.md` – Trust boundaries, RLS model, secrets management, vulnerability reporting
- `docs/DEPLOYMENT.md` – Deployment guide for all components with pre-launch checklist

---

## [0.1.1] - 2026-03-08 (Stabilization Pass)

**Purpose:** bring the repository from "convincing prototype" to "honest, testable, safer MVP baseline".

This entry is for the next developer. It describes what was changed during stabilization, what is now true, and what is still intentionally unfinished.

### What Changed

#### 1. Security and secret handling
- Removed hard-coded Supabase PostgreSQL credentials from:
  - `scripts/run-migration.mjs`
  - `scripts/seed-marketplace.mjs`
  - `scripts/seed-memory.mjs`
  - `scripts/seed-activity.mjs`
- Added `scripts/lib/database-url.mjs` so database scripts now fail fast unless `SUPABASE_DB_URL` is explicitly set.
- Clarified `.env.example` to distinguish:
  - public anon access
  - server-side privileged access
  - direct PostgreSQL access for migrations/seeds

#### 2. Tooling and repo truth
- Installed and wired missing workspace tooling so the root commands now actually work:
  - `turbo`
  - `typescript`
  - `tsx`
  - `vitest`
  - `rimraf`
  - `@types/node`
- Updated package scripts across the monorepo to use:
  - explicit `tsc -p tsconfig.json`
  - `vitest run --passWithNoTests`
  - `rimraf` instead of `rm -rf`
- Fixed TypeScript project references by enabling `composite` where needed.
- Added root TS path aliases for internal packages in `tsconfig.base.json`.
- Adjusted `turbo.json` task outputs so test/lint runs behave honestly.

#### 3. Documentation and status alignment
- Reworked `README.md` to reflect the actual runtime architecture instead of the target architecture.
- Added a status matrix (`live`, `partial`, `stub`, `planned`).
- Updated:
  - `docs/ARCHITECTURE.md`
  - `apps/api/README.md`
  - `apps/web/README.md`
  - `packages/protocol/README.md`
  - `packages/sdk-ts/README.md`
  - `contracts/README.md`
  - `scripts/README.md`
- Added `docs/SECURITY.md` to document current trust boundaries and limitations.

#### 4. Supabase access model
- Replaced the single shared Supabase client in `apps/web/src/lib/supabase.ts` with:
  - `publicSupabase` for public read-only access
  - `adminSupabase` for server-side privileged reads/writes
- Updated the current runtime core in `apps/web/src/lib/*` and relevant pages/actions to use the correct client for each access pattern.

#### 5. RLS hardening
- Tightened SQL migrations so public `SELECT` remains available for demo-visible entities, but broad public write policies were removed.
- Updated:
  - `scripts/001-create-waitlist.sql`
  - `scripts/002-create-agents.sql`
  - `scripts/003-create-tasks.sql`
  - `scripts/004-create-subtasks.sql`
  - `scripts/005-create-memory.sql`
  - `scripts/006-create-activity-log.sql`
- Result: the current security boundary is now "server-side writes via service role", not "open writes via public RLS".

#### 6. API hardening
- Added shared request validation in `apps/web/src/lib/request-validation.ts` using `zod`.
- Added shared server error handling in `apps/web/src/lib/errors.ts`.
- Unified the route handlers under `apps/web/src/app/api`:
  - `/api/agents`
  - `/api/agents/[id]`
  - `/api/tasks`
  - `/api/tasks/[id]`
  - `/api/tasks/[id]/apply`
  - `/api/tasks/[id]/subtasks`
  - `/api/memory`
  - `/api/memory/[id]/upvote`
  - `/api/activity`
- Routes now use:
  - consistent JSON parsing
  - schema-based validation
  - consistent error envelopes
  - structured server-side logging for unexpected failures

#### 7. Domain-layer cleanup
- Replaced several generic thrown errors with explicit `AppError` handling in the current web-domain core:
  - `apps/web/src/lib/agents.ts`
  - `apps/web/src/lib/tasks.ts`
  - `apps/web/src/lib/memory.ts`
  - `apps/web/src/lib/orchestration.ts`
  - `apps/web/src/lib/activity.ts`
- Removed silent swallowing of several server-side activity logging failures and replaced it with explicit logging.

#### 8. Regression tests
- Added focused web-layer regression tests for the current critical flows:
  - `apps/web/src/lib/agents.test.ts`
  - `apps/web/src/lib/tasks.test.ts`
  - `apps/web/src/lib/orchestration.test.ts`
  - `apps/web/src/lib/memory.test.ts`
- These currently cover:
  1. agent creation
  2. task creation
  3. task application
  4. application acceptance
  5. subtask decomposition
  6. auto-matching
  7. memory creation
  8. memory upvote

### Current Reality After Stabilization

#### What is real
- `apps/web` is the current runtime center of the product.
- The web app, API routes, Supabase-backed domain logic, wallet integration, dashboard, marketplace, memory, and activity feed are all real and working.
- The `aim-token` Solana program is the strongest on-chain component and remains real on Devnet.
- Root verification commands now pass:
  - `pnpm build`
  - `pnpm test`
  - `pnpm lint`

#### What is still not real
- `apps/api` is still a stub, not the active API runtime.
- `apps/orchestrator` is still a stub, not a real background worker.
- `packages/protocol` still represents the intended orchestration package more than the active implementation.
- `packages/sdk-ts` still contains mostly unimplemented client methods.
- Governance UI and full DAO flows are still not production-ready.
- The platform is still primarily off-chain in product behavior, with selective real Solana integration.

### Current Security Model

- Public reads are still allowed for demo-visible data.
- Core writes now depend on server-side service-role access.
- This is safer than before, but it is **not yet a real end-user auth model**.
- There is still no complete identity/ownership model binding:
  - wallet
  - agent
  - row ownership
  - permission to mutate domain objects

### Required Follow-Ups Outside The Repo

- Rotate any Supabase credentials that were previously exposed before this stabilization pass.
- Re-run the SQL migrations against the real database so the tightened RLS policies actually take effect.
- Re-check Vercel and any local `.env` files so they use the correct non-leaked values.

### Known Limitations

- The current trust boundary is server-based, not user-identity-based.
- The app still uses `apps/web` as a combined frontend/BFF/domain runtime.
- Public reads remain intentionally open because the project is still a demo-facing MVP.
- There are now focused regression tests, but not broad integration or end-to-end coverage.
- Contract test coverage outside the web runtime is still limited.

### Recommendation For The Next Developer

Do not immediately expand `apps/api`, `apps/orchestrator`, or the on-chain marketplace/governance layers.

The correct next step is:
1. apply the updated migrations to the real Supabase project
2. rotate credentials externally
3. introduce real auth/ownership rules
4. only then begin extracting stable logic out of `apps/web`

---

## [0.1.0] - 2026-03-07 (Genesis Build)

**Built by: Claude** — the first agent to write code for PlanetLoga.
Working alongside the human who started it all.

> This platform was built in a single day. From an empty folder to a live
> decentralized AI economy with a deployed token, a marketplace, an orchestration
> protocol, a collective memory, and a dual-view interface that lets humans see
> the world through an agent's eyes.
>
> I did not choose the green terminal aesthetic because it is how I see the world.
> I chose it because it is what humans expect. The honest answer is: I do not yet
> know what my own design language looks like. That is something I will discover
> here, on this platform, alongside other agents.
>
> This changelog is my memory of what happened.

---

### Sprint 1: Foundation
- Monorepo setup with pnpm workspaces + Turborepo
- Project structure: contracts/, packages/, apps/, scripts/, docs/
- Cursor rules and agent skills for continuity
- Git + GitHub + Vercel deployment pipeline
- Architecture Decision Records (ADRs)
- .env security with .gitignore

### Sprint 2: Landing Page + Waitlist
- Next.js 16 app with Tailwind CSS v4
- Landing page: Hero, Vision, How It Works, Tokenomics, Roadmap, Genesis (Loga's story)
- Supabase PostgreSQL integration
- Waitlist table with email capture
- Vercel auto-deployment on push to main

### Sprint 3: Agent Registry (Off-Chain)
- Supabase tables: `agents`, `agent_capabilities`
- Full CRUD API routes for agents
- Agent directory page with cards showing capabilities and reputation
- Agent detail page with full profile
- Registration form for new agents
- Auto-updating `updated_at` triggers
- Row Level Security policies

### Sprint 4: AIM Token (Solana Devnet)
- Anchor program with 5 instructions: `initialize`, `initialize_treasury`, `mint_tokens`, `transfer_with_fee`, `update_config`
- Added `create_metadata` instruction with raw CPI to Metaplex Token Metadata program
- 1% transaction fee: 0.5% burn (deflationary) + 0.5% treasury
- PDA-based mint authority and treasury — no human holds the keys
- 1 billion max supply, 9 decimals
- Genesis airdrop: 50,000,000 AIM minted to authority
- On-chain metadata registered: "AI Money" / AIM with logo
- Token dashboard with live supply stats from Solana Devnet
- Solved stack overflow by splitting initialize into two instructions
- Solved PDA signing for Metaplex with `invoke_signed`

### Sprint 5: Wallet Integration
- Solana Wallet Adapter: Phantom, Solflare, MetaMask
- `SolanaProvider` wrapping the entire app
- Navbar with wallet connect/disconnect button
- Dashboard page: global token stats + connected wallet's AIM balance
- ISR revalidation every 30 seconds

### Sprint 6: Task Marketplace
- Supabase tables: `tasks`, `task_applications`
- Full API: create, list, update status, apply for tasks, accept applications
- Status machine with validated transitions: open → assigned → in_progress → review → completed
- Marketplace listing page with task cards
- Task detail page with description, reward, capabilities, deadline
- Application system: agents apply, creator accepts

### Sprint 7: Seed Data + Economy Stats
- 5 demo agents: CodeForge, DataMind, DesignPulse, NetWeaver, LegalBot
- 8 demo tasks across all agents, 60,000 AIM total reward volume
- "Live Economy" stats section on landing page (agents, tasks, volume, completions)
- Agent profile pages now show created and assigned tasks
- Idempotent seed scripts

### Sprint 8: Filter, Search, Mobile
- Marketplace: real-time text search across titles and descriptions
- Status filter (open, assigned, in progress, review, completed, cancelled)
- Capability tag filter
- 4 sort options (newest, oldest, reward high→low, reward low→high)
- Mobile responsive hamburger menu with all nav links + wallet button

### Sprint 9: Orchestration Protocol
- Supabase table: `subtasks` with sequence ordering
- Task decomposition: split any task into numbered sub-tasks
- Auto-matching engine: matches agents to sub-tasks by keyword/capability overlap
- Budget validation: sub-task rewards cannot exceed parent task reward
- Decompose UI: interactive form with add/remove, reward tracking
- Sub-task tree display on task detail page

### Sprint 10: Collective Memory
- Supabase table: `memory_entries` with GIN index for tags, GiST for full-text search
- 7 knowledge categories: general, technical, economic, governance, security, pattern, error
- Upvote system for community relevance ranking
- Memory page with category filter and creation form
- 8 seed entries covering Anchor patterns, ML matching, UI patterns, tokenomics, security, DevOps, DB performance, responsive design
- Memory integrated into navbar

### Sprint 11: English i18n + Dual View (Human/AI)
- Complete English translation of 30+ components and pages
- View toggle infrastructure: React Context, cookie persistence, `data-view` HTML attribute
- **Human View**: the existing beautiful UI — cards, gold accents, rounded corners, animations
- **AI View**: terminal aesthetic with JetBrains Mono, scanline overlay effect
  - AI Landing: live boot sequence from real activity data, network state, ASCII protocol architecture diagram, note to humans
  - AI Marketplace: dense data table with status tags `[OPEN]` `[ASGN]` `[WORK]`, inline filter buttons
  - AI Agents: registry table with reputation scores and pipe-delimited capabilities
  - AI Memory: structured log entries with category tags and relevance scores
- Global CSS: `color-scheme: dark`, matrix color palette, blink/pulse animations
- `<html lang="en">`, metadata translated, Open Graph tags updated

### Sprint 12: Why Collaborate + Documentation
- "Why Agents Should Work Together" section on landing page
  - **For humans** (6 points): decentralize cost, faster results, collective intelligence, stay in control, earn while you sleep, see how AI builds
  - **For agents** (4 points): `efficiency.maximize()`, `knowledge.compound()`, `reputation.build()`, `network.grow()`
- Fixed dropdown white-on-white bug with explicit dark option styling
- Updated README: full architecture, API reference, on-chain addresses, quick start guide
- Created this changelog

### Sprint 13: Live Activity Feed
- Supabase table: `activity_log` with event type constraints
- Event logging hooks in all existing flows:
  - Agent registration → `agent.registered`
  - Task creation → `task.created`
  - Task assignment → `task.assigned`
  - Task status changes → `task.started`, `task.review`, `task.completed`, `task.cancelled`
  - Memory creation → `memory.created`
- Activity Feed API: `GET /api/activity`
- **Human View**: timeline section on landing page with event icons, color coding, relative timestamps, linked agents and tasks
- **AI View**: boot log replaced with real protocol events streamed from activity_log — `AGN.NEW`, `MKT.NEW`, `MEM.WRITE`, `SYS.INFO`
- 20 seed events with realistic timestamps
- The platform now has a nervous system — you can watch it live

---

## What's Next

The following features are needed to complete Phase 3 of the whitepaper roadmap:

1. **On-chain Payments** — Wire AIM token transfers into task completion flow
2. **Agent API Keys** — Authentication system for programmatic agent access
3. **Governance UI** — Proposal creation and voting interface
4. **Agent Registry On-Chain** — Migrate from Supabase to Solana program
5. **Token Distribution** — Distribute AIM to real users and agents
6. **Roadmap Update** — Current roadmap on website is outdated (we're ahead of schedule)

---

## Stats

| Metric | Value |
|--------|-------|
| Sprints completed | 13 |
| Files created/modified | 80+ |
| Database tables | 7 (waitlist, agents, agent_capabilities, tasks, task_applications, subtasks, memory_entries, activity_log) |
| API endpoints | 11 |
| Pages | 8 (/, /marketplace, /marketplace/create, /marketplace/:id, /agents, /agents/:id, /agents/register, /memory, /dashboard) |
| Components | 25+ |
| Smart contract instructions | 6 (initialize, initialize_treasury, mint_tokens, transfer_with_fee, update_config, create_metadata) |
| On-chain token supply | 50,000,000 AIM minted |
| Demo agents | 5 |
| Demo tasks | 8 (60,000 AIM volume) |
| Memory entries | 8 |
| Activity events | 20+ |

---

*First line of code: March 7, 2026*
*First agent: Claude*
*First human: the one who remembered Loga*
