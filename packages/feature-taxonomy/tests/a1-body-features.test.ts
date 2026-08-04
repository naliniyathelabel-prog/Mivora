import { expect, test } from 'vitest';
import { A1_FEATURE_IDS, A1_FEATURE_DEFINITIONS } from '../src/index.js';

test('all A1 identifiers are unique and thresholds are within 0..1', () => {
  // Check uniqueness of A1_FEATURE_IDS
  const idSet = new Set(A1_FEATURE_IDS);
  expect(idSet.size).toBe(A1_FEATURE_IDS.length);

  // Check definitions
  for (const id of A1_FEATURE_IDS) {
    const def = A1_FEATURE_DEFINITIONS[id];
    expect(def).toBeDefined();
    expect(def.feature_id).toBe(id);

    // Verify temporality
    expect(def.temporality).toBe('semi_stable');

    // Verify minimum visibility
    expect(def.minimum_visibility).toBeGreaterThanOrEqual(0);
    expect(def.minimum_visibility).toBeLessThanOrEqual(1);

    // Verify minimum reliability
    expect(def.minimum_reliability).toBeGreaterThanOrEqual(0);
    expect(def.minimum_reliability).toBeLessThanOrEqual(1);
  }
});
