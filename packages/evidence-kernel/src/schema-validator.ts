import Ajv from 'ajv';
import type { ErrorObject } from 'ajv';
import fs from 'node:fs';
import { ValidationIssue } from './index.js';

const schemaPath = new URL(
  '../../contracts/schemas/analysis-envelope.schema.json',
  import.meta.url
);
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

interface AjvConstructor {
  new (options?: Record<string, unknown>): {
    compile(schema: unknown): {
      (candidate: unknown): boolean;
      errors?: ErrorObject[] | null;
    };
  };
}

const ajv = new (Ajv as unknown as AjvConstructor)({ allErrors: true });
const validate = ajv.compile(schema);

export function validateSchema(
  candidate: unknown
): { ok: true; value: unknown } | { ok: false; issues: ValidationIssue[] } {
  const valid = validate(candidate);
  if (valid) {
    return { ok: true, value: candidate };
  }

  const issues: ValidationIssue[] = (validate.errors || []).map((err: ErrorObject) => {
    let feature_id: string | undefined;
    if (
      err.instancePath.startsWith('/observations/') &&
      typeof candidate === 'object' &&
      candidate !== null
    ) {
      const parts = err.instancePath.split('/');
      const indexStr = parts[2];
      if (indexStr !== undefined) {
        const index = parseInt(indexStr, 10);
        const candidateObj = candidate as { observations?: unknown[] };
        const observations = candidateObj.observations;
        if (Array.isArray(observations)) {
          const obs = observations[index] as { feature_id?: string } | undefined;
          if (obs && typeof obs.feature_id === 'string') {
            feature_id = obs.feature_id;
          }
        }
      }
    }

    return {
      stage: 'schema',
      code: err.keyword,
      path: err.instancePath,
      message: err.message || 'Schema validation failed',
      ...(feature_id ? { feature_id } : {}),
    };
  });

  return { ok: false, issues };
}
