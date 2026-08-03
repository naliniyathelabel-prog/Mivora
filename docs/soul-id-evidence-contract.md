# Soul ID Evidence Contract

**Status:** Initial normative contract  
**Version:** 0.1.0  
**Applies to:** Every image-ingestion, extraction, fusion, scoring, review, export, deletion, and generation-context component in Mivora.

## Purpose

Soul ID is an evidence-backed character context built over time from user-supplied images. This contract defines what the system may record, how it must preserve uncertainty and contradictions, and what it must never infer.

The implementation must treat source observations as durable evidence and the current Soul ID profile as a recalculable interpretation. A profile may change as more evidence arrives; the original observations must not be rewritten to match the latest interpretation.

## Product boundary

Soul ID may process only:

1. Fictional characters.
2. User-created synthetic characters.
3. Explicitly consented adults.

Soul ID must not process:

- Minors or persons whose adult status is uncertain.
- Non-consenting real people.
- Images submitted for identifying, locating, tracking, or matching a person against external databases.
- Images submitted to infer concealed anatomy, medical conditions, ethnicity, religion, sexuality, pregnancy, or other unsupported sensitive attributes.

A real-person Soul ID must have an active consent record before extraction begins. Revoked consent must stop new processing and trigger the configured deletion workflow.

## Normative language

The terms **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** are normative requirements.

## Core entities

### Source asset

An original image supplied by the user. It includes provenance, content hash, capture-session grouping, image dimensions, timestamp when available, and synthetic-versus-real classification.

### Observation

An atomic statement about directly visible evidence in one source asset. An observation must describe only the visible region and must retain its source image, source region, visibility, confidence, conditions, and extractor version.

### Hypothesis

A candidate normalized interpretation supported by one or more observations. Multiple hypotheses may coexist for the same feature.

### Aggregate

A recalculable summary of the currently supported hypotheses for one feature. Aggregates are derived data and may be replaced when evidence or fusion logic changes.

### Contradiction

Two or more observations or hypotheses that cannot currently be reconciled as ordinary view, pose, lighting, styling, temporal, or measurement variation.

### Unknown

A feature for which the available evidence does not support a reliable observation or normalized interpretation.

### Evidence group

A set of dependent assets, such as adjacent video frames, burst photographs, crops of the same image, or exports from one editing session. Evidence from the same group must not be counted as fully independent confirmation.

## Non-negotiable invariants

### 1. Source traceability

Every observation MUST link to:

- One source asset.
- One visible source region or an explicit whole-image scope.
- The extractor and model version that produced it.
- The extraction timestamp.

No profile statement may be marked confirmed unless its supporting observations can be traced back to source assets.

### 2. Literal evidence before interpretation

Every observation MUST retain a literal visible description before any normalized label or measurement is added.

Example:

> Visible upper-thigh silhouette appears moderately broad relative to the visible hip width.

The system may normalize this into a ratio interval, but it must not discard the literal observation.

### 3. No guessing

The extractor MUST NOT create a positive trait observation when the relevant region is:

- Outside the frame.
- Fully occluded.
- Too blurred or compressed.
- Distorted beyond the feature's accepted reliability threshold.
- Covered by clothing that prevents the claimed underlying anatomical conclusion.
- Visible only through shadows, reflections, or ambiguous contours that do not support the claim.

The valid result in these cases is `unknown`, `partially_observed`, or `unreliable`.

### 4. Append-only observations

Accepted observations MUST be append-only.

Corrections, reviewer decisions, or newer extractor versions MUST create a new record that supersedes, rejects, or qualifies the previous observation. They must not silently overwrite or delete the original record.

### 5. Contradictions are preserved

The system MUST retain conflicting observations and their provenance. It MUST NOT average contradictory categorical traits into a fabricated middle value or delete minority evidence solely because another observation appears more often.

### 6. Repetition is not independence

Duplicate, near-duplicate, cropped, edited, or adjacent-frame assets MUST receive reduced or zero additional independence weight.

Ten near-identical frames from one video must not outweigh two clear photographs captured independently from different views.

### 7. Trait temporality is explicit

Every feature definition MUST declare one of:

- `stable_identity`
- `semi_stable`
- `temporary_state`
- `capture_condition`

Semi-stable traits, including body composition, hair length, scars, piercings, and age-related presentation, MUST support time-bounded variants rather than one timeless value.

Temporary state and capture-condition traits MUST NOT rewrite stable identity.

### 8. Synthetic evidence is isolated

Generated, edited, or synthetic images MUST be labelled as synthetic or uncertain-source evidence.

Synthetic outputs produced from Soul ID MUST NOT automatically feed back into trusted Soul ID evidence. They may enter a separate candidate pool only after explicit user review.

### 9. Consent is enforceable

For real adults, consent MUST be:

- Explicit.
- Associated with the Soul ID.
- Revocable.
- Auditable.
- Checked before extraction and before exporting biometric or body-profile data.

### 10. Export and deletion are complete

A user MUST be able to export and delete:

- Source assets.
- Derived observations.
- Hypotheses and aggregates.
- Generated contexts.
- Consent records, subject to the minimum audit evidence legally required.

Deletion completion must be auditable and must include derived stores, caches, embeddings, and queued processing artifacts.

## Observation status vocabulary

Every attempted feature extraction MUST resolve to exactly one primary status:

- `observed`
- `partially_observed`
- `unknown`
- `unreliable`
- `conflicting`
- `not_applicable`

`unknown` is a successful and expected output. It must not be treated as an extractor failure.

## Minimum atomic observation record

Every atomic observation MUST contain at least:

```json
{
  "observation_id": "obs_...",
  "soul_id": "soul_...",
  "source_asset_id": "asset_...",
  "feature_id": "body.upper_thigh.visible_width_ratio",
  "status": "observed",
  "literal_observation": "The visible upper-thigh silhouette is moderately broad relative to the visible hip width.",
  "normalized_value": {
    "kind": "interval",
    "minimum": 0.48,
    "maximum": 0.58,
    "unit": "ratio_to_visible_hip_width"
  },
  "source_region": {
    "kind": "bounding_box",
    "coordinates": [0.31, 0.52, 0.67, 0.91]
  },
  "visibility": 0.73,
  "observation_confidence": 0.55,
  "conditions": {
    "view": "front_three_quarter",
    "pose": "standing",
    "garment": "fitted_trousers",
    "camera_elevation": "approximately_level",
    "occlusion": "partial"
  },
  "distortion_factors": [
    "perspective",
    "garment_compression"
  ],
  "evidence_group_id": "session_...",
  "extractor": {
    "name": "...",
    "version": "..."
  },
  "created_at": "ISO-8601 timestamp"
}
```

A non-observation MUST still retain the attempted feature, source region when available, and reason:

```json
{
  "feature_id": "body.height",
  "status": "unknown",
  "literal_observation": "The body is cropped below the hip and no scale reference is visible.",
  "unknown_reasons": [
    "required_landmarks_outside_frame",
    "no_scale_reference"
  ]
}
```

## Visibility gating

Extraction MUST begin with a visibility map. A specialist extractor may run only when its required region exceeds the feature's minimum visibility and reliability thresholds.

The visibility map SHOULD record:

- Region presence.
- Occlusion percentage.
- Blur.
- Compression.
- Lighting obstruction.
- Garment coverage.
- View angle.
- Landmark availability.
- Estimated lens or perspective distortion.

A downstream model must not reinterpret an unavailable region as available merely because it can produce a plausible answer.

## Feature classes

### Stable identity

Examples include:

- Face geometry and proportions.
- Eye, nose, jaw, chin, and ear structure.
- Hairline.
- Persistent marks when repeatedly supported.
- Skeletal and limb proportions when reliably observed.
- Stable asymmetries.

### Semi-stable

Examples include:

- Body weight and fat distribution.
- Visible chest, waist, hip, gluteal, and thigh morphology.
- Hair length and colour treatment.
- Skin condition.
- Scars, tattoos, and piercings.
- Apparent age presentation.

Semi-stable features MUST carry observation time and MAY form multiple timeline periods.

### Temporary state

Examples include:

- Expression.
- Gaze.
- Pose.
- Body compression while sitting or bending.
- Makeup.
- Clothing.
- Hairstyle arrangement.
- Muscle flexion.

### Capture condition

Examples include:

- Lighting.
- Camera position.
- Focal length or perspective estimate.
- Crop.
- Motion blur.
- Compression.
- Colour processing.

## Body morphology rules

Soul ID MAY record adult body morphology when it is directly visible and within the product boundary.

The system MUST:

- Use neutral anatomical or visual-silhouette terminology.
- Distinguish garment-visible silhouette from underlying anatomy.
- Record view, pose, garment, compression, and perspective conditions.
- Prefer relative ratios and uncertainty intervals over unsupported absolute measurements.
- Keep front, profile, rear, and three-quarter evidence separate until multi-view fusion is justified.
- Preserve time-bounded body variants when morphology changes.

The system MUST NOT:

- Infer concealed anatomy through clothing.
- Convert a clothed silhouette into exact intimate measurements.
- Assign exact height, circumference, cup size, or other physical measurements without calibrated scale evidence.
- Treat sitting, bending, compression, lens distortion, or garment structure as stable anatomy.
- Sexualize the observation language.

## Hypothesis and contradiction handling

For each feature, the fusion layer MUST evaluate disagreement in this order:

1. Capture-condition variation.
2. Pose or expression variation.
3. Styling or garment variation.
4. Temporal change.
5. Extractor uncertainty or image-quality failure.
6. Unresolved contradiction.

If disagreement is explained by conditions, the system MUST retain condition-specific variants.

If disagreement remains unresolved, the aggregate MUST expose competing hypotheses with support weights and source counts. It must not present one value as confirmed.

Example:

```json
{
  "feature_id": "hair.natural_colour",
  "status": "conflicting",
  "hypotheses": [
    {
      "value": "very_dark_brown",
      "support_weight": 6.8,
      "independent_evidence_groups": 4
    },
    {
      "value": "black",
      "support_weight": 4.1,
      "independent_evidence_groups": 3
    }
  ],
  "interpretation": "Very dark brown hair that frequently appears black under low illumination.",
  "interpretation_confidence": 0.72
}
```

## Evidence weighting

Observation support MUST consider at least:

```text
support_weight =
  visibility
  × image_quality
  × pose_suitability
  × scale_reliability
  × extractor_reliability
  × evidence_independence
  × temporal_relevance
```

The exact fusion algorithm may evolve, but it MUST satisfy these properties:

- No single factor may convert unavailable evidence into positive evidence.
- Duplicate evidence must have diminishing or zero marginal weight.
- Clear feature-appropriate views must outweigh poor or irrelevant views.
- Minority evidence must remain inspectable.
- Weight changes caused by algorithm revisions must be reproducible from stored observations.

## Soul ID maturity

The primary UI indicator MUST be called **Soul ID Maturity**, not accuracy.

Maturity represents evidence completeness and reliability, not certainty that the system has reconstructed a person's true anatomy.

The UI MUST expose at least:

- Coverage.
- Confidence.
- View diversity.
- Evidence independence.
- Category-level maturity.

Uploading duplicate images MUST NOT materially increase maturity.

A high face score must not hide missing full-body, profile, hand, foot, or scale evidence. Category-level scores must remain visible.

## Prompt-ready character context

The generation context is derived data and MUST be reproducible from the evidence graph.

It MUST separate:

- `confirmed`
- `probable`
- `conditioned_variants`
- `temporal_variants`
- `contradictions`
- `unknown`
- `negative_identity_constraints`

Only strongly supported stable traits may become hard generation constraints. Probable and condition-dependent traits must remain soft or shot-specific constraints.

Unknown features must not be filled and then promoted into canonical identity without new trusted evidence.

## Human review

Users MUST be able to inspect each aggregate's supporting images and observations.

A reviewer MAY:

- Accept an observation.
- Reject an observation.
- Mark it as ambiguous.
- Correct its normalized interpretation while preserving the literal observation.
- Group observations as the same temporal or conditional variant.

Every review action MUST be recorded as an auditable event rather than silently mutating historical evidence.

## Versioning and reproducibility

The system MUST version:

- Feature taxonomy.
- Observation schema.
- Extractor prompts and models.
- Visibility thresholds.
- Fusion algorithm.
- Maturity calculation.
- Generated-context compiler.

Reprocessing with a new version must produce new derived records. Historical outputs must remain explainable from the versions used at the time.

## Security baseline

Source images and derived biometric or body-profile data MUST be treated as sensitive data.

The implementation MUST provide:

- Encryption in transit and at rest.
- Tenant and Soul ID access isolation.
- Least-privilege service access.
- Audit logging for reads, writes, exports, and deletion.
- Configurable retention.
- Secret-free logs and error messages.
- No use of Soul ID data for model training without separate explicit permission.

## Initial acceptance tests

### A1 — Cropped lower body produces unknown

**Given** an image in which the subject is cropped below the hip,  
**When** the extractor evaluates height, hip, gluteal, thigh, leg, and foot features,  
**Then** it MUST create no positive observations for unavailable regions,  
**And** it MUST return `unknown` with source-specific reasons for each unavailable feature.

This is the first executable acceptance test for the project.

### A2 — Occluded facial feature is not reconstructed

**Given** an eye is fully hidden by hair or an opaque object,  
**When** eye structure extraction runs,  
**Then** the hidden eye MUST be `unknown` or `partially_observed`,  
**And** symmetry from the visible eye MUST NOT be used as source evidence for the hidden eye.

### A3 — Conflicting clear observations are preserved

**Given** two independent, high-quality images support incompatible values for the same feature,  
**When** fusion cannot explain the difference through conditions or time,  
**Then** both hypotheses MUST remain stored,  
**And** the aggregate MUST be `conflicting` rather than silently selecting or averaging them.

### A4 — Duplicate frames do not inflate confidence

**Given** one independent photograph and twenty adjacent frames from one video,  
**When** all assets support the same feature value,  
**Then** the twenty frames MUST be grouped as dependent evidence,  
**And** their combined independence contribution MUST remain substantially below twenty independent photographs.

### A5 — Generated images are not trusted evidence

**Given** Mivora generates an image from an existing Soul ID,  
**When** that image is saved,  
**Then** it MUST be classified as synthetic output,  
**And** it MUST NOT update trusted Soul ID aggregates automatically.

### A6 — Garment-visible morphology remains qualified

**Given** a body region is visible only through loose or structured clothing,  
**When** morphology extraction runs,  
**Then** the observation MAY describe the garment-visible silhouette,  
**But** it MUST NOT claim exact underlying anatomy or measurements.

### A7 — Consent revocation stops processing

**Given** a real adult revokes consent,  
**When** any new extraction or export is requested,  
**Then** processing MUST be denied,  
**And** the deletion workflow MUST cover source assets, derived records, embeddings, caches, and pending jobs.

## First implementation gate

No production extractor, confidence percentage, or Soul ID prompt compiler should be built until:

1. An atomic observation JSON Schema implements this contract.
2. Acceptance test A1 exists and fails against an extractor that guesses cropped features.
3. The persistence design can retain append-only observations and recalculable aggregates separately.
4. Consent and source-type gates exist at ingestion.

Architecture, cloud services, and model vendors must be selected only after these invariants are represented in tests and data contracts.
