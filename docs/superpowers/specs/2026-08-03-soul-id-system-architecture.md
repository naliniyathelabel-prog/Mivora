# Soul ID System Architecture

**Status:** Approved design  
**Date:** 2026-08-03  
**Depends on:** `docs/soul-id-evidence-contract.md`

## Goal

Build Mivora as a web application plus a Chrome extension that uses a user-visible ChatGPT.com session to analyze uploaded character images. Mivora remains the system of record for consent, source assets, analysis jobs, raw model responses, atomic observations, contradictions, maturity, review history, and exported generation context.

The approved product flow is:

```text
Create Soul ID
→ establish character type and consent
→ upload images
→ queue image analyses
→ inspect per-image observations
→ resolve or retain contradictions
→ view Soul ID Maturity
→ export generation context
```

## Product boundary

Mivora processes only:

1. Fictional characters.
2. User-created synthetic characters.
3. Explicitly consented adults.

The system must reject or stop processing for minors, uncertain adult status, non-consenting real people, identification or tracking use cases, and requests to infer concealed anatomy or unsupported sensitive attributes.

## Primary architecture decision

**Mivora owns truth. The Chrome extension is a transport and orchestration client. ChatGPT.com is an external analysis surface, not the database, queue, or fusion engine.**

The extension may submit one Mivora-issued analysis job to a user-visible ChatGPT conversation and return the raw response. The Mivora backend must independently authenticate the extension, validate the job lease, validate the response schema, store provenance, and ingest accepted observations.

A ChatGPT response must never directly overwrite a Soul ID aggregate.

## Why this boundary

This design provides:

- Evidence provenance independent of the ChatGPT conversation.
- Reprocessing when prompts, schemas, or fusion logic change.
- Preservation of contradictory observations.
- Recovery when ChatGPT output is malformed or interrupted.
- A web application that remains usable even when the extension is disconnected.
- A replaceable ChatGPT adapter rather than a product coupled to one page implementation.

## Technical stack

Use one primary implementation language to reduce solo-developer overhead.

### Monorepo

- TypeScript with strict mode.
- `pnpm` workspaces.
- Turborepo only after build orchestration requires it; do not add it during initial scaffolding.

### Web application and backend

- Next.js with App Router.
- Server-side route handlers and domain services in the same deployable application for the MVP.
- PostgreSQL as the authoritative relational database.
- Drizzle ORM with checked-in SQL migrations.
- Azure Database for PostgreSQL Flexible Server in hosted environments.
- Azure Blob Storage for original and analysis-ready image assets.
- Azure Container Apps for the web application when deployment begins.
- Microsoft Entra External ID for hosted authentication; use a local development identity adapter until hosted authentication is required.

### Chrome extension

- Chrome Manifest V3.
- TypeScript, React, and Vite.
- Side panel as the primary extension UI.
- Background service worker for job leases and durable orchestration.
- A narrowly scoped ChatGPT content-script adapter.
- IndexedDB for local resumable state; do not place sensitive image data or long-lived credentials in `chrome.storage.sync`.

### Shared contracts

- JSON Schema is authoritative for extractor output.
- Zod may be generated from or kept mechanically aligned with JSON Schema for TypeScript runtime validation.
- Shared packages define feature identifiers, statuses, job states, and API request/response types.

## Repository shape

```text
apps/
  web/
    app/
    src/
      auth/
      soul-ids/
      assets/
      analysis-jobs/
      observations/
      fusion/
      maturity/
      exports/
      persistence/
  extension/
    src/
      background/
      content/chatgpt/
      sidepanel/
      storage/
      api/
packages/
  contracts/
    schemas/
    src/
  feature-taxonomy/
    src/
  test-fixtures/
    chatgpt-dom/
docs/
  soul-id-evidence-contract.md
  superpowers/specs/
```

Each domain directory must expose a small public interface. Page components and content scripts must not contain database, fusion, or evidence-weighting logic.

## Component responsibilities

### Web application

The web application owns:

- Soul ID creation and naming.
- Character-type declaration.
- Consent capture and revocation.
- Source image upload.
- Original-file hashing and metadata extraction.
- Analysis-ready derivative creation.
- Duplicate and evidence-group detection.
- Job creation, leasing, retry, cancellation, and history.
- Raw ChatGPT response storage.
- Server-side schema validation.
- Atomic observation ingestion.
- Human review events.
- Hypothesis and contradiction aggregation.
- Soul ID Maturity calculation.
- Prompt-ready context export.
- Export and deletion workflows.

### Chrome extension

The extension owns only:

- Pairing with a Mivora account.
- Requesting a short-lived analysis-job lease.
- Fetching the leased analysis derivative using a short-lived signed URL.
- Opening or selecting the dedicated ChatGPT analysis conversation.
- Uploading one image.
- inserting the exact versioned prompt supplied by Mivora.
- Submitting the prompt after an explicit user action starts the job.
- Detecting completion, error, rate-limit, or interruption states.
- Capturing the complete raw assistant response.
- Performing local preliminary JSON validation.
- Returning the raw response and parsed candidate result to Mivora.
- Showing progress, retry state, and actionable failures.

The extension must not:

- Store database credentials.
- Store an OpenAI API key.
- Calculate canonical Soul ID traits.
- Modify existing observations or aggregates.
- Mark a model response trusted.
- silently browse unrelated pages.
- bypass ChatGPT limits, protective measures, or user authentication.

### ChatGPT adapter

The ChatGPT-specific implementation must be isolated behind this interface:

```ts
export interface AnalysisSurfaceAdapter {
  detectAvailability(): Promise<SurfaceAvailability>;
  prepareConversation(job: LeasedAnalysisJob): Promise<PreparedConversation>;
  uploadImage(asset: AnalysisAsset): Promise<void>;
  insertPrompt(prompt: string): Promise<void>;
  submit(): Promise<void>;
  waitForResult(signal: AbortSignal): Promise<RawSurfaceResult>;
  captureDiagnostics(): Promise<SurfaceDiagnostics>;
}
```

No queue, evidence, or Soul ID domain code may import ChatGPT DOM selectors directly.

## ChatGPT image-analysis constraints

ChatGPT image analysis is used as an external reasoning surface, but Mivora must account for these constraints:

- Images may be resized before analysis.
- Original filenames and image metadata are not a reliable input to image understanding.
- Upload limits and product behavior may differ by account and may change.
- The page DOM, labels, and interaction flow are not a stable application API.

Therefore:

1. Mivora extracts file metadata, dimensions, hashes, and capture metadata before sending the analysis derivative to ChatGPT.
2. The original image is retained separately from the analysis derivative.
3. Prompts must request the finest **reliably visible** granularity, not claim literal pixel-for-pixel access.
4. The extension must detect page incompatibility and pause rather than guessing selectors.
5. ChatGPT-specific selectors and state detection must be versioned and fixture-tested.

## Analysis isolation rule

Per-image extraction must be blind to the current canonical Soul ID.

The extraction prompt receives:

- The current source image only.
- The feature taxonomy version.
- Visibility and no-guessing rules.
- The exact output schema.
- The source asset and job identifiers needed for correlation.

It must not receive:

- Existing canonical traits.
- Previous observations.
- Majority hypotheses.
- Desired character appearance.
- A generated context intended to influence the answer.

This prevents confirmation bias. Fusion happens only after the new image has been independently analyzed.

## Source-image flow

### Original asset

The original upload is immutable and stored with:

- Content hash.
- MIME type.
- Byte size.
- Pixel dimensions.
- User-provided capture date when available.
- Embedded metadata extracted locally when available and permitted.
- Synthetic, real, or uncertain-source classification.
- Consent association for real adults.

### Analysis derivative

A separate derivative is created for ChatGPT submission when necessary. It must:

- Preserve aspect ratio.
- Avoid cosmetic enhancement.
- Avoid filling cropped regions.
- Remain below the active upload limit.
- Record every transformation applied.
- Link back to the original asset.

The derivative is evidence transport, not a replacement for the original.

## End-to-end job flow

1. The user uploads one or more images in the web application.
2. The backend hashes each original and detects exact or likely duplicates.
3. The backend extracts source metadata and generates an analysis derivative.
4. The user queues selected assets for analysis.
5. The backend creates one analysis job per asset and schema version.
6. The extension requests the next available job.
7. The backend atomically leases one job to the paired extension device.
8. The extension downloads the analysis derivative through a short-lived signed URL.
9. The extension opens the dedicated ChatGPT analysis conversation.
10. The extension uploads the derivative and inserts the exact job prompt.
11. A user action initiates submission; the extension may then complete the visible automated sequence.
12. The extension waits for ChatGPT to finish or report a recoverable error.
13. The extension captures the raw response.
14. The extension performs preliminary parsing and schema validation.
15. If invalid, the extension may request a schema-only correction in the same conversation up to two times.
16. The extension submits the raw response, parsed candidate, diagnostics, prompt version, and schema version to Mivora.
17. The backend revalidates everything independently.
18. The backend stores the immutable analysis run.
19. Valid atomic observations enter the evidence store.
20. Fusion recalculates affected hypotheses and maturity.
21. The web UI presents new observations and contradictions for review.

## Job state machine

```text
queued
→ leased
→ preparing_surface
→ uploading
→ submitted
→ awaiting_response
→ validating
→ completed
```

Alternative terminal or recovery states:

```text
retryable_failed
permanent_failed
cancelled
lease_expired
blocked_by_surface_change
blocked_by_account_limit
```

Rules:

- A lease has an expiry and a device owner.
- The extension sends heartbeats while actively processing.
- Expired leases return to `queued` unless the maximum attempt count is reached.
- A completed job is idempotent; repeated result submission returns the existing run identifier.
- A job is not completed until server-side validation and immutable run storage succeed.

## Extension state machine

```text
disconnected
ready
loading_job
opening_chat
uploading_image
inserting_prompt
awaiting_user_start
waiting_for_response
extracting_response
validating_response
submitting_result
completed
paused
failed
```

The side panel must always show:

- Current Soul ID.
- Current asset thumbnail.
- Job state.
- Elapsed active time.
- Retry count.
- Last actionable message.
- Pause, resume, and cancel controls.

## Pairing and authentication

1. The signed-in web application generates a one-time pairing code.
2. The extension submits the code and creates a device keypair.
3. The backend registers the public key and returns a short-lived access token plus refresh mechanism.
4. Extension tokens are scoped to extension endpoints and the current user.
5. A user can revoke any paired extension device from the web application.

Do not reuse the user's web-session cookies as the extension's durable authentication mechanism.

## Minimum API surface

```text
POST   /api/soul-ids
GET    /api/soul-ids/:soulId
POST   /api/soul-ids/:soulId/consent
POST   /api/soul-ids/:soulId/assets
GET    /api/soul-ids/:soulId/assets
POST   /api/assets/:assetId/analysis-jobs
GET    /api/soul-ids/:soulId/observations
POST   /api/observations/:observationId/reviews
GET    /api/soul-ids/:soulId/maturity
POST   /api/soul-ids/:soulId/exports
POST   /api/extension/pair
POST   /api/extension/token/refresh
POST   /api/extension/jobs/lease
POST   /api/extension/jobs/:jobId/heartbeat
POST   /api/extension/jobs/:jobId/result
POST   /api/extension/jobs/:jobId/fail
POST   /api/extension/jobs/:jobId/cancel
```

Every write endpoint must require an idempotency key.

## Core persisted entities

```text
users
extension_devices
soul_ids
consent_records
source_assets
asset_derivatives
evidence_groups
analysis_jobs
analysis_job_attempts
analysis_runs
observations
observation_regions
review_events
feature_hypotheses
feature_aggregates
contradiction_groups
maturity_snapshots
context_exports
audit_events
```

### Immutable records

The following records are append-only after acceptance:

- Source-asset provenance.
- Analysis runs.
- Atomic observations.
- Review events.
- Audit events.
- Generated context exports.

Aggregates and maturity snapshots are derived and recalculable.

## Extractor response envelope

The first machine-readable response must use an envelope similar to:

```json
{
  "schema_version": "0.1.0",
  "job_id": "job_...",
  "source_asset_id": "asset_...",
  "image_assessment": {
    "overall_quality": 0.0,
    "view": "unknown",
    "crop": "unknown",
    "distortion_factors": []
  },
  "visibility_map": [],
  "observations": [],
  "warnings": []
}
```

The authoritative JSON Schema is implemented before any production prompt. The prompt is tested against that schema using fixed image fixtures.

## Response handling

The extension keeps both:

- `raw_response`: the complete captured assistant response.
- `candidate_json`: parsed JSON when available.

Permitted local normalization is deliberately narrow:

- Remove one surrounding Markdown JSON code fence.
- Normalize Unicode byte-order mark.
- Preserve all field values exactly.

The extension must not repair semantic content or silently invent missing fields.

If local validation fails, the correction prompt must include only:

- The invalid response.
- The schema validation errors.
- An instruction to return corrected JSON without adding observations.

The backend performs final validation regardless of local success.

## Observation ingestion

For every returned attempted feature:

1. Verify the feature identifier exists in the submitted taxonomy version.
2. Verify the status is allowed.
3. Verify required provenance and visible-region fields.
4. Reject impossible numeric ranges.
5. Ensure positive observations satisfy feature-specific visibility gates.
6. Store the immutable observation or the explicit non-observation.
7. Link the observation to the analysis run and source asset.
8. Trigger recalculation only for affected feature aggregates.

A schema-valid response may still be rejected by domain validation.

## Contradiction handling

The fusion layer evaluates disagreement in this order:

1. Capture conditions.
2. Pose or expression.
3. Styling or garment effects.
4. Temporal change.
5. Low-quality or unreliable evidence.
6. Unresolved contradiction.

The UI offers two distinct actions:

- **Resolve as variant:** group observations under a condition or time period while preserving each observation.
- **Keep contradictory:** retain multiple hypotheses without selecting a winner.

A user review never rewrites the model's literal observation. It creates an auditable review event and, when needed, a corrected normalized interpretation.

## Soul ID Maturity UI

The main circular indicator is named **Soul ID Maturity**, not accuracy.

It is accompanied by four visible components:

- Coverage.
- Confidence.
- View diversity.
- Evidence independence.

Category scores remain visible for:

- Face geometry.
- Skin and persistent marks.
- Hair.
- Upper body.
- Lower body.
- Hands.
- Feet.
- Profile and 3D structure.
- Temporal history.

The ring must not materially increase when duplicates or adjacent video frames are uploaded.

The UI must also show the highest-value missing evidence, for example:

```text
Best next image: clear left profile with hair moved behind the ear.
Expected maturity impact: face profile + ear structure.
```

This recommendation is generated from taxonomy coverage, not by inventing missing traits.

## Web UI information architecture

### Soul ID list

- Character name and thumbnail.
- Character type.
- Consent state when applicable.
- Overall maturity.
- Active and failed job counts.
- Last evidence update.

### Soul ID workspace

Tabs:

1. **Overview** — maturity ring, category coverage, next-best evidence.
2. **Images** — originals, derivatives, duplicate groups, processing state.
3. **Observations** — per-image atomic evidence with source-region overlays.
4. **Contradictions** — competing hypotheses and review actions.
5. **Timeline** — semi-stable traits and time-bounded variants.
6. **Export** — generated context versions and formats.
7. **Settings** — consent, retention, extension devices, deletion.

### Analysis queue

- Queued, running, blocked, completed, and failed filters.
- Pause all and resume controls.
- Per-job attempt history.
- Clear explanation when ChatGPT page changes or account limits block work.

## Export compiler

The exported generation context is derived from accepted evidence and contains:

```text
confirmed
probable
conditioned_variants
temporal_variants
contradictions
unknown
negative_identity_constraints
```

Export profiles initially support:

1. Full structured JSON.
2. Compact model-neutral text context.
3. Shot-conditioned text context for a requested view, pose, or time period.

The compiler must never promote generated output back into trusted evidence.

## Security and privacy

- Original images and derived body or biometric profiles are sensitive data.
- Encrypt data in transit and at rest.
- Use short-lived signed asset URLs.
- Scope extension host permissions to the Mivora origin and `chatgpt.com` only.
- Do not log source images, complete model responses, consent documents, tokens, or signed URLs in ordinary application logs.
- Audit reads, writes, exports, device pairing, consent changes, and deletion.
- Support full deletion across originals, derivatives, observations, aggregates, exports, caches, and pending jobs.
- Do not use Soul ID data for model training without separate explicit permission.

## Failure handling

### ChatGPT page changed

- Stop before submission if required UI anchors cannot be identified confidently.
- Record sanitized diagnostics and adapter version.
- Mark the job `blocked_by_surface_change`.
- Never click based on screen position alone.

### Account or upload limit

- Pause the queue.
- Preserve the current lease or safely release it according to remaining lease time.
- Show the user the visible ChatGPT error.
- Do not retry aggressively or attempt to bypass the limit.

### Browser closed or service worker suspended

- Persist the orchestration checkpoint in IndexedDB.
- Resume only after reconciling with the backend lease state.
- Avoid duplicate prompt submission by storing a client submission identifier.

### Malformed response

- Save the raw response.
- Attempt at most two schema-only correction turns.
- Submit a failed attempt with validation diagnostics if still invalid.

### Backend unavailable

- Retain the captured raw response encrypted in extension-local storage for a bounded retry period.
- Do not start another job until the current result is acknowledged or explicitly abandoned.

### Consent revoked during processing

- Cancel or reject the active job server-side.
- Revoke signed URLs and extension access to that Soul ID.
- Begin the deletion workflow.

## Testing strategy

### Shared contract tests

- Valid observation envelope passes.
- Missing provenance fails.
- Positive evidence for an unavailable region fails domain validation.
- `unknown` with explicit reasons passes.
- Unknown feature identifiers fail.

### Evidence-contract acceptance tests

Implement A1 through A7 from `docs/soul-id-evidence-contract.md` as executable domain tests before building the full UI.

### Extension unit tests

- Job lease persistence.
- Idempotent result submission.
- Code-fence removal without semantic mutation.
- Retry limit enforcement.
- Pause and cancellation behavior.

### ChatGPT adapter fixture tests

Store sanitized HTML fixtures representing supported ChatGPT states:

- Ready for upload.
- Upload in progress.
- Ready to send.
- Generating.
- Completed response.
- Rate limit.
- Upload failure.
- Unsupported or changed page.

The adapter is tested against fixtures in CI. Live ChatGPT tests are manual smoke tests and must not be required for every pull request.

### Web integration tests

- Create Soul ID and consent record.
- Upload an asset and create a job.
- Lease to one extension device only.
- Reject an expired or foreign lease result.
- Store raw and parsed analysis run.
- Recalculate affected aggregate and maturity.
- Preserve contradictory hypotheses.
- Export a reproducible context.

## Observability

Use structured events with correlation identifiers:

- `soul_id`
- `asset_id`
- `job_id`
- `attempt_id`
- `analysis_run_id`
- `extension_device_id`
- `prompt_version`
- `schema_version`
- `adapter_version`

Operational logs must contain statuses and timings, not image content or sensitive response bodies.

## Delivery sequence

### Phase 1 — Evidence kernel

- TypeScript monorepo.
- Atomic observation JSON Schema.
- Feature taxonomy seed.
- Domain validation.
- A1 cropped-region acceptance test.

### Phase 2 — Local vertical slice

- Local web UI.
- Soul ID creation and character type.
- Consent record.
- One-image upload.
- One queued analysis job.
- Manual paste of a ChatGPT response into a development result endpoint.
- Observation display.

This proves the evidence flow before browser automation.

### Phase 3 — Extension bridge

- Device pairing.
- Job leasing.
- Side-panel queue.
- ChatGPT adapter.
- Raw response capture and submission.
- Resume and failure handling.

### Phase 4 — Fusion and review

- Hypothesis aggregation.
- Contradiction view.
- Review events.
- Initial maturity calculation.
- Next-best-evidence recommendation.

### Phase 5 — Export and lifecycle

- Structured and text exports.
- Context version history.
- Consent revocation.
- Complete deletion.
- Azure deployment hardening.

## First implementation slice

The first code change after this design is approved must be intentionally narrow:

1. Create the TypeScript workspace.
2. Add the atomic observation JSON Schema.
3. Add a schema validator.
4. Encode feature visibility requirements for the A1 body features.
5. Write a failing test where a below-hip crop attempts to return positive height, hip, gluteal, thigh, leg, and foot observations.
6. Implement domain validation that rejects those positives and accepts explicit `unknown` results.
7. Run the test suite in CI.

No web page, extension content script, Azure resource, or ChatGPT selector is built before this kernel passes.

## Non-goals for the first implementation slice

- Final feature taxonomy.
- Production-ready maturity formula.
- Automated ChatGPT interaction.
- Model-provider abstraction beyond the analysis-surface interface.
- Multi-person image support.
- Video ingestion.
- 3D reconstruction.
- Exact physical measurement estimation.

## Design decisions requiring future product approval

Only these decisions remain product-level rather than implementation-level:

1. Whether a consented adult may share a Soul ID with another Mivora account.
2. Whether user-reviewed synthetic outputs may ever enter a separate non-trusted style-reference pool.
3. Default retention duration for source images and raw ChatGPT responses.

They do not block the evidence-kernel implementation.
