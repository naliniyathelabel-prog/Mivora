export const ANALYSIS_ENVELOPE_SCHEMA_VERSION = '0.1.0' as const;

export type ObservationStatus =
  'observed' | 'partially_observed' | 'unknown' | 'unreliable' | 'conflicting' | 'not_applicable';

export interface VisibilityMapEntry {
  region: string;
  present: boolean;
  visibility: number;
  reliability: number;
}

export interface AtomicObservation {
  observation_id?: string;
  soul_id?: string;
  source_asset_id?: string;
  feature_id: string;
  status: ObservationStatus;
  literal_observation: string;
  normalized_value?: Record<string, unknown>;
  source_region?: Record<string, unknown>;
  visibility?: number;
  reliability?: number;
  observation_confidence?: number;
  unknown_reasons?: string[];
  conditions?: Record<string, unknown>;
  distortion_factors?: string[];
  evidence_group_id?: string;
  extractor?: Record<string, unknown>;
  created_at?: string;
}

export interface AnalysisEnvelope {
  schema_version: '0.1.0';
  job_id: string;
  source_asset_id: string;
  image_assessment: {
    overall_quality: number;
    view: string;
    crop: string;
    distortion_factors: string[];
  };
  visibility_map: VisibilityMapEntry[];
  observations: AtomicObservation[];
  warnings: string[];
}
