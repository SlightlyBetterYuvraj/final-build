# Decision Register — D01–D50

**Status meanings:** `CONFIRMED` means accepted by the user. `PROVISIONAL/OPEN` means direction is recorded but exact technology/provider/value remains undecided. This register must not turn a recommendation into approval.

| ID | Status | Decision |
|---|---|---|
| D01 | CONFIRMED | Cancellation applies to one dated occurrence, not the recurring weekly pattern. |
| D02 | CONFIRMED | Teachers book extra classes directly; backend validates all conflicts. |
| D03 | CONFIRMED | Offer cancellation-freed slots and other suitable free periods; prioritize cancellation-freed slots. |
| D04 | CONFIRMED | Reschedule an existing occurrence atomically; move succeeds or old booking remains; notify after commit. |
| D05 | CONFIRMED | In-app live updates, persistent inbox and browser/device push notifications. |
| D06 | CONFIRMED | Weekly L/T/P contact hours translate into scheduled sessions through rules. |
| D07 | CONFIRMED, values refined by D31/D44 | University-wide session defaults with course-specific exceptions. Exact odd-P conversion remains open. |
| D08 | CONFIRMED | Students inherit section/batch timetable plus individually assigned elective-group classes; check represented-student conflicts. |
| D09 | CONFIRMED | Bulk Excel/CSV plus admin editing; validate before save and prevent partial corruption. |
| D10 | CONFIRMED | Generate all concurrently active semesters together. |
| D11 | CONFIRMED | Mandatory constraints always enforced; optimize soft preferences only inside valid solutions. |
| D12 | CONFIRMED | Admin may edit draft classes, rooms and assignments; backend rejects edits violating mandatory constraints. |
| D13 | CONFIRMED | Published timetable revisions use a revised draft, validation, atomic publication and retained prior versions. Dated occurrence operations are separate. |
| D14 | CONFIRMED | Admin creates/imports student/teacher records; university email verification/password setup; only authorized admins assign roles; no open self-registration. |
| D15 | CONFIRMED | One configurable university grid; exact days/periods/breaks are not invented. Multi-period sessions occupy consecutive periods. |
| D16 | CONFIRMED | Show room number, building and floor; no map or indoor navigation. |
| D17 | CONFIRMED | Cancellation reason optional; display it when provided. |
| D18 | CONFIRMED | Keep cancelled class visible as cancelled without replacement; replacement can appear active for same group/time while historical cancellation stays recorded. |
| D19 | CONFIRMED | Extra-class target groups are admin-defined (sections, batches, elective groups etc.); conflicts check actual represented students. |
| D20 | CONFIRMED | Teacher selects eligible available room; display capacity and type; revalidate server-side. |
| D21 | CONFIRMED | Infeasible generation stops and gives actionable report; no automatic hard-constraint relaxation or partial publication. |
| D22 | CONFIRMED | Notify affected students for schedule-affecting changes only after successful commit. |
| D23 | CONFIRMED | Teacher can cancel/reschedule regular occurrences assigned to them; authorized admins may manage any class. |
| D24 | CONFIRMED | Extra classes are one-off dated sessions and never modify recurring timetable. |
| D25 | CONFIRMED | Only the booking teacher or authorized admin may cancel/reschedule an extra class; reschedule is atomic and notification post-commit. |
| D26 | CONFIRMED | Admins assign electives individually or via bulk CSV/Excel; students cannot change assignments. |
| D27 | CONFIRMED | Student group transfers have an effective date and affect future classes only; past records/attendance remain unchanged. |
| D28 | CONFIRMED | Preserve elective assignment on transfer; flag incompatibility; resolve before affected timetable is finalized. |
| D29 | CONFIRMED | Confirmed teacher unavailability causes affected occurrences to be reviewed by admin; admin chooses eligible substitute, reschedule or cancel. |
| D30 | CONFIRMED | Teacher submits date/time unavailability request plus optional reason; admin confirms; then affected classes are identified. |
| D31 | CONFIRMED | Configurable scheduling/session rules: university defaults plus course-specific exceptions. |
| D32 | CONFIRMED | Balanced soft optimization: minimize student gaps, avoid excessive teacher gaps, sensible distribution; never violate hard constraints. |
| D33 | CONFIRMED | Admin-managed regular teacher availability; confirmed absence requests are dated exceptions. |
| D34 | CONFIRMED | Room capacity and class-type compatibility are mandatory constraints. |
| D35 | CONFIRMED | No attendance-taking module in initial release; preserve historical attendance only if provided by an existing system. |
| D36 | CONFIRMED | Admin-managed terms, holidays and exceptional teaching days. |
| D37 | CONFIRMED | Essential schedule alerts remain in-app/inbox; users may manage push preferences. |
| D38 | CONFIRMED | Verified university email and secure password recovery; server-enforced role permissions. |
| D39 | CONFIRMED | One authorized admin role in initial release; privileged actions audited. |
| D40 | CONFIRMED | Audit who/what/when; retain timetable versions and support authorized restoration. |
| D41 | CONFIRMED AS PROCESS | Conduct a technical feasibility review before committing to a final stack. |
| D42 | CONFIRMED | Separate development/production environments, automated backups, secrets management and documented recovery tests. |
| D43 | CONFIRMED AS PROCESS | Next step is technical feasibility/architecture review, not immediate coding without review. |
| D44 | CONFIRMED | L/T = one 1-hour slot; P/lab = two consecutive 1-hour slots. Venue type must match L/T or P. Odd practical-hour handling remains open. |
| D45 | DIRECTION CONFIRMED; PROVIDER OPEN | Try suitable online/free-tier hosting first; retain local fallback on the developer's machine. Exact provider/topology must be verified. Vercel/Supabase are intended candidates, not an unconditional guarantee. |
| D46 | CONFIRMED | Initial generation is admin-triggered once per semester scheduling cycle, all concurrently active semesters together; routine operations use conflict checking, not full generation. Failed generation may be retried after correction. |
| D47 | CONFIRMED | Hosted generation first; same generator available locally if hosting fails or is unreliable. |
| D48 | CONFIRMED | Local generator exports structured draft; authenticated admin uploads through site; backend validates and saves as draft; no automatic publication. |
| D49 | CONFIRMED | Admin downloads one complete generation-input package; local generator uses it; result is revalidated against current hosted data on import. |
| D50 | CONFIRMED | Stale input package warns; authorized admin may override with audit record, but cannot bypass mandatory conflict/completeness/permission checks. |

## Invariants that survive every decision

- Server-side checks are authoritative.
- No failed operation partially mutates committed state.
- Notifications follow successful commits.
- Generation/import do not automatically publish.
- A local draft must pass current-data backend validation.
- Stale-package override is not a conflict bypass.
- Real institutional data remains out of scope until approval.
- Do not infer that a provider supports a needed feature on its free tier without checking.
