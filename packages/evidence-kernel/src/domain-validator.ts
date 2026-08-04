import { AnalysisEnvelope } from '@mivora/contracts';
import { A1_FEATURE_DEFINITIONS, A1FeatureId } from '@mivora/feature-taxonomy';
import { ValidationIssue } from './index.js';

export function validateDomain(envelope: AnalysisEnvelope): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  envelope.observations.forEach((obs, index) => {
    const featureId = obs.feature_id;

    // Reject unregistered feature identifiers
    if (!(featureId in A1_FEATURE_DEFINITIONS)) {
      issues.push({
        stage: 'domain',
        code: 'unknown_feature_id',
        path: `/observations/${index}`,
        message: `Unknown feature identifier "${featureId}"`,
        feature_id: featureId,
      });
      return;
    }

    const definition = A1_FEATURE_DEFINITIONS[featureId as A1FeatureId];

    // Positive evidence check: 'observed' or 'partially_observed'
    const isPositive = obs.status === 'observed' || obs.status === 'partially_observed';

    if (isPositive) {
      const requiredRegion = definition.required_region;
      const matchingEntry = envelope.visibility_map.find(
        (entry) => entry.region === requiredRegion
      );

      if (!matchingEntry) {
        issues.push({
          stage: 'domain',
          code: 'missing_required_visibility_region',
          path: `/observations/${index}`,
          message: `Required visibility region "${requiredRegion}" is absent from visibility map`,
          feature_id: featureId,
        });
      } else {
        if (!matchingEntry.present) {
          issues.push({
            stage: 'domain',
            code: 'required_region_absent',
            path: `/observations/${index}`,
            message: `Required region "${requiredRegion}" is marked absent`,
            feature_id: featureId,
          });
        }
        if (matchingEntry.visibility < definition.minimum_visibility) {
          issues.push({
            stage: 'domain',
            code: 'visibility_below_threshold',
            path: `/observations/${index}`,
            message: `Visibility of "${requiredRegion}" (${matchingEntry.visibility}) is below feature threshold (${definition.minimum_visibility})`,
            feature_id: featureId,
          });
        }
        if (matchingEntry.reliability < definition.minimum_reliability) {
          issues.push({
            stage: 'domain',
            code: 'reliability_below_threshold',
            path: `/observations/${index}`,
            message: `Reliability of "${requiredRegion}" (${matchingEntry.reliability}) is below feature threshold (${definition.minimum_reliability})`,
            feature_id: featureId,
          });
        }
      }
    }
  });

  return issues;
}
