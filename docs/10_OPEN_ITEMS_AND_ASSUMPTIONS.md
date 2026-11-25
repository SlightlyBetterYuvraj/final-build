# Open Items, Explicit Unknowns and Agent-Assumption Register

This file preserves uncertainty. The agent must not silently convert these gaps into claimed user-approved requirements.

## A. University configuration values not yet provided

- Exact teaching days and calendar dates.
- Number/name of periods, their start/end times, breaks and operating hours.
- Exact semester term boundaries and exceptional teaching days.
- Actual capacity requirement calculation (enrollment vs registered/expected count if these differ).
- Course-specific session-pattern exceptions and how those are configured by an admin.
- Odd practical-hour totals (e.g. P=3): no conversion policy approved. Mark invalid/unconfigured and request a formal configuration rather than rounding.
- Exact soft-objective weights/order for student gaps, teacher gaps and session distribution.
- Actual supported university email verification process and identity data format.
- Push notification provider/browser capabilities and available free quota.
- Retention periods and backup recovery objectives have not been specified.

## B. Technical feasibility/provider items

- Current AI Studio repo/runtime details must be inspected. Official Build Mode docs describe React plus Node.js server for web apps; Python execution must not be assumed.
- Final hosting provider for the trusted API and optional hosted Python generator has not been selected.
- Free service limits, cold starts, timeouts, worker availability and backup features must be verified at time of deployment.
- Supabase is a candidate for database/auth; project region, plan, quotas and exact security policy are to be verified.
- Exact frontend/server framework versions should respect the current repository and AI Studio runtime, not be upgraded casually.
- No measured generation runtime/maximum synthetic data size is available yet.

## C. Behavior that must not be assumed

- Do not assume a request can trigger a hosted Python job when no service URL is configured.
- Do not assume a hosted timeout means the job failed before it committed; use idempotency and job status checks.
- Do not assume client-side state is authoritative.
- Do not assume a user is free from conflicts because their group label differs; resolve actual student memberships.
- Do not assume a local draft is current merely because it imports successfully.
- Do not assume a provider's free tier includes backups, background workers, stable uptime or unlimited compute.
- Do not assume Android UI can reuse the web UI directly; future Android is expected to use the API with a native client.

## D. Agent-made decisions/additions

The coding agent must create/update `docs/IMPLEMENTATION_DECISIONS.md` during implementation. For each necessary technical decision, record:

- ID/date or phase;
- the decision made;
- why it was necessary;
- alternatives considered;
- impact on reliability, security, cost, portability and future Android reuse;
- whether reversible;
- whether user approval is required before production.

The final run summary must list every such decision succinctly. Any unrequested feature, data field, dependency, default, security behavior or workflow counts as an agent-made addition. If the agent makes no such additions, state `None` explicitly.

## E. Items explicitly out of scope in first release

- Attendance-taking.
- Campus mapping/indoor navigation.
- Self-registration or student-managed elective choices.
- Automatic teacher substitution.
- Automatic hard-constraint relaxation.
- Automatic publish after generation/import.
- Elaborate UI design and nonessential animation.
- Building the Android app before the web backend and API contract are stable.
