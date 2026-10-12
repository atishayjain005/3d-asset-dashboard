# 3D Asset Dashboard Improvement Log

## 2026-09-16 hardening pass

Repository: `atishayjain005/3d-asset-dashboard`

Problem: the project had committed local artifacts, a tracked backend `.env`, hard-coded production API URLs, a backend that assumed Supabase was always configured, no backend tests, and stale dependency lockfiles with high-severity audit findings.

Implemented improvements:

- Removed committed `.env`, `.DS_Store`, and `backend/node_modules` artifacts; added root ignore rules plus frontend/backend env examples.
- Added a shared frontend API URL helper powered by `VITE_API_BASE_URL`.
- Restored visible frontend fetch errors and made the initial load cancellation-safe.
- Updated frontend and backend dependency locks until high-severity audit checks passed.
- Added backend `/health`, explicit Supabase configuration reporting, configurable CORS origins, configurable storage bucket, safer upload filenames, metadata update whitelisting, and clearer setup errors.
- Added backend tests for health, missing Supabase config, and CORS rejection behavior.

Validation:

- Backend: `npm test`, `node --check api/index.js`, `npm audit --audit-level=high`.
- Frontend: `npm run lint`, `npm run build`, `npm audit --audit-level=high`.
- Runtime: local backend `/health` returned `ok: true`; `/assets` without Supabase returned `503 SUPABASE_NOT_CONFIGURED`; unexpected browser origin returned `403 CORS_NOT_ALLOWED`.

Known follow-ups:

- Rotate any historical Supabase service key that was previously committed before deploying or reusing this project.
- Add Supabase schema SQL and seed/demo data for reviewers who do not have a Supabase project.
- Consider code-splitting the frontend 3D viewer bundle; the production build is valid but still reports a large chunk warning.
- Add authenticated admin controls before presenting this as a public multi-user asset manager.

## 2026-10-12 portfolio readiness pass

Self-generated idea:

- Repository: `atishayjain005/3d-asset-dashboard`
- Problem: reviewers could land on an empty or broken dashboard when Supabase
  credentials are intentionally absent, and setup still required guessing the
  database schema.
- Proposed improvement: add read-only demo data, split the heavy 3D viewer bundle,
  align frontend/backend upload validation, and document the Supabase schema.
- Reason: the project should demonstrate product polish without exposing secrets
  or requiring paid infrastructure.
- Expected impact: stronger portfolio first impression, clearer setup path, and
  fewer invalid upload failures.
- Complexity: medium.
- Risk: low; changes are additive, reversible, and keep persistent writes behind
  existing Supabase configuration.
- Recommendation: merge after validation; deploy only after rotating any
  historical Supabase service key and setting fresh environment variables.
- Deployment requirement: frontend can deploy in demo mode without secrets;
  persistent upload/edit/delete requires Supabase env vars and the schema in
  `docs/supabase-schema.sql`.

Validation:

- Backend: `npm test`, `node --check api/index.js`, `node --check
  api/assetValidation.js`, `npm audit --audit-level=high`.
- Frontend: `npm run lint`, `npm run build`.
- Frontend audit blocker: `npm audit --audit-level=high` still reports
  Tailwind 3 transitive `braces`/`postcss-selector-parser` advisories. The
  automated fix path requires Tailwind 4, so it is intentionally left as a
  follow-up migration rather than forced into this safe pass.
