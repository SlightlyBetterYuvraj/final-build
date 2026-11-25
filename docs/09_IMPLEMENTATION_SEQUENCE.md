# Implementation Sequence — Logic First, UI Minimal

This is the safe recommended implementation order. The coding agent must first inspect the repository and runtime, then adapt the steps without violating approved requirements.

## Phase 0 — Repository and runtime audit (no broad edits)

- Inventory all files, frameworks, dependencies, scripts, environment assumptions and existing tests.
- Inspect how AI Studio Build mode's actual current server runtime is wired. Do not assume it supports Python execution.
- Identify existing database schema/auth setup if present.
- Run current build/type/lint/tests and record baseline failures before editing.
- Write an architecture proposal for review into `docs/IMPLEMENTATION_DECISIONS.md` or a report in the agent run output. Distinguish existing approved decisions from necessary agent-made technical choices.
- Do not replace the project skeleton unless there is a demonstrated blocker.

## Phase 1 — Domain rules and test harness

- Implement typed domain structures and validation functions for class types, duration, periods, rooms, teacher/room/student/group conflicts, effective-dated memberships and required-session completeness.
- Centralize constraints rather than copying slightly different checks into UI components.
- Add deterministic unit fixtures for one-slot classes, two-consecutive-slot labs, room compatibility, section-vs-batch overlap, electives and cross-semester resource conflicts.
- Make odd practical-hour total fail as unresolved configuration rather than invent conversion.
- Keep UI minimal or absent during this phase.

## Phase 2 — Data persistence and authorization

- Implement/authenticate through the selected auth provider and server-side role checks.
- Implement safe schema/migrations without destructive resets.
- Implement transaction-safe operations and conflict prevention for concurrency.
- Add database integration tests or reproducible verification scripts.
- If the repository/runtime cannot support the approved intended DB access pattern, report the blocker instead of adding insecure client writes.

## Phase 3 — Regular class operations

- Cancel dated occurrence with optional reason.
- Atomic reschedule.
- Change room/teacher as permitted.
- Audit records and post-commit notification/outbox events.
- Regression tests proving the recurring pattern and other dates stay intact.

## Phase 4 — Extra classes and availability

- Available-slot query with cancellation-freed slots ranked first.
- Extra-class booking/cancel/reschedule with target group, room, capacity, class type and ownership checks.
- Teacher unavailability requests, admin confirmation, impact listing and explicit resolution workflows.
- Test teacher/admin permissions and concurrent booking races.

## Phase 5 — Generation contract and solver

- Create versioned generation input/output schemas.
- Create complete input package export with revision/hash/manifest.
- Implement standalone Python generator/OR-Tools integration only after confirming dependencies work in the target local environment.
- Run a tiny example then a representative synthetic dataset. Record solver runtime and infeasibility diagnostics.
- Keep solver outputs draft-only.
- Implement configured hosted-generation adapter with timeout, status and unavailable semantics. If endpoint is not configured, make that visible.
- Local runner consumes exactly the same package and writes exactly the same draft schema.

## Phase 6 — Draft import, stale detection and publication

- Validate upload format/size/schema/version.
- Compare generation input revision with current data.
- Warn on stale package; allow only authorized audited override and still run every mandatory check.
- Make draft save all-or-nothing.
- Implement full validation before publishing and atomic version switch.
- Preserve prior version and audit history; failure leaves current published version untouched.

## Phase 7 — Minimal workflow UI

Only after the core operations work:
- basic authentication and role-directed views;
- admin data tables/forms/import preview;
- generation status, diagnostics, download input package, draft upload/review/publish;
- teacher timetable, cancellation/reschedule, extra-class booking and unavailability request;
- student timetable/status/location/inbox;
- simple clear errors and loading states.

Do not spend early phases on visual polish. Every visible success state must reflect a real backend result.

## Phase 8 — Regression, pitch readiness, handoff

- Run acceptance suite and full available build/type/lint checks.
- Check secrets and `.gitignore`.
- Confirm dummy data only and no paid services enabled.
- Demonstrate generation hosted-first and local fallback if hosted service is unavailable.
- Demonstrate no auto-publication, stale override restrictions, concurrency validation and failed-operation rollback.
- Produce run report with tests, assumptions/additions, unresolved items, provider limitations and manual test steps.

## Completion rule

Do not call the product ready merely because all phases have files. Each completed workflow needs passing tests and an honest report of what was actually run.
