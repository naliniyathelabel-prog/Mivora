import { expect, test } from 'vitest';
import { TAXONOMY_VERSION } from '../src/index.js';

test('taxonomy smoke test', () => {
  expect(TAXONOMY_VERSION).toBe('0.1.0');
});
