export const A1_FEATURE_IDS = [
  'body.height',
  'body.hip.visible_width_ratio',
  'body.gluteal.visible_morphology',
  'body.upper_thigh.visible_width_ratio',
  'body.leg.visible_proportion',
  'body.foot.visible_structure',
] as const;

export type A1FeatureId = (typeof A1_FEATURE_IDS)[number];

export interface FeatureDefinition {
  feature_id: A1FeatureId;
  temporality: 'stable_identity' | 'semi_stable' | 'temporary_state' | 'capture_condition';
  required_region: string;
  minimum_visibility: number;
  minimum_reliability: number;
}

export const A1_FEATURE_DEFINITIONS: Record<A1FeatureId, FeatureDefinition> = {
  'body.height': {
    feature_id: 'body.height',
    temporality: 'semi_stable',
    required_region: 'body.full',
    minimum_visibility: 0.6,
    minimum_reliability: 0.6,
  },
  'body.hip.visible_width_ratio': {
    feature_id: 'body.hip.visible_width_ratio',
    temporality: 'semi_stable',
    required_region: 'body.hips',
    minimum_visibility: 0.6,
    minimum_reliability: 0.6,
  },
  'body.gluteal.visible_morphology': {
    feature_id: 'body.gluteal.visible_morphology',
    temporality: 'semi_stable',
    required_region: 'body.gluteal',
    minimum_visibility: 0.6,
    minimum_reliability: 0.6,
  },
  'body.upper_thigh.visible_width_ratio': {
    feature_id: 'body.upper_thigh.visible_width_ratio',
    temporality: 'semi_stable',
    required_region: 'body.upper_thigh',
    minimum_visibility: 0.6,
    minimum_reliability: 0.6,
  },
  'body.leg.visible_proportion': {
    feature_id: 'body.leg.visible_proportion',
    temporality: 'semi_stable',
    required_region: 'body.legs',
    minimum_visibility: 0.6,
    minimum_reliability: 0.6,
  },
  'body.foot.visible_structure': {
    feature_id: 'body.foot.visible_structure',
    temporality: 'semi_stable',
    required_region: 'body.feet',
    minimum_visibility: 0.6,
    minimum_reliability: 0.6,
  },
};
