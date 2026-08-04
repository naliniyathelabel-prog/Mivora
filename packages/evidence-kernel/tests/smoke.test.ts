import { expect, test } from 'vitest';
import { KERNEL_VERSION } from '../src/index.js';

test('kernel smoke test', () => {
  expect(KERNEL_VERSION).toBe('0.1.0');
});
