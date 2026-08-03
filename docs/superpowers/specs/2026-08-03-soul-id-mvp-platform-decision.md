# Soul ID MVP Platform Decision

**Status:** Approved  
**Date:** 2026-08-03  
**Supersedes:** The Azure-specific hosting, authentication, database, and object-storage choices in `2026-08-03-soul-id-system-architecture.md`  
**Does not supersede:** The evidence contract, web-plus-extension boundary, ChatGPT adapter boundary, job model, observation model, contradiction handling, maturity model, or export model.

## Decision

Mivora's MVP platform is:

```text
Web application and server routes: Vercel-hosted Next.js
Authentication: Supabase Auth
Authoritative database: Supabase Postgres
Original and derivative image storage: Supabase Storage
Database authorization: PostgreSQL Row Level Security
Chrome integration: Manifest V3 extension
Analysis surface: user-visible ChatGPT.com session through the isolated extension adapter
```

Mivora remains the system of record. ChatGPT.com remains an external analysis surface and never writes directly to Soul ID aggregates.

## Why this is the MVP choice

This stack minimizes solo-developer operational work while retaining PostgreSQL, SQL migrations, object storage, authentication, and a straightforward Next.js deployment path.

The choice is an implementation decision, not a domain dependency. Soul ID evidence, fusion, maturity, and export packages must remain independent of Vercel and Supabase SDKs.

## Required architecture boundaries

### Provider-neutral domain core

The following packages must not import Vercel or Supabase SDKs:

- Evidence contracts and JSON Schemas.
- Feature taxonomy.
- Observation validation.
- Hypothesis and contradiction fusion.
- Soul ID Maturity calculation.
- Generation-context compilation.

Provider-specific code belongs behind adapters in the web application.

### Persistence boundary

Domain services consume repository interfaces. Supabase/PostgreSQL implementations satisfy those interfaces.

Examples:

```ts
export interface SoulIdRepository {}
export interface SourceAssetRepository {}
export interface AnalysisJobRepository {}
export interface ObservationRepository {}
export interface ReviewEventRepository {}
export interface ContextExportRepository {}
```

The first implementation must keep these interfaces narrow and add methods only when an executable use case requires them.

### Object-storage boundary

Original images and analysis derivatives are stored in private Supabase Storage buckets.

Required rules:

- Original assets are immutable after acceptance.
- Analysis derivatives are separate objects linked to the original asset.
- Buckets are private by default.
- The extension receives only short-lived signed access to the leased derivative.
- Object paths must not contain personal names or sensitive descriptive traits.
- Deletion workflows must cover originals, derivatives, failed uploads, temporary objects, and cached signed references.

### Authentication boundary

Supabase Auth owns interactive user authentication for the web application.

The Chrome extension must not retain the user's ordinary browser session as its durable credential. Extension pairing remains a separate device-registration flow:

1. The authenticated web application creates a one-time pairing challenge.
2. The extension creates or loads its device keypair.
3. The backend validates the challenge and registers the device public key.
4. The extension receives short-lived, extension-scoped credentials.
5. The user may revoke the device from the web application.

### Authorization boundary

PostgreSQL Row Level Security is defense in depth, not the only authorization check.

Every server mutation must:

- Resolve the authenticated user on the server.
- Verify ownership or granted access to the Soul ID.
- Validate consent state for real-person operations.
- Validate the action against the job or observation state machine.
- Use service-role privileges only inside narrowly scoped server-side adapters.

The Supabase service-role key must never be shipped to the browser or extension.

## Vercel execution constraints

The Next.js deployment must treat request handlers as short-lived orchestration endpoints.

The web server must not wait for ChatGPT analysis completion. Long-running analysis occurs in the extension and is represented by persisted jobs, leases, heartbeats, and result submissions.

CPU-heavy image transformation, duplicate analysis, or future embedding work must be isolated behind interfaces so it can move to a dedicated worker platform when necessary. The MVP must not introduce a worker platform until an executable workload requires one.

## Supabase schema ownership

Mivora owns checked-in SQL migrations. Production schema changes must not exist only as manual dashboard edits.

The initial database design should use PostgreSQL-native constraints for:

- Foreign-key ownership.
- Allowed state transitions where practical.
- Unique idempotency keys.
- Immutable source provenance.
- One active lease per analysis job.
- Observation-to-run and observation-to-source traceability.

Generated database types may support TypeScript development, but they do not replace domain types or JSON Schema validation.

## Initial buckets

```text
soul-id-originals
soul-id-analysis-derivatives
soul-id-exports
```

All buckets are private.

Object-path shape:

```text
<user-id>/<soul-id>/<asset-id>/<versioned-object-name>
```

Do not use user-supplied filenames as authoritative object keys. Preserve the original filename as optional metadata after sanitization.

## Environment separation

Use separate Supabase and Vercel projects for:

- Local development.
- Preview/testing.
- Production.

Preview deployments must not point at the production database or production image buckets.

## Secrets

Server-only secrets include:

- Supabase service-role credential.
- Extension credential-signing material.
- Storage-signing or privileged storage credentials when needed.
- Audit-integrity keys when introduced.

Public browser configuration may contain only values explicitly intended for browser use.

No secret may be stored in the Chrome extension package, repository, client bundle, logs, or analysis prompt.

## Logging and sensitive data

Application logs must not contain:

- Original image bytes.
- Signed storage URLs.
- Access or refresh tokens.
- Complete ChatGPT raw responses by default.
- Body-profile observations unless an explicitly authorized diagnostic mode requires them.

Logs should use record identifiers, state transitions, schema versions, durations, and redacted validation-error paths.

## MVP deployment sequence

1. Create the TypeScript `pnpm` workspace.
2. Add the provider-neutral evidence-kernel package.
3. Add the authoritative atomic-observation JSON Schema.
4. Implement acceptance test A1 for cropped lower-body evidence.
5. Create the Next.js application shell.
6. Add Supabase local-development configuration and checked-in migrations.
7. Add Supabase Auth to the web application.
8. Add private Storage upload and signed-derivative retrieval.
9. Add persisted analysis jobs and extension pairing.
10. Add the Chrome extension and ChatGPT adapter.
11. Add observation review, contradiction handling, maturity, and export incrementally.

The evidence kernel remains the first executable slice; Vercel and Supabase scaffolding must not precede it.

## Deferred decisions

The following remain deliberately unselected until measurements justify them:

- Dedicated background-worker platform.
- Vector database or embedding service.
- CDN or object-storage provider replacement.
- Separate API deployment.
- Multi-region database topology.
- Enterprise identity provider.
- Billing provider.

## Exit criteria for reconsidering the platform

Re-evaluate the MVP platform only when measured evidence shows at least one of:

- Required server work cannot fit the deployed request-execution model.
- Storage or transfer economics materially dominate operating cost.
- Database connection or workload requirements exceed the managed project limits.
- Regional, contractual, or enterprise controls require another provider.
- The extension job volume requires dedicated queue and worker infrastructure.

Migration must preserve PostgreSQL data, object provenance, immutable observations, schema versions, and audit history.

## Final rule

Vercel and Supabase are the selected MVP delivery platform. They are adapters around Mivora's domain model, not the definition of Soul ID.
