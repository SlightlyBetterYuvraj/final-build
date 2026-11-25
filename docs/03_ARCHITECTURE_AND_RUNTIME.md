# Architecture and Runtime Feasibility

**Status:** Candidate architecture, not a final hosting-provider approval. The implementation agent must confirm what the existing AI Studio project/runtime actually supports.

## 1. Platform fact to respect

Google AI Studio Build Mode's current official documentation describes a full-stack web app with a React client and Node.js server runtime. Its Android build path is a separate native Kotlin/Jetpack Compose, client-side project. Do not assume that a Python/OR-Tools executable can run inside the AI Studio Node server. Official reference: https://ai.google.dev/gemini-api/docs/aistudio-build-mode

This makes runtime boundaries important: the solver must be kept independently runnable, rather than mixed into browser code or falsely treated as an available Node subprocess.

## 2. Logical architecture

1. **Web client** — minimal React/TypeScript screens for student/teacher/admin workflows, status, uploads and validation messages.
2. **Trusted application API** — server-side code for authentication checks, permissions, current-data validation, transactional mutations, draft imports, publication, and audit records.
3. **Authoritative database** — PostgreSQL/Supabase is the intended candidate. The exact integration must be checked against the available runtime and free-tier constraints.
4. **Scheduling engine** — standalone Python package using OR-Tools CP-SAT, subject to a feasibility spike. It reads a versioned input package and returns a structured draft plus diagnostics. It does not publish or directly overwrite authoritative data.
5. **Hosted execution adapter** — optional network call to a configured hosted generator. A blank URL or failed request is a clear unavailable condition, not a simulated success.
6. **Local fallback** — same Python generator runs on the developer's machine against the downloaded package, exports the same format, and returns through the authenticated draft-import endpoint.
7. **Notification delivery** — after-commit mechanism, preferably persisted as an outbox/job before delivery so a transient provider failure does not cause lost or duplicate logical events.

## 3. Provisional implementation shape

- Keep web/API code compatible with AI Studio's actual supported runtime, likely TypeScript/Node for the server-side portion if starting a new AI Studio web project.
- Keep the solver isolated under a distinct directory/package, e.g. `generator/`, using Python and OR-Tools if the feasibility spike confirms the dependency and environment work.
- Define a versioned JSON schema for generation input and draft output. Both hosted and local solver execution use it.
- The app API invokes a configured hosted generation URL if available. If unreachable/time-limited, report the failure and expose the local input-package workflow. Never fall back to an untested fake heuristic.
- Backend import validation is canonical for writes. The Python solver can reject obvious hard-constraint conflicts during search, but its output still has to pass the application API's current-data validator.
- Avoid duplicating rule logic unnecessarily. Where solver-specific constraint encoding is unavoidable, keep a shared rule catalogue and cross-check the solver output with the canonical API validator using identical fixture cases.

## 4. Why this boundary is necessary

The generation problem is a global constraint problem spanning active semesters and shared teachers, rooms, and students. Ordinary class edits/bookings are online mutations and should not invoke the full solver. They require short, current-state conflict checks. Separating the solver from the API avoids tying every normal booking to generation runtime limits.

## 5. Free-tier design constraints

- Target zero cost until university approval. Do not enable paid infrastructure or ask the user to add a payment method as part of prototype setup.
- Free services can sleep, pause projects, limit runtime, restrict workers, or change quotas. Verify current limits before relying on a specific service.
- Do not deploy paid Cloud Run/Render/Supabase/Vercel resources or claim that all operations are free without checking actual plan terms and billing settings.
- Keep the local solver capable of running without a continuously available remote worker.
- Do not rely on scheduled/background execution on a platform unless tested under the available tier.

## 6. Candidate workflow sequence

### Normal booking/cancellation/reschedule
Client -> trusted API -> authorize -> load current state -> validate -> perform transactional write -> create audit/outbox events in the same transaction -> commit -> deliver notifications -> return committed result.

### Initial timetable generation
Admin requests generation -> API checks permission and scope -> snapshot/export all required active-semester inputs with revision metadata -> attempt configured hosted generator -> if unavailable/fails, offer download package/local run/upload route -> solver returns draft/diagnostics -> backend validates against current data/revision -> store draft only -> admin reviews -> explicit publish operation with a new validation at publication time.

### Local draft import
Authenticate admin -> parse bounded file -> schema/version check -> compare input revision -> warn if stale -> require explicit audited override for staleness -> validate against current data and required session completeness -> transactionally save draft or reject whole import -> no automatic publish.

## 7. Architecture decisions that remain open

- Which free provider will host the API and/or Python generator, if any, after current-limit verification.
- Whether the current AI Studio project will use its native Node server for application API calls or call a separate Python API for those operations.
- Exact notification/push provider and its available free quota.
- Whether the initial project repository already exists and has an established framework/dependency set.
- Final automated backup plan that is possible at zero cost and its limitations.

The agent should make only the smallest reversible technical choices necessary to produce a testable first slice. It must record them in `docs/IMPLEMENTATION_DECISIONS.md` and explain them in its final report.
