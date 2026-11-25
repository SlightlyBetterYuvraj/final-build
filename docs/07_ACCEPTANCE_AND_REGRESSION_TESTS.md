# Acceptance and Regression Test Plan

A workflow is not complete until its relevant tests pass. Use dummy fixtures, include negative cases, and never run destructive tests against real institutional data.

## 1. Build quality gates

For each implementation slice:
1. Record baseline test/build/type-check/lint status before edits.
2. Make the smallest practical change.
3. Run relevant unit tests.
4. Run integration tests for database/transactions when available.
5. Run type-check, lint and build.
6. Run regression cases that cover related paths.
7. Report test commands, results and untested limitations honestly.

If the repo has no test setup, create the smallest suitable test harness and document the choice. Do not install a large testing stack without need.

## 2. Academic/session rules

- L takes exactly one slot and one hour in default configuration.
- T takes exactly one slot and one hour.
- P takes exactly two adjacent valid slots in the same room.
- P cannot cross a break, non-teaching period, day boundary or invalid period boundary.
- L/T cannot be assigned to a P-only venue; P cannot be assigned to an L/T-only venue.
- Room capacity smaller than expected group size is rejected.
- Odd P weekly hours must be rejected as unresolved/unconfigured, not rounded silently.
- Configured course-specific exceptions are honored; absent exception data does not trigger guessed behavior.

## 3. Conflict tests

- Same teacher assigned to overlapping occurrences: reject.
- Same room assigned to overlapping occurrences: reject.
- Shared actual student in simultaneous classes: reject.
- Whole-section class overlaps a class for one of its batches: reject.
- A1 and A2 run in parallel using distinct teachers/rooms and disjoint students: permit if other rules pass.
- Elective classes sharing an actually assigned student overlap: reject.
- Different semesters share a teacher at the same time: reject.
- Different semesters share a room at the same time: reject.
- Confirmed teacher absence conflicts with scheduled class: reject scheduling/substitution candidate.
- Unconfirmed absence request does not act as confirmed absence.
- Room unavailable/non-teaching/break period: reject.
- Multi-slot lab reserves room/teacher/students for both slots.

## 4. Generator tests

- Generate across all simultaneously active semesters in one run.
- A valid small fixture yields a complete draft and diagnostics showing success.
- An intentionally infeasible fixture stops and returns actionable diagnostics.
- No automatic hard constraint relaxation.
- No invalid/partial draft is published or treated as valid.
- Generation run status persists across refresh/reload.
- Hosted timeout/unavailable endpoint is reported, and local fallback is offered.
- The local generator consumes a versioned input package and emits the same documented output schema.
- The system never claims hosted generation succeeded if no remote service was configured or called.

## 5. Transaction and concurrency tests

- Failed reschedule leaves original date/time/room/teacher unchanged.
- Successful reschedule changes new placement and frees old placement atomically.
- Two simultaneous incompatible room bookings: exactly one succeeds.
- Two simultaneous incompatible teacher bookings: exactly one succeeds.
- Two simultaneous extra-class bookings for overlapping represented students: no conflicting double success.
- Retry of an idempotent request does not create duplicate classes/notifications.
- Database failure between validation and write does not leave partial state.
- Notifications are not sent for rolled-back operations.
- Notification delivery failure after committed operation is retriable and does not roll back committed schedule change.

## 6. Cancellation and replacement

- Cancel one dated occurrence without changing recurring pattern or other dates.
- With no replacement, occurrence is displayed as cancelled.
- With replacement for same group/time, new occurrence displays active, old cancellation record/history remains.
- Optional cancellation reason appears when supplied; absent reason is acceptable.
- Affected students receive notices only after commit.

## 7. Extra classes and permissions

- Teacher can book a valid extra class in a valid free slot.
- Cancellation-freed slots are ranked before other suitable free slots but other free slots remain discoverable.
- A teacher cannot book an unavailable or incompatible room.
- Teacher cannot cancel/reschedule an extra class booked by another teacher.
- Booking teacher can cancel/reschedule their own extra class.
- Admin can manage any extra class.
- Regular class teacher can cancel/reschedule only an occurrence assigned to them; admin can manage any occurrence.
- Extra class is one-off and does not mutate weekly recurring timetable.
- All actions revalidate current state at commit.

## 8. Imports, staleness and recovery

- Invalid CSV/Excel import rejected without partial writes.
- Unknown course/teacher/room/group reference yields actionable diagnostic.
- Input package includes schema/version/revision/hash metadata.
- Draft generated from current package can import successfully if all checks pass.
- Stale package triggers warning.
- Authorized stale override is audited but cannot bypass mandatory constraints/completeness.
- Unauthorized override rejected.
- Invalid uploaded draft leaves existing published version and database state intact.
- File size, row counts and malformed file conditions are safely handled.
- Local generator draft schema/version mismatch is rejected clearly.

## 9. Publication/versioning/audit

- Only admin can publish.
- Publishing revalidates against current data.
- Invalid draft cannot publish.
- Successful publication atomically updates current version and retains prior version.
- Failure during publication leaves prior published timetable active.
- Restore operation is authorized, audited and does not erase prior history.
- Audit record captures actor, action, timestamp and outcome for privileged/schedule-affecting mutations.

## 10. Transfers, electives and absence

- Section/batch transfer effective date changes future membership only.
- Past records/attendance are unchanged by transfer.
- Existing elective assignments are preserved on transfer.
- Incompatible elective assignment is flagged; affected timetable finalization blocked until admin resolves it.
- Teacher absence request requires admin confirmation.
- Confirmation enumerates affected dated occurrences.
- Admin can resolve each occurrence by replacement, rescheduling or cancellation, with appropriate validations and notifications.

## 11. Security tests

- Student cannot call admin routes/actions, even by direct API request.
- Teacher cannot edit another teacher's regular assigned occurrence.
- Teacher cannot manage another teacher's extra class unless admin.
- Client cannot set its own role.
- Direct database access is restricted by grants/RLS as applicable.
- Service secrets absent from client bundles and committed files.
- Password recovery does not reveal whether an email exists.
- Rejected requests do not leak stack traces, credentials or other users' private data.

## 12. Release/pitch checklist

- Demonstrate with dummy data.
- Validate zero-cost setup against actual provider dashboards; no paid service enabled.
- Demonstrate normal hosted generation success or its explicit fallback behavior.
- Demonstrate local package -> generator -> draft upload -> current-data validation -> draft review -> explicit publication.
- Demonstrate a deliberately conflicting schedule is rejected with a useful reason.
- Demonstrate failed operations preserve original state.
- State every limitation and untested area in the pitch/demo notes.
