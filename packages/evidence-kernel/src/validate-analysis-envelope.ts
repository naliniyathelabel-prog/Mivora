import { AnalysisEnvelope } from '@mivora/contracts';
import { validateSchema } from './schema-validator.js';
import { validateDomain } from './domain-validator.js';

export interface ValidationIssue {
  stage: 'schema' | 'domain';
  code: string;
  path: string;
  message: string;
  feature_id?: string;
}

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; issues: ValidationIssue[] };

export function validateAnalysisEnvelope(candidate: unknown): ValidationResult<AnalysisEnvelope> {
  // 1. JSON Schema validation
  const schemaResult = validateSchema(candidate);
  if (!schemaResult.ok) {
    return { ok: false, issues: schemaResult.issues };
  }

  const envelope = schemaResult.value as AnalysisEnvelope;

  // 2 & 3. Feature-taxonomy lookup & Visibility/reliability domain validation
  const domainIssues = validateDomain(envelope);
  if (domainIssues.length > 0) {
    return { ok: false, issues: domainIssues };
  }

  return { ok: true, value: envelope };
}
