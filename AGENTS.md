# Human and Agent Contributor Rules

This document outlines the repository-wide rules for human and Jules contributors to ensure consistency and quality across the Mivora project.

## Critical Instructions

1. **Read Core Specification Documents First**
   - You MUST read and adhere to `docs/soul-id-evidence-contract.md` and `docs/superpowers/specs/2026-08-03-soul-id-system-architecture.md` before making any domain-specific implementations.

2. **Strict TypeScript Mode**
   - The entire codebase MUST use strict TypeScript mode. No loose type annotations or `any` bypasses without strict, explicit review.

3. **Preserve Append-Only Evidence Semantics**
   - Historical observations, once accepted, MUST be append-only. Newer data or corrections must create new records instead of overwriting historical raw data.

4. **Never Infer Invisible Character Traits**
   - Maintain a literal, visible description before normalizing. If a feature is occluded or not fully visible, resolve to `unknown`, `partially_observed`, or `unreliable`.

5. **Do Not Modify Production / Deploy / Migrate**
   - Contributors MUST NOT merge code directly to main, deploy to Vercel/Supabase, migrate production databases, or alter live systems.

6. **Do Not Broaden Task Scope**
   - Stay strictly within the scope of the assigned task/wave. Do not implement unnecessary abstractions, systems, or providers.

7. **Respect Declared File Ownership**
   - Respect file-specific scopes. Only edit files owned by your active task.

8. **Strict Lockfile Ownership**
   - Do NOT edit or regenerate `pnpm-lock.yaml` unless your specific task explicitly owns or requires dependency updates.

9. **Write Tests First or Alongside Implementation**
   - Always practice proactive testing. Implement and run unit/integration tests to verify functionality before finalizing.

10. **Verify Everything Locally**
    - You MUST run `pnpm verify` (which formats, lints, typechecks, and tests the workspace) successfully before claiming completion.

11. **Focused Submissions**
    - Publish exactly one focused Pull Request. The description must specify the exact base SHA, head SHA, and verification evidence.
