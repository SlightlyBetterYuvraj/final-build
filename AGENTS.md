# Agent Operating Rules — Mandatory

These rules apply to every implementation step and override convenience-oriented defaults.

## 1. Stability before speed or aesthetics

- Correctness, data integrity, recoverability, and regression safety outrank UI polish, abstractions for their own sake, and rapid feature count.
- Before each meaningful change: inspect current files and dependencies, identify the affected workflows and invariants, plan the smallest safe patch, and note risks.
- After each meaningful change: run the narrowest relevant tests, then the available full test/build/type/lint checks. Fix regressions before proceeding.
- Never claim a check passed unless it was actually run and its result observed.
- Do not rewrite entire files or migrate frameworks to simplify the task when a narrow patch will work.
- Do not silently remove existing behavior, data, tests, migrations, or useful files.

## 2. No invented requirements

- `docs/01_MASTER_PRD.md` and `docs/02_DECISION_REGISTER.md` are the source of truth for approved behavior.
- If a requirement is unresolved, implement a safe configurable boundary or report the blocker; do not invent a university rule.
- Do not add product features merely because they seem useful.
- If implementation requires a technical choice not already approved, choose the smallest reversible option where necessary, record it in `docs/IMPLEMENTATION_DECISIONS.md` (create this file if needed), explain why it was necessary, and include it in the final report under **Agent-made decisions/additions**.
- Never label an agent assumption as a user-approved decision.

## 3. Data integrity and scheduling safety

- PostgreSQL/Supabase is the intended authoritative data store, subject to the feasibility review.
- All mutating operations must be server-authorized and validated against current state.
- A failed operation must leave the previous committed state unchanged.
- Rescheduling must be atomic: either the new slot is committed and the old slot released, or nothing changes.
- Never publish automatically after generation or file import.
- Never accept an uploaded/local-generated draft without canonical current-data validation.
- Never allow a stale-input override to bypass mandatory constraints, required-session completeness, permissions, or transaction safety.
- Prevent concurrent requests from claiming the same incompatible room, teacher, or student time slot. Application-side prechecks alone are insufficient for race safety; use database transactions/locking/constraints or another demonstrated concurrency-safe design.
- Avoid destructive migrations and bulk deletion. Migrations must be additive/reversible where practical and must not drop user data or tables without explicit approval.

## 4. Runtime and architecture honesty

- Inspect the current repo and target runtime first. Do not assume Python runs inside AI Studio's Node.js server runtime.
- Do not claim an external hosted generator is configured unless its URL/credentials exist and an actual request was tested.
- Keep the OR-Tools generator independently runnable on the developer's machine. Hosted execution is attempted first when configured; unavailable/failed hosted execution must lead to an explicit local-fallback workflow, not a fake result.
- The local and hosted generation path must use the same versioned input/output contract and equivalent scheduling rules.
- The backend remains responsible for import validation, authoritative persistence, and publication.

## 5. Credentials and free-tier requirement

- Use placeholders in `.env.example` and documentation only; do not invent valid keys.
- Never place service-role keys, database passwords, or other server secrets in client-side code, generated bundles, logs, or committed files.
- Keep `.env`, credentials, dumps containing sensitive data, and secret files out of Git. Ensure `.gitignore` covers them.
- Prototype cost target is ₹0/month. Do not enable paid plans/resources. Flag any action that could cause charges before doing it.
- Use dummy data before institutional approval.

## 6. Frontend scope for now

- Build the minimum UI needed to exercise backend functionality, display validation errors, show generation/import job status, and demonstrate user role workflows.
- Do not spend time on elaborate animations, complex design systems, maps, or decorative UI.
- Do not simulate success in the UI when backend persistence or validation did not succeed.

## 7. Testing minimum

- Add automated tests for the core scheduling rules and key workflows alongside implementation.
- Include negative tests and edge cases, not only happy paths.
- Test failed transactions, duplicate requests, stale input packages, cross-semester conflicts, one-slot/two-slot room occupancy, import rejection without partial writes, and permissions.
- Do not mark a phase complete while known regression failures remain unexplained.

## 8. Required final report after every agent run

The final response must contain:

1. **What changed** — concise implementation summary.
2. **Files changed** — names and purpose.
3. **Tests actually run** — command and result, including failures or tests not run.
4. **Regressions checked** — affected workflows and results.
5. **Agent-made decisions/additions** — every assumption, extra feature, schema choice, dependency, or behavior invented by the agent; write `None` only if truly none.
6. **Unresolved items/blockers** — especially configuration values or provider limitations.
7. **Environment variables/secrets required** — names only; never reveal secret values.
8. **Manual checks for the user** — exact steps needed.
9. **Risk to existing behavior/data** — state explicitly if any.

Never claim the implementation is complete, production-ready, secure, deployed, backed up, or verified beyond what the run actually demonstrated.

## 9. Client Runtime, Template Escaping & Script Hygiene

- When generating HTML/JavaScript within TypeScript/JavaScript template literals:
  - **Never use multiline regex literals or unescaped newline delimiters** (e.g., `/\r?\n/`). Node/TypeScript template string interpolation converts `\n` to raw newline bytes, which causes `SyntaxError: Invalid regular expression: missing /` and crashes the client runtime.
  - Instead, use explicit string splits or character codes: `split(String.fromCharCode(10)).map(l => l.trim())` or `.split('\n')`.
  - Always verify generated client JavaScript syntax after modifying frontend template code: extract the `<script>` block and validate with `node --check` or a syntax parser.
- **Asset Hygiene:** Always include an inline SVG favicon (`<link rel="icon" href="data:image/svg+xml,...">`) and handle `GET /favicon.ico` with `204 No Content` to prevent console 404 noise.
- **Monolithic UI File Handling:** For large template files (such as `src/api/ui.ts` > 5,000 lines), never read or rewrite the full file end-to-end. Always perform targeted range inspections and narrow anchor-based diff replacements.

## 10. UI Design System & Presentation Standards

- **Zero Emojis:** Never use emoji characters in application UI, status pills, headers, or buttons. Use crisp, inline SVGs with standard stroke widths (e.g., Lucide-style icons).
- **Course Color Coding:** Maintain distinct, accessible pastel/muted color tags per subject/slot for timetable scanning, while preserving clean contrast.
- **Aesthetic Tone:** Prioritize clear, spacious, professional academic layouts. Avoid neon glow gradients, heavy glassmorphism blobs, or unnecessary animation overhead.

