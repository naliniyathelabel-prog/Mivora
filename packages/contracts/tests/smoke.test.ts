import { expect, test } from 'vitest';
import { CONTRACT_VERSION } from '../src/index.js';

test('contracts smoke test', () => {
  expect(CONTRACT_VERSION).toBe('0.1.0');
});
