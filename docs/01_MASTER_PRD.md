# Master Product Requirements Document

**Product:** University Timetable & Class Management System  
**Version:** 4.8 planning baseline  
**Status:** Planning consolidated; technical feasibility and implementation remain outstanding.  
**Implementation:** Not started at the time this document was prepared.  
**Priority:** Stability and correctness over features and visual polish.

## 1. Product objective

Build one authoritative system for students, teachers, and administrators to manage semester timetables and day-to-day changes safely.

- **Students** view their applicable timetable and locate rooms using room number, building and floor; see cancellations, reschedules, extra classes and venue changes.
- **Teachers** view assigned classes; request unavailability; cancel/reschedule their own assigned dated occurrences; book one-off extra classes in valid free slots.
- **Admins** manage academic data, teachers, rooms, groups, elective assignments, academic calendar, availability, timetable generation, draft editing, import validation, publication and recovery.

The distinguishing workflow is the combination of semester timetable generation with reliable live conflict checking and safe handling of cancellations/rescheduling/extra classes. There must be one authoritative persisted schedule, not independent conflicting versions in different clients.

## 2. Product principles

1. Stability and data integrity outrank fancy UI.
2. Mandatory constraints are never relaxed automatically.
3. Server-side authorization and validation are authoritative.
4. Failed operations do not partially mutate committed data.
5. Schedule notifications happen only after successful committed changes.
6. Draft generation/import never means publication.
7. The recurring timetable is separate from dated class occurrences and one-off extra classes.
8. Use dummy data and target ₹0/month during the pre-approval prototype.
9. Do not invent campus-specific settings. Make them configurable or explicitly unresolved.
10. Architecture must allow the future Android client to use the same backend contract.

## 3. Roles and permissions

### Student
- View only the student's applicable section/batch classes and admin-assigned elective-group classes.
- View room number, building, floor and class status.
- Receive relevant in-app/inbox notices and, subject to preference/platform permission, push notifications.
- Cannot self-register into an authorized role or modify academic/elective assignments.
- Cannot change timetable data.

### Teacher
- View their assigned scheduled classes.
- Cancel or reschedule regular dated occurrences only when assigned to that occurrence.
- Book one-off extra classes using admin-defined target groups and eligible rooms.
- Cancel/reschedule an extra class only if they booked it; authorized admins may manage any extra class.
- Submit date/time unavailability requests with optional reasons; an authorized admin confirms them.
- Cannot bypass server-side checks or modify other teachers' assigned regular classes.

### Authorized admin
- Create/import student and teacher records; assign roles; manage courses, semesters, sections, batches, elective groups, rooms, teacher assignments/availability and academic calendar.
- Run timetable generation, edit drafts, import local drafts, resolve conflicts and publish a versioned timetable.
- Manage any class occurrence and any extra-class booking.
- View audit history and restore a prior timetable version through an authorized recovery workflow.

Only one admin role is planned for the first release; fine-grained admin role separation is not part of initial scope. Privileged actions must be audited.

## 4. Academic scheduling model

- Odd semester cycle: 1, 3, 5, 7 (approximately August–December).
- Even semester cycle: 2, 4, 6, 8 (approximately January–May).
- Exact term dates are admin-configurable and must not be hardcoded as immutable dates.
- Multiple semesters can be active concurrently. Initial generation considers all concurrently active semesters together because teachers and rooms may be shared.
- Sections contain sub-batches, e.g. section A includes A1 and A2.
- Courses have weekly L/T/P contact-hour values. These become scheduled sessions according to configurable rules.
- L and T sessions each occupy one 1-hour teaching slot.
- P/lab sessions occupy two consecutive 1-hour teaching slots as one continuous session.
- A venue is classified as L/T-capable or P-capable. Class type must match venue type; room capacity is a mandatory constraint.
- Course-specific session-pattern exceptions may be configured, but no undocumented conversion rule may be invented. Handling odd practical-hour totals (for example P=3) remains unresolved.
- Third-year students may take electives in semesters 5 and 6. Authorized admins assign elective-group membership individually or through bulk CSV/Excel import.
- Faculty may teach distinct activity types to different groups. Whole-section classes conflict with any simultaneous activity that includes a constituent batch; separate batches can run in parallel when no other shared-resource or student conflict exists.
- Scheduling conflicts must consider actual represented students where known, not merely group labels.

## 5. Generation and conflict checking

### Generation
- Initial generation is an explicit admin-triggered batch operation, intended once during each semester scheduling cycle.
- Generate all concurrently active semesters together in one run.
- Failed initial generation may be retried after inputs are corrected. Routine changes must not trigger full generation.
- Hard constraints are always enforced. Soft goals may optimize student gaps, teacher gaps and sensible distribution only when no hard constraint is violated.
- If no valid solution is found, stop and show an actionable conflict/infeasibility report. Do not auto-relax constraints or publish a partial/invalid timetable.
- Save successful generated output as a draft. Publication is a separate, explicit operation.

### Routine conflict validation
Whenever an affected change is proposed, validate against current authoritative state:
- teacher overlap and confirmed unavailability;
- room overlap, room type and capacity;
- student overlap, including section/batch/elective memberships and cross-semester membership;
- valid period boundaries and consecutive slots for labs;
- required assignment/session integrity and permissions.

Routine cancellation, rescheduling, extra-class booking, room change, teacher substitution and manual draft edits use the validator. They do not trigger the full generator.

### Atomicity and concurrency
- Failed rescheduling leaves the original occurrence and slot unchanged.
- Successful rescheduling commits the new slot and releases the old slot atomically.
- Concurrent booking attempts cannot both claim an incompatible resource/time.
- The backend must revalidate against current data at commit time; a stale client-side check is not sufficient.

## 6. Recurring timetable vs dated occurrences

- The published recurring timetable represents the planned weekly structure.
- Cancellation/reschedule applies to an individual dated occurrence, not the recurring weekly pattern.
- An extra class is a one-off dated session and never changes the recurring timetable.
- Cancelled classes remain visible as cancelled if no replacement exists. If an active replacement class is booked for the same student group and time, display the active replacement while retaining the cancelled record and notification/history.
- Published recurring-timetable changes require a revised draft based on the current published version, validation and atomic publication. Previous versions are retained for audit and authorized restoration.

## 7. Import/export

- Admin data entry supports validated bulk Excel/CSV plus manual editing.
- Invalid imports must not partially corrupt existing data.
- For local timetable generation fallback, an authorized admin downloads one complete, versioned generation-input package.
- The local generator processes the package and exports a structured draft.
- An authenticated admin uploads the draft through the website. The backend validates it against current data and mandatory constraints before saving it as a draft. No automatic publication.
- Input package revisions allow stale-input detection. An authorized admin may override a stale-package warning, but this override never bypasses mandatory constraint, permission or completeness validation.

## 8. Teacher unavailability

- Teachers submit date/time ranges plus optional reasons.
- An authorized admin confirms a request before it becomes confirmed unavailability.
- Once confirmed, identify affected class occurrences.
- The admin explicitly assigns an eligible substitute, reschedules, or cancels each affected occurrence. Do not auto-substitute silently.
- Validate every correction and notify affected students only after successful commit.
- Admin-managed regular teacher availability is used by generation; confirmed absence requests create dated exceptions.

## 9. Notifications

- Channels: live in-app updates, persistent inbox, browser/device push.
- Notify only affected students about cancellation, rescheduling, extra class, room/venue change, and published revision affecting their classes.
- Schedule-critical in-app and inbox alerts remain enabled; users can manage push preferences.
- Notify after the corresponding database operation commits successfully. Failed operations must not emit success notifications.
- Cancellation reason is optional and shown when supplied.

## 10. Accounts and security

- Admin creates/imports student and teacher records. There is no public self-registration flow for role assignment.
- Users verify university email and set a password through a secure process.
- Email-verified password recovery is included.
- Only authorized admins assign roles.
- Enforce permissions on the server/database; hiding UI controls alone is not security.
- Secrets use environment variables or platform secrets; no real API keys in source control or client bundles.

## 11. Rooms and venues

- Show room number, building and floor with class details.
- Each venue includes capacity and class type (L/T or P).
- Teachers choose rooms for extra classes only from eligible available rooms; backend revalidates on commit.
- No campus map, indoor navigation, or mapping integration is in scope.

## 12. Academic calendar

Admins configure term boundaries, teaching days/periods, start/end times, breaks, holidays and exceptional teaching days. Generation and validation respect these settings. Values are not to be invented by the agent.

## 13. Audit, versioning, backup and recovery

- Record who performed privileged or schedule-affecting actions, what changed, when, and the outcome.
- Retain timetable versions and relevant dated occurrence change history.
- Support authorized restoration of a prior timetable version without silently deleting audit history.
- Separate development/staging and production environments before real institutional data is used.
- Provide automated backup/recovery capability and documented restoration tests before production reliance.

## 14. Scope exclusions for the initial release

- Attendance-taking module.
- Campus mapping or indoor navigation.
- Student self-registration/self-assignment of electives.
- Automatic teacher substitution.
- Automatic relaxation of hard constraints.
- Automatic timetable publication after generation/import.
- Elaborate frontend effects or nonessential UI complexity.
- Android client in the first web prototype; the API should be reusable by a future Android app.

## 15. Prototype/deployment constraints

- Target ₹0/month with free plans and tools until university/admin approval.
- Use dummy data only before approval.
- Attempt hosted generation first when the configured free service is available; if unavailable/interrupted/unreliable, use the same generator locally.
- Do not assume free hosting has uptime, execution-duration, worker, or backup guarantees. Test actual limits and document them.
- Keep provider choices provisional until verified. Do not enable paid services or billing resources.

## 16. Acceptance bar

The implementation is not complete merely because the frontend looks correct. It must prove: authorization, persistence, conflict rules, transaction safety, import integrity, generation feasibility reporting, notification timing, versioned publication and regression tests. Refer to `docs/07_ACCEPTANCE_AND_REGRESSION_TESTS.md`.
