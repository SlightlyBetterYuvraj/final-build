# Security, Configuration and Operations

## 1. Prototype operating rules

- Target zero monthly cost. Use provider free tiers only; do not click through any action that enables paid billing/resources without explicit user approval.
- Use synthetic/dummy university data until formal university approval.
- Keep development/staging isolated from any future production environment.
- Assume free-tier services may sleep, pause, throttle, impose request/compute limits or lack backups/workers. Test and disclose these limitations.

## 2. Secrets and API keys

- Create `.env.example` with names and placeholders only, such as `SUPABASE_URL=https://YOUR-PROJECT.supabase.co`, `SUPABASE_ANON_KEY=REPLACE_ME`, `SUPABASE_SERVICE_ROLE_KEY=REPLACE_ME_SERVER_ONLY`, `GENERATOR_SERVICE_URL=`, `GENERATOR_SERVICE_TOKEN=REPLACE_ME`, and `APP_ENV=development`.
- Do not invent valid API keys. `REPLACE_ME` values must fail clearly and must not silently enable a fake success path.
- Never put a service-role key, database password, generator token, or other server secret in client-side code or `VITE_*`/public variables.
- Add `.env`, `.env.*` except `.env.example`, local data dumps, key files and private generated packages to `.gitignore`.
- Keep provider secrets in the platform's server-side secret panel/environment configuration.
- Log only safe identifiers/status, never tokens/passwords/full credentials.
- AI Studio's official docs describe server-side secret injection for Gemini API calls; external keys must also be stored in server-side secrets, not the browser. Reference: https://ai.google.dev/gemini-api/docs/aistudio-build-mode

## 3. Authentication and authorization

- Authorization is checked on every server operation; the client role display is not a trusted source.
- Use the chosen auth provider to verify university email and provide password recovery.
- Role assignment is admin-only.
- The app must reject missing/malformed authentication and handle expired sessions safely.
- Do not build custom password storage unless the chosen provider requires it and the design is explicitly reviewed.
- If Supabase is used, enable and test RLS on every exposed table where appropriate; grant only necessary operations. Server-only service credentials must not be sent to the browser.

## 4. File transfer security

- Input packages/draft uploads have schema version, package ID, revision/hash and generator version metadata.
- Enforce maximum file size/record counts (choose reasonable reversible implementation limits, document them).
- Parse files defensively; do not execute content from uploads.
- Reject malformed, wrong-version or incomplete files with actionable errors.
- Treat uploaded content as untrusted. All references/IDs must be looked up from authoritative current data.
- Stale-package override is admin-only and audited; validation cannot be bypassed.

## 5. Data and migration protection

- No destructive reset scripts as part of initial implementation.
- No `DROP TABLE`, `TRUNCATE`, automatic purge, or overwriting published data unless a separately reviewed explicit approved operation requires it.
- Prefer additive migrations, backup/rollback notes, staging testing and explicit verification.
- Never apply schema-changing migrations directly to a real production database as an unreviewed agent action.
- Database transaction errors must roll back all related writes.

## 6. Audit and notification operations

- Log privileged actions and schedule changes with actor, time, entity, outcome and correlation ID.
- Keep audit event content free from secrets.
- Use a transactionally persisted notification/outbox event or an equivalent recoverable method so a process crash between commit and notification does not silently lose notices.
- Notification retry must be idempotent and must not create duplicate logical events.
- Only affected students receive schedule-change notices.

## 7. Backups and recovery

- Define a documented backup and restore process that is achievable under current free-tier limits.
- Do not claim automated backups/PITR are enabled unless confirmed in the selected plan/settings and tested.
- Before production use, test restoration into an isolated environment and document RPO/RTO limitations; actual targets are not yet specified by the university.
- Timetable version history is not a substitute for database backups.

## 8. Observability and failure handling

- Return useful error codes/messages while avoiding internal stack traces to end users.
- Record generation start, finish, failure category, input revision and diagnostics.
- Distinguish failed/infeasible/timeout/unavailable from success.
- Show hosted generator unavailable when unconfigured or unreachable.
- Keep local fallback instructions available; never treat a timeout as a successful empty schedule.
- Preserve prior published timetable state when any generation/import/publication operation fails.
