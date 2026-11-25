# API and Workflow Contract

These are logical operations. Exact routes/frameworks can adapt to the current repository/runtime, but their authorization, transaction and validation semantics must not change. Do not return fake successes.

## 1. API conventions

- Server validates authentication, role and resource ownership for every sensitive action.
- Validate inputs with explicit schemas; reject unknown/invalid enum values, impossible dates/slots and malformed imports.
- Use stable error codes, human-readable messages, and a correlation/request ID where practical.
- Mutating requests that could be retried should use idempotency protection or equivalent duplicate detection.
- Re-read relevant state and validate close to transaction commit.
- Any error response must make clear that the operation did not commit, except where the system can explicitly report a committed change with a downstream notification failure.

## 2. Logical operation inventory

### Authentication/account
- Verify university email / complete password setup through chosen auth provider.
- Request password recovery; do not disclose whether arbitrary emails are registered.
- Admin create/import student/teacher records and assign role.
- No public self-registration that can choose a privileged role.

### Reference data
- Admin manage academic terms/calendar, courses/course offerings, sections, batches, elective groups/assignments, teachers, teacher availability, rooms and timetable configuration.
- Bulk imports validate the complete file before applying a transaction. On invalid rows, either reject the file or use an explicitly defined safe preview/partial policy; default for initial release is all-or-nothing import to prevent partial corruption.

### Generation
- `requestGeneration(scope)` — admin only; snapshots all concurrently active semesters, creates durable generation-run record and input revision, attempts configured hosted generator if available.
- `getGenerationStatus(runId)` — authorized admin; returns queued/running/succeeded/infeasible/failed and diagnostics.
- `downloadGenerationInputPackage(runId/packageId)` — authorized admin; export complete versioned package.
- `runLocalGenerator` — local CLI/script outside hosted app; not represented as a false online API success.
- `uploadGeneratedDraft(file)` — authorized admin; validate schema/version/size, compare package revision, warn if stale, record any override, validate against current DB and required session completeness, then write all draft rows transactionally.
- `getGenerationDiagnostics(runId)` — show actionable conflict/infeasibility details.

### Draft and publication
- Admin edit draft class/room/teacher/group; each proposed change is validated server-side.
- `validateDraft(versionId)` — full mandatory-constraint and completeness pass.
- `publishDraft(versionId)` — admin only; re-read and validate at publication time; atomically set new current version and preserve prior version.
- `restoreVersion(versionId)` — admin only, creates a new restored revision/snapshot or follows a documented safe restore process; never erase audit history.

### Dated occurrence operations
- `cancelOccurrence(id, optionalReason)` — assigned teacher for their occurrence or admin; cancellation event is recorded; recurring template unchanged.
- `rescheduleOccurrence(id, newDate/slot/room as supported)` — assigned teacher or admin; atomic move only after validation.
- `changeOccurrenceRoom(...)` / `changeOccurrenceTeacher(...)` — admin or permitted assigned teacher according to policy; check all constraints.
- Notifications target only affected students and are produced after commit.

### Extra class operations
- Find available slots with cancellation-freed slots ranked first, without hiding other suitable free periods.
- Query eligible rooms by date/slot, capacity, type and availability.
- `bookExtraClass(...)` — teacher authenticated; target group chosen from admin-defined groups; backend validates represented students, teacher, room, period, type/capacity and all existing classes.
- `cancelExtraClass(id)` / `rescheduleExtraClass(id,...)` — booking teacher or admin; atomic; notify affected students after success.
- Extra classes are dated one-offs and never modify recurring weekly pattern.

### Teacher unavailability
- Teacher submits request with date/time range and optional reason.
- Admin approves/rejects request. Unconfirmed request does not block generation/scheduling as an absence.
- Approval identifies affected dated occurrences; admin resolves each by substitute, reschedule or cancel.

### Student groups/electives
- Admin assigns elective students individually or by bulk file.
- Admin transfers student section/batch with effective date; future classes use new membership, historical records remain unchanged.
- Existing electives persist; incompatibilities are flagged and require explicit admin resolution before affected timetable is finalized.

### Notifications and audit
- Read in-app inbox and unread status.
- Push opt-in/out settings affect push delivery only; essential in-app/inbox notices remain.
- Each relevant mutation emits an audit event. Notifications are scheduled only after successful commit.

## 3. Required transaction patterns

### Atomic reschedule
1. Authenticate and authorize actor.
2. Load current occurrence and current resource/group membership.
3. Validate candidate new placement including all occupied slots.
4. Within concurrency-safe transaction, lock/revalidate resources or use equivalent constraints.
5. Update placement and release old placement as one commit; add audit/outbox event.
6. Commit.
7. Deliver/queue notifications and return committed state.
8. If any pre-commit step fails, old state remains unchanged and no success notice is sent.

### Booking conflict prevention
- Two concurrent requests for same incompatible teacher/room/student/time cannot both succeed.
- Use transaction isolation, resource locks, exclusion/unique constraints where applicable, or a documented equivalent.
- Test true concurrent requests; a sequential unit test is not enough.

### Import safety
1. Parse file in a bounded temporary area.
2. Schema/version/file-size/row-count checks.
3. Validate references and all mandatory constraints against current data.
4. Check package version; if stale, require authorized audited override where policy allows.
5. Save entire draft in one transaction only if every mandatory validation passes.
6. On failure, no partial committed rows; return row/rule diagnostics.

### Publication safety
1. Authorize admin.
2. Validate all draft records and constraints against current state.
3. Atomically set publication/current-version pointer and preserve old version.
4. Commit.
5. Notify affected students only after commit.

## 4. Standard error categories

At minimum provide stable categories for: unauthenticated, forbidden, validation error, conflict, stale input, unsupported package version, infeasible timetable, missing configuration, room type mismatch, room capacity, unavailable teacher, invalid adjacent slot, missing required session, duplicate/idempotent request, concurrent update, service unavailable, timeout, storage error, and internal error.

Do not expose secret values, database internals, stack traces or other users' private data in end-user error messages.
