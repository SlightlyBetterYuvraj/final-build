# Scheduling Domain Rules and Invariants

This document is the reference for scheduling behavior. If an implementation, UI, solver, or import workflow disagrees with these rules, fix the implementation rather than weakening the rules.

## 1. Core terms

- **Recurring timetable pattern:** semester-level weekly plan.
- **Dated occurrence:** one scheduled class instance on an actual date.
- **Extra class:** one-off dated session booked outside the recurring pattern.
- **Section:** student cohort such as A.
- **Batch:** a subset of a section, such as A1 or A2.
- **Teaching group:** a configurable group that a class targets; may represent a section, batch, elective group or another admin-defined student set.
- **Represented students:** the actual set of students included in a group/class, including confirmed elective membership where applicable.
- **Teaching slot:** a configurable one-hour period in the approved default slot model.
- **Room capability:** `LT` (eligible for lectures/tutorials) or `P` (eligible for practical/lab).

## 2. Session duration

- L occupies 1 consecutive slot of 1 hour.
- T occupies 1 consecutive slot of 1 hour.
- P occupies 2 consecutive slots of 1 hour each as a single uninterrupted class.
- A lab may not use two nonadjacent slots to satisfy its duration.
- Slot IDs must correspond to actual adjacent periods on the configured timetable grid. Do not assume slot ID numeric adjacency is sufficient unless the grid guarantees it.
- L/T activity requires an `LT` room; P requires a `P` room.
- Room capacity must be sufficient for the expected student/group size.
- Keep support for explicitly configured course/session exceptions, but do not invent default exception values.
- **Unresolved:** if P contact hours are odd, do not silently round, shorten a lab, or create an arbitrary conversion. Flag the course configuration as invalid/unconfigured until an explicit university rule is supplied.

## 3. Group intersection and conflicts

At minimum, two scheduled activities conflict when they overlap in time and share any of:

1. the same teacher;
2. the same room;
3. at least one actual student;
4. student/group membership implied by a whole section and one of its constituent batches;
5. a hard unavailability period, holiday, non-teaching period or invalid venue/session pattern.

Whole-section vs sub-batch rule: a session for section A conflicts with a simultaneous session for A1 or A2 because those students are included in A. A1 and A2 sessions may overlap if they do not share students, teachers or rooms and all other rules are satisfied.

Different semester numbers do not make a conflict safe: faculty, rooms and actual students/resources may be shared across concurrently active semesters.

Elective rule: conflict calculation uses the actual enrolled/assigned students represented by each elective group. If membership data is unresolved or stale, do not assume no conflict.

## 4. Teacher and room availability

- Generation honors admin-managed teacher availability and confirmed dated absence exceptions.
- A teacher unavailability request is not active absence until confirmed by an authorized admin.
- Once confirmed, affected dated class occurrences must be enumerated for administrative resolution.
- Every room has a class type, capacity and human-readable location (room number, building, floor).
- Room availability includes every time slot of a multi-slot session.
- Multi-slot lab requires the same eligible room over both consecutive slots unless an explicitly approved policy later says otherwise; do not move rooms midway through a lab.

## 5. Generation constraints

### Mandatory constraints
- no teacher overlap;
- no room overlap;
- no actual-student/group overlap;
- whole-section/batch nesting conflicts respected;
- venue type compatible with activity type;
- room capacity met;
- teacher availability and dated exceptions respected;
- sessions fit within valid operating periods and do not cross non-teaching/break periods;
- labs occupy 2 consecutive valid slots;
- all required sessions accounted for under explicitly configured L/T/P rules;
- all concurrently active semesters considered together for shared resources;
- only permitted users can submit/edit/publish data.

### Soft preferences
- minimize student gaps;
- avoid excessive teacher gaps;
- distribute sessions sensibly across valid days/periods.

Soft preferences can never override a mandatory constraint. Exact weights/ranking are technical parameters not yet specified; choose defaults only as reversible implementation details and record them.

## 6. One-time generation vs routine validation

- Admin triggers initial generation for one semester scheduling cycle.
- Generate all concurrently active semesters together.
- A failed generation can be retried after correction.
- Routine schedule changes do not rerun full generation.
- Routine validators check only affected classes/resources/groups against the current authoritative schedule but must still account for relevant global memberships and cross-semester conflicts.
- Full validation is required before publishing any timetable draft.

## 7. Cancellation and replacement display

- Cancellation is for a dated occurrence.
- Store cancellation record and optional reason; do not delete the recurring timetable pattern.
- If no replacement exists, display the occurrence as cancelled.
- If a new active class is booked for the same student group and time, show the active replacement in the main timetable while retaining the original cancellation record and notice history.
- Keep auditability: cancellation and replacement are distinct events.

## 8. Rescheduling and extra classes

- Regular occurrence: assigned teacher or authorized admin can reschedule/cancel.
- Extra class: booking teacher or authorized admin can cancel/reschedule.
- A reschedule is all-or-nothing. Validate replacement first; commit replacement and release old slot atomically. If any validation/write fails, retain the old booking.
- Extra class is a one-off dated event, not a mutation to the recurring timetable.
- Teacher chooses the target from admin-defined eligible groups and a room from currently eligible rooms.
- The backend revalidates exact room/time/group/teacher state immediately before commit.

## 9. Student group transfer

- A transfer has an effective date.
- New group membership applies to future classes from that date; historical records/attendance remain unchanged.
- Preserve existing elective assignments. If an assignment becomes incompatible, flag it and require admin resolution before the affected timetable can be finalized.
- Do not silently remove or replace elective enrollment.

## 10. Validation error design

Errors should be actionable and identify the conflicting entity and time where safe, e.g. teacher conflict, room conflict, affected group/student, room capacity, wrong room type, unavailable teacher, lab cannot fit adjacent slots, missing required session, stale package, invalid period, or unresolved elective membership. Avoid vague “invalid timetable” errors when a specific reason can be calculated.
