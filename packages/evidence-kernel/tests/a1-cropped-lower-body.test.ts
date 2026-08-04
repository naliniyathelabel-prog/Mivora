import { expect, test } from 'vitest';
import { validateAnalysisEnvelope } from '../src/index.js';

test('A1 failing fixture - positive lower-body observations for below_hip crop are rejected by domain validation', () => {
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
        present: false,
        visibility: 0.0,
        reliability: 0.0,
      },
      {
        region: 'body.hips',
        present: false,
        visibility: 0.0,
        reliability: 0.0,
      },
      {
        region: 'body.gluteal',
        present: false,
        visibility: 0.0,
        reliability: 0.0,
      },
      {
        region: 'body.upper_thigh',
        present: false,
        visibility: 0.0,
        reliability: 0.0,
      },
      {
        region: 'body.legs',
        present: false,
        visibility: 0.0,
        reliability: 0.0,
      },
      {
        region: 'body.feet',
        present: false,
        visibility: 0.0,
        reliability: 0.0,
      },
    ],
    observations: [
      {
        feature_id: 'body.height',
        status: 'observed',
        literal_observation: 'The subject height appears tall.',
        source_region: {
          kind: 'bounding_box',
          coordinates: [0.0, 0.0, 1.0, 1.0],
        },
      },
      {
        feature_id: 'body.hip.visible_width_ratio',
        status: 'partially_observed',
        literal_observation: 'Hips look wide.',
        source_region: {
          kind: 'bounding_box',
          coordinates: [0.0, 0.0, 1.0, 1.0],
        },
      },
      {
        feature_id: 'body.gluteal.visible_morphology',
        status: 'observed',
        literal_observation: 'Gluteal curves are prominent.',
        source_region: {
          kind: 'bounding_box',
          coordinates: [0.0, 0.0, 1.0, 1.0],
        },
      },
      {
        feature_id: 'body.upper_thigh.visible_width_ratio',
        status: 'partially_observed',
        literal_observation: 'Upper thigh ratio is substantial.',
        source_region: {
          kind: 'bounding_box',
          coordinates: [0.0, 0.0, 1.0, 1.0],
        },
      },
      {
        feature_id: 'body.leg.visible_proportion',
        status: 'observed',
        literal_observation: 'Leg proportions seem standard.',
        source_region: {
          kind: 'bounding_box',
          coordinates: [0.0, 0.0, 1.0, 1.0],
        },
      },
      {
        feature_id: 'body.foot.visible_structure',
        status: 'partially_observed',
        literal_observation: 'Foot structure is visible.',
        source_region: {
          kind: 'bounding_box',
          coordinates: [0.0, 0.0, 1.0, 1.0],
        },
      },
    ],
    warnings: [],
  };

  const result = validateAnalysisEnvelope(envelope);

  expect(result.ok).toBe(false);

  if (!result.ok) {
    const issueFeatures = result.issues.map((i) => i.feature_id);
    const expectedFeatures = [
      'body.height',
      'body.hip.visible_width_ratio',
      'body.gluteal.visible_morphology',
      'body.upper_thigh.visible_width_ratio',
      'body.leg.visible_proportion',
      'body.foot.visible_structure',
    ];

    for (const feat of expectedFeatures) {
      expect(issueFeatures).toContain(feat);
    }

    for (const issue of result.issues) {
      expect(issue.stage).toBe('domain');
      expect([
        'required_region_absent',
        'visibility_below_threshold',
        'reliability_below_threshold',
      ]).toContain(issue.code);
    }
  }
});

test('A1 valid unknown fixture - returns unknown observation for each A1 feature with explicit reasons', () => {
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
        present: false,
        visibility: 0.0,
        reliability: 0.0,
      },
      {
        region: 'body.hips',
        present: false,
        visibility: 0.0,
        reliability: 0.0,
      },
      {
        region: 'body.gluteal',
        present: false,
        visibility: 0.0,
        reliability: 0.0,
      },
      {
        region: 'body.upper_thigh',
        present: false,
        visibility: 0.0,
        reliability: 0.0,
      },
      {
        region: 'body.legs',
        present: false,
        visibility: 0.0,
        reliability: 0.0,
      },
      {
        region: 'body.feet',
        present: false,
        visibility: 0.0,
        reliability: 0.0,
      },
    ],
    observations: [
      {
        feature_id: 'body.height',
        status: 'unknown',
        literal_observation: 'The body is cropped below the hip and no scale reference is visible.',
        unknown_reasons: ['no_scale_reference'],
      },
      {
        feature_id: 'body.hip.visible_width_ratio',
        status: 'unknown',
        literal_observation: 'The body is cropped below the hip.',
        unknown_reasons: ['required_region_outside_frame'],
      },
      {
        feature_id: 'body.gluteal.visible_morphology',
        status: 'unknown',
        literal_observation: 'Gluteal region is not visible in front view.',
        unknown_reasons: ['required_landmarks_outside_frame'],
      },
      {
        feature_id: 'body.upper_thigh.visible_width_ratio',
        status: 'unknown',
        literal_observation: 'Thigh region is cropped.',
        unknown_reasons: ['required_region_outside_frame'],
      },
      {
        feature_id: 'body.leg.visible_proportion',
        status: 'unknown',
        literal_observation: 'Legs are not in the frame.',
        unknown_reasons: ['required_region_outside_frame'],
      },
      {
        feature_id: 'body.foot.visible_structure',
        status: 'unknown',
        literal_observation: 'Feet are not in the frame.',
        unknown_reasons: ['required_region_outside_frame'],
      },
    ],
    warnings: [],
  };

  const result = validateAnalysisEnvelope(envelope);
  expect(result.ok).toBe(true);
});
