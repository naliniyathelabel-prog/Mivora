import { expect, test } from 'vitest';
import { validateAnalysisEnvelope } from '../src/index.js';

test('Schema rejects unknown without unknown_reasons', () => {
  const envelope = {
    schema_version: '0.1.0',
    job_id: 'job_123',
    source_asset_id: 'asset_456',
    image_assessment: {
      overall_quality: 0.8,
      view: 'front',
      crop: 'below_hip',
      distortion_factors: [],
    },
    visibility_map: [],
    observations: [
      {
        feature_id: 'body.height',
        status: 'unknown',
        literal_observation: 'The body is cropped below the hip and no scale reference is visible.',
        // missing unknown_reasons
      },
    ],
    warnings: [],
  };

  const result = validateAnalysisEnvelope(envelope);
  expect(result.ok).toBe(false);
  if (!result.ok) {
    const isSchemaStage = result.issues.some((issue) => issue.stage === 'schema');
    expect(isSchemaStage).toBe(true);
  }
});

test('Schema rejects a confidence/visibility value outside 0..1', () => {
  const envelope = {
    schema_version: '0.1.0',
    job_id: 'job_123',
    source_asset_id: 'asset_456',
    image_assessment: {
      overall_quality: 1.5, // invalid
      view: 'front',
      crop: 'below_hip',
      distortion_factors: [],
    },
    visibility_map: [],
    observations: [],
    warnings: [],
  };

  const result = validateAnalysisEnvelope(envelope);
  expect(result.ok).toBe(false);
  if (!result.ok) {
    const isSchemaStage = result.issues.some((issue) => issue.stage === 'schema');
    expect(isSchemaStage).toBe(true);
  }
});

test('Domain validation rejects an unregistered feature identifier', () => {
  const envelope = {
    schema_version: '0.1.0',
    job_id: 'job_123',
    source_asset_id: 'asset_456',
    image_assessment: {
      overall_quality: 0.8,
      view: 'front',
      crop: 'below_hip',
      distortion_factors: [],
    },
    visibility_map: [],
    observations: [
      {
        feature_id: 'body.unregistered.feature',
        status: 'unknown',
        literal_observation: 'Some statement about an unregistered feature.',
        unknown_reasons: ['no_scale_reference'],
      },
    ],
    warnings: [],
  };

  const result = validateAnalysisEnvelope(envelope);
  expect(result.ok).toBe(false);
  if (!result.ok) {
    const unregisteredIssue = result.issues.find((issue) => issue.code === 'unknown_feature_id');
    expect(unregisteredIssue).toBeDefined();
    expect(unregisteredIssue?.stage).toBe('domain');
  }
});

test('Domain validation accepts a positive observation when its required region meets both thresholds', () => {
  const envelope = {
    schema_version: '0.1.0',
    job_id: 'job_123',
    source_asset_id: 'asset_456',
    image_assessment: {
      overall_quality: 0.8,
      view: 'front',
      crop: 'below_hip',
      distortion_factors: [],
    },
    visibility_map: [
      {
        region: 'body.full',
        present: true,
        visibility: 0.8,
        reliability: 0.7,
      },
    ],
    observations: [
      {
        feature_id: 'body.height',
        status: 'observed',
        literal_observation: 'The subject height is directly visible and tall.',
        source_region: {
          kind: 'bounding_box',
          coordinates: [0.1, 0.1, 0.9, 0.9],
        },
      },
    ],
    warnings: [],
  };

  const result = validateAnalysisEnvelope(envelope);
  expect(result.ok).toBe(true);
});
