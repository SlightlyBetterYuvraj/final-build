# University Timetable & Class Management System — AI Studio Spec Pack

This package contains the approved product requirements and implementation rules for building the system with Google AI Studio in `/goal` mode.

## Read first

1. `AGENTS.md` — non-negotiable implementation and reporting rules.
2. `docs/01_MASTER_PRD.md` — product scope and all 50 recorded decisions.
3. `docs/02_DECISION_REGISTER.md` — compact decision ledger and status.
4. `docs/03_ARCHITECTURE_AND_RUNTIME.md` — proposed architecture, runtime limitations and boundaries.
5. `docs/04_SCHEDULING_DOMAIN_RULES.md` — the core scheduling semantics.
6. `docs/05_DATA_MODEL.md` — proposed entities and relationships.
7. `docs/06_API_AND_WORKFLOWS.md` — operation contracts and transaction requirements.
8. `docs/07_ACCEPTANCE_AND_REGRESSION_TESTS.md` — minimum correctness bar.
9. `docs/08_SECURITY_CONFIG_AND_OPERATIONS.md` — secrets, roles, deployment and recovery requirements.
10. `docs/09_IMPLEMENTATION_SEQUENCE.md` — safe build order.
11. `docs/10_OPEN_ITEMS_AND_ASSUMPTIONS.md` — known unresolved inputs and prohibited assumptions.
12. `prompts/AI_STUDIO_GOAL_PROMPT.md` — copy into AI Studio `/goal` mode.

## Important context

- This is a specification package, not an application implementation.
- Implement business logic, persistence, validation and tests before spending effort on frontend design.
- Stability and data integrity take precedence over visual polish or feature count.
- Do not treat any hosting provider or final deployment topology as approved merely because it appears as a provisional option in the architecture document.
- The prototype must target **₹0 per month**, relying on free tiers and free tools within current provider limits. Do not enable paid services. Verify provider limits before relying on them.
- Use only dummy university data until the university approves the project.
- Use dummy values/placeholders for credentials. Never commit real secrets or put server secrets in browser code.
- An agent-made decision is not approved simply because it was necessary to write code. Record it and explain it in the final run report.

## Using this package

Place these files in the project repository or attach them to AI Studio so the agent can read them. Then paste `prompts/AI_STUDIO_GOAL_PROMPT.md` into `/goal` mode. If the project already contains code, the agent must inspect and preserve it rather than replacing the project wholesale.

## AI Studio runtime note

Google's current AI Studio Build documentation describes a React client and Node.js server runtime for web apps. Do not assume the AI Studio app server can directly execute a Python/OR-Tools process. The scheduling engine is therefore isolated behind a service/file contract; the agent must make the real execution path explicit and testable, not fake a successful hosted generation. See: https://ai.google.dev/gemini-api/docs/aistudio-build-mode

## JKLU Presentation Mockup & Demo Commands

To seed or reset the complete, conflict-free **JK Lakshmipat University (JKLU)** presentation mockup dataset:

```bash
# Clean database purge and seed full presentation dataset (64 students, 16 sections, 26 faculty, 32 courses, 141 occurrences, overrides, realtime notifications):
npm run seed:demo
```

### Presentation Demo Accounts

| Role | Email | Password | Linked Entity |
|---|---|---|---|
| **System Administrator** | `admin@university.edu` | `AdminPass#2026!` | Patient Zero (`admin-001`) |
| **Faculty Instructor** | `teacher@university.edu` | `TeacherPass#2026!` | Dr. Alice Smith (`t-1`) |
| **Enrolled Student** | `student@university.edu` | `StudentPass#2026!` | Charlie Brown (`stud-1`, CSE-3-A) |
| **Senior Student** | `yuvi@abc.com` | `StudentPass#2026!` | Yuvraj Singh Rathore (`2025Btech290`, CSE-5-A) |

### Key Presentation Showcase Highlights

- **Desktop Period-by-Period Columns:** Select `CSE-3-A` or `CSE-5-A` in the Timetables Explorer to show the full period grid (P1 through P7) with 2-period lab blocks and active period highlight.
- **Cancelled Classes:** Wednesday P1 (`CS201` in `LT-1` for `CSE-3-A`) and Wednesday P2 (`CS301` in `LT-2` for `CSE-5-A`) styled in high-visibility light red / dark red badges with full cancellation reasons.
- **Rescheduled Room Swaps:** Wednesday P3 (`EC201` swapped to `LT-4`) and Wednesday P3 (`CS303` swapped to `LT-6`) showing automatic audit trail.
- **Realtime Notifications:** 15 pre-seeded institutional notifications in `notification_outbox` with staggered timestamps (`Just now`, `5m ago`, `1h ago`) and dynamic unread badge count in Flame Orange (`#E87722`).
- **Student Directory:** Authoritative directory of 64 students with search filtering by name, roll number, or institutional email.

