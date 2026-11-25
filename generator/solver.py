"""
University Timetable Generator — Python OR-Tools CP-SAT Solver
Standalone solver respecting:
- Multi-semester global optimization (D10)
- Mandatory constraints: L/T=1 slot, P=2 consecutive slots in eligible room (D44)
- Room compatibility (LT vs P) and capacity (D34)
- Cohort nesting: section vs sub-batch, shared students (D08)
- Teacher weekly availability (D33)
- Infeasibility diagnostic reporting (D21)
"""

import sys
import json
import time
from typing import Dict, List, Any, Tuple
from ortools.sat.python import cp_model


def solve_timetable(package: Dict[str, Any], time_limit_seconds: int = 20) -> Dict[str, Any]:
    start_time = time.time()
    
    # 1. Unpack package
    term_ids = package.get("termIds", [])
    grid = package.get("grid", {})
    days = grid.get("days", [1, 2, 3, 4, 5])
    slots = grid.get("slots", [])
    rooms = package.get("rooms", [])
    teachers = package.get("teachers", [])
    courses = package.get("courses", [])
    offerings = package.get("courseOfferings", [])
    sections = package.get("sections", [])
    batches = package.get("batches", [])
    teacher_avails = package.get("teacherAvailabilities", [])
    elective_groups = package.get("electiveGroups", [])
    elective_assignments = package.get("electiveAssignments", [])
    student_memberships = package.get("studentMemberships", [])
    
    # Lookups
    course_by_id = {c["id"]: c for c in courses}
    room_by_id = {r["id"]: r for r in rooms}
    teacher_by_id = {t["id"]: t for t in teachers}
    section_by_id = {s["id"]: s for s in sections}
    batch_by_id = {b["id"]: b for b in batches}
    
    # Map batches to sections
    batch_to_section = {b["id"]: b["sectionId"] for b in batches}

    # Student to group mapping for overlap detection
    group_to_students = {}
    for m in student_memberships:
        gid = m.get("groupId")
        sid = m.get("studentId")
        if gid and sid:
            group_to_students.setdefault(gid, set()).add(sid)
    for ea in elective_assignments:
        egid = ea.get("electiveGroupId")
        sid = ea.get("studentId")
        if egid and sid:
            group_to_students.setdefault(egid, set()).add(sid)
    for b in batches:
        sec_id = b.get("sectionId")
        bid = b.get("id")
        if sec_id and bid in group_to_students:
            group_to_students.setdefault(sec_id, set()).update(group_to_students[bid])
    
    # Non-break slots by day
    valid_slots_by_day = {}
    for d in days:
        valid_slots_by_day[d] = [
            s["slotIndex"] for s in slots
            if s["dayOfWeek"] == d and not s.get("isBreak", False)
        ]
        valid_slots_by_day[d].sort()

    # Teacher unavailability set: (teacherId, day, slotIndex)
    teacher_unavail_set = set()
    for ta in teacher_avails:
        if not ta.get("isAvailable", True):
            teacher_unavail_set.add((ta["teacherId"], ta["dayOfWeek"], ta["slotIndex"]))

    # 2. Decompose course offerings into required sessions
    sessions = []
    session_id_counter = 1
    
    for off in offerings:
        cid = off["courseId"]
        course = course_by_id.get(cid)
        if not course:
            continue
        
        # Check odd practical hours (D07/D44)
        if course["practicalHours"] % 2 != 0:
            return {
                "schemaVersion": "1.0.0",
                "packageId": package.get("packageId", "unknown"),
                "inputRevision": package.get("inputRevision", "unknown"),
                "generatorVersion": "ortools-cp-sat-1.0.0",
                "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "status": "infeasible",
                "termIds": term_ids,
                "classes": [],
                "diagnostics": {
                    "solveTimeMs": (time.time() - start_time) * 1000,
                    "statusString": "ERR_ODD_P_HOURS",
                    "conflicts": [f"Course {course['code']} has odd practical contact hours ({course['practicalHours']}). Practical sessions require 2-hour blocks and cannot be scheduled without explicit policy."],
                    "infeasibilityReason": f"Course {course['code']} practical hours cannot be resolved."
                }
            }
        
        # Expected group size
        group_size = 30
        if off["targetType"] == "section" and off["targetId"] in section_by_id:
            group_size = section_by_id[off["targetId"]].get("expectedCount", 60)
        elif off["targetType"] == "batch" and off["targetId"] in batch_by_id:
            group_size = batch_by_id[off["targetId"]].get("expectedCount", 30)

        off_comp = off.get("component")

        # Lecture sessions
        if not off_comp or off_comp == "L":
            for i in range(course["lectureHours"]):
                sessions.append({
                    "id": f"sess-{session_id_counter}",
                    "offeringId": off["id"],
                    "courseId": cid,
                    "termId": off["termId"],
                    "activityType": "L",
                    "duration": 1,
                    "teacherId": off["teacherId"],
                    "targetType": off["targetType"],
                    "targetId": off["targetId"],
                    "expectedGroupSize": group_size,
                    "requiredRoomType": "LT"
                })
                session_id_counter += 1

        # Tutorial sessions
        if not off_comp or off_comp == "T":
            for i in range(course["tutorialHours"]):
                sessions.append({
                    "id": f"sess-{session_id_counter}",
                    "offeringId": off["id"],
                    "courseId": cid,
                    "termId": off["termId"],
                    "activityType": "T",
                    "duration": 1,
                    "teacherId": off["teacherId"],
                    "targetType": off["targetType"],
                    "targetId": off["targetId"],
                    "expectedGroupSize": group_size,
                    "requiredRoomType": "LT"
                })
                session_id_counter += 1

        # Practical sessions (each duration 2)
        if not off_comp or off_comp == "P":
            lab_count = course["practicalHours"] // 2
            for i in range(lab_count):
                sessions.append({
                    "id": f"sess-{session_id_counter}",
                    "offeringId": off["id"],
                    "courseId": cid,
                    "termId": off["termId"],
                    "activityType": "P",
                    "duration": 2,
                    "teacherId": off["teacherId"],
                    "targetType": off["targetType"],
                    "targetId": off["targetId"],
                    "expectedGroupSize": group_size,
                    "requiredRoomType": "P"
                })
                session_id_counter += 1

    # 3. Build CP-SAT Model
    model = cp_model.CpModel()
    
    # Candidate placements per session: (d, s, r)
    # var_map: (session_idx, d, s, r) -> BoolVar
    var_map = {}
    session_vars = {i: [] for i in range(len(sessions))}
    
    for i, sess in enumerate(sessions):
        dur = sess["duration"]
        req_type = sess["requiredRoomType"]
        grp_size = sess["expectedGroupSize"]
        teacher_id = sess["teacherId"]
        
        # Find eligible rooms
        eligible_rooms = [
            r for r in rooms
            if r.get("active", True) and r["roomType"] == req_type and r["capacity"] >= grp_size
        ]
        
        for d in days:
            day_slots = valid_slots_by_day.get(d, [])
            for s in day_slots:
                # For duration 2, s+1 must also be valid on this day
                if dur == 2:
                    if (s + 1) not in day_slots:
                        continue
                
                # Check teacher availability
                teacher_blocked = False
                for off_slot in range(dur):
                    if (teacher_id, d, s + off_slot) in teacher_unavail_set:
                        teacher_blocked = True
                        break
                if teacher_blocked:
                    continue
                
                for r in eligible_rooms:
                    v = model.NewBoolVar(f"x_{i}_{d}_{s}_{r['id']}")
                    var_map[(i, d, s, r["id"])] = v
                    session_vars[i].append((d, s, r["id"], v))
                    
        # Hard constraint: Each session must be scheduled exactly once
        if len(session_vars[i]) == 0:
            return {
                "schemaVersion": "1.0.0",
                "packageId": package.get("packageId", "unknown"),
                "inputRevision": package.get("inputRevision", "unknown"),
                "generatorVersion": "ortools-cp-sat-1.0.0",
                "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "status": "infeasible",
                "termIds": term_ids,
                "classes": [],
                "diagnostics": {
                    "solveTimeMs": (time.time() - start_time) * 1000,
                    "statusString": "INFEASIBLE_NO_ELIGIBLE_SLOTS",
                    "conflicts": [f"Session {sess['id']} ({sess['activityType']} for {sess['targetType']} {sess['targetId']}) has no eligible rooms or available slots."],
                    "infeasibilityReason": "No placement options for session."
                }
            }
            
        model.Add(sum(v for _, _, _, v in session_vars[i]) == 1)

    # 4. Overlap Constraints
    # Index by (d, slot, resource)
    # A. Room occupancy: at most one class per room per slot
    room_slot_vars = {} # (d, slot, room_id) -> list of vars
    # B. Teacher occupancy: at most one class per teacher per slot
    teacher_slot_vars = {} # (d, slot, teacher_id) -> list of vars
    # C. Target cohort occupancy
    # Direct group: (d, slot, target_type, target_id) -> list of vars
    direct_target_vars = {}
    section_whole_vars = {}
    batch_vars = {}
    student_slot_vars = {} # (d, slot, student_id) -> list of vars
    
    for i, sess in enumerate(sessions):
        dur = sess["duration"]
        tid = sess["teacherId"]
        ttype = sess["targetType"]
        tgid = sess["targetId"]
        
        for d, s, rid, v in session_vars[i]:
            for offset in range(dur):
                t = s + offset
                # Room
                room_slot_vars.setdefault((d, t, rid), []).append(v)
                # Teacher
                teacher_slot_vars.setdefault((d, t, tid), []).append(v)
                # Direct target
                direct_target_vars.setdefault((d, t, ttype, tgid), []).append(v)
                
                # Section vs Sub-batch nesting
                if ttype == "section":
                    section_whole_vars.setdefault((d, t, tgid), []).append(v)
                elif ttype == "batch":
                    batch_vars.setdefault((d, t, tgid), []).append(v)

                # Student-level overlap for sections, batches, and elective groups
                if tgid in group_to_students:
                    for sid in group_to_students[tgid]:
                        student_slot_vars.setdefault((d, t, sid), []).append(v)

    # Apply Room Overlap
    for (d, t, rid), var_list in room_slot_vars.items():
        if len(var_list) > 1:
            model.Add(sum(var_list) <= 1)

    # Apply Teacher Overlap
    for (d, t, tid), var_list in teacher_slot_vars.items():
        if len(var_list) > 1:
            model.Add(sum(var_list) <= 1)

    # Apply Direct Target Cohort Overlap
    for (d, t, ttype, tgid), var_list in direct_target_vars.items():
        if len(var_list) > 1:
            model.Add(sum(var_list) <= 1)

    # Apply Section vs Constituent Batch nesting
    # A session for Section A conflicts with a session for its constituent Batch A1 at the same (d, t)
    for (d, t, sec_id), w_vars in section_whole_vars.items():
        for batch in batches:
            if batch["sectionId"] == sec_id:
                b_vars = batch_vars.get((d, t, batch["id"]), [])
                for wv in w_vars:
                    for bv in b_vars:
                        model.Add(wv + bv <= 1)

    # Apply Student-Level Overlap across Section, Batch, and Elective Cohorts (BE-09)
    for (d, t, sid), s_vars in student_slot_vars.items():
        if len(s_vars) > 1:
            model.Add(sum(s_vars) <= 1)

    # 5. Soft objectives: distribute classes evenly across days and balance teacher load (BE-08)
    penalties = []
    target_daily_avg = max(1, len(sessions) // len(days)) if days else 1

    for d in days:
        day_vars = []
        for i in range(len(sessions)):
            for sd, ss, sr, sv in session_vars[i]:
                if sd == d:
                    day_vars.append(sv)
        day_cnt = model.NewIntVar(0, len(sessions), f"day_count_{d}")
        model.Add(day_cnt == sum(day_vars))
        day_dev = model.NewIntVar(0, len(sessions), f"day_dev_{d}")
        model.Add(day_dev >= day_cnt - target_daily_avg)
        model.Add(day_dev >= target_daily_avg - day_cnt)
        penalties.append(day_dev * 10)

    # Teacher spread: penalize heavy concentration of sessions on any single day
    for t in teachers:
        tid = t["id"]
        for d in days:
            t_day_vars = []
            for i, sess in enumerate(sessions):
                if sess["teacherId"] == tid:
                    for sd, ss, sr, sv in session_vars[i]:
                        if sd == d:
                            t_day_vars.append(sv)
            if t_day_vars:
                t_cnt = model.NewIntVar(0, len(sessions), f"t_cnt_{tid}_{d}")
                model.Add(t_cnt == sum(t_day_vars))
                t_heavy = model.NewIntVar(0, len(sessions), f"t_heavy_{tid}_{d}")
                model.Add(t_heavy >= t_cnt - 4)
                penalties.append(t_heavy * 20)

    if penalties:
        model.Minimize(sum(penalties))

    # 6. Solve Model
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = time_limit_seconds
    solver.parameters.num_workers = 1 # Deterministic execution
    
    status = solver.Solve(model)
    solve_duration_ms = (time.time() - start_time) * 1000
    
    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        scheduled_classes = []
        class_id_counter = 1
        
        for i, sess in enumerate(sessions):
            for d, s, rid, v in session_vars[i]:
                if solver.Value(v) == 1:
                    scheduled_classes.append({
                        "id": f"gen-class-{class_id_counter}",
                        "courseOfferingId": sess["offeringId"],
                        "termId": sess["termId"],
                        "dayOfWeek": d,
                        "startSlot": s,
                        "duration": sess["duration"],
                        "activityType": sess["activityType"],
                        "teacherId": sess["teacherId"],
                        "roomId": rid,
                        "targetType": sess["targetType"],
                        "targetId": sess["targetId"],
                        "status": "scheduled"
                    })
                    class_id_counter += 1
                    break
                    
        return {
            "schemaVersion": "1.0.0",
            "packageId": package.get("packageId", "pkg-default"),
            "inputRevision": package.get("inputRevision", "rev-1"),
            "generatorVersion": "ortools-cp-sat-1.0.0",
            "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "status": "succeeded",
            "termIds": term_ids,
            "classes": scheduled_classes,
            "diagnostics": {
                "solveTimeMs": solve_duration_ms,
                "statusString": solver.StatusName(status),
                "conflicts": []
            }
        }
    else:
        return {
            "schemaVersion": "1.0.0",
            "packageId": package.get("packageId", "pkg-default"),
            "inputRevision": package.get("inputRevision", "rev-1"),
            "generatorVersion": "ortools-cp-sat-1.0.0",
            "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "status": "infeasible",
            "termIds": term_ids,
            "classes": [],
            "diagnostics": {
                "solveTimeMs": solve_duration_ms,
                "statusString": solver.StatusName(status),
                "conflicts": ["Constraints could not be satisfied simultaneously. Check room capacity, room types, or teacher availability."],
                "infeasibilityReason": "CP-SAT returned " + solver.StatusName(status)
            }
        }


def main():
    if len(sys.argv) < 3:
        print("Usage: python solver.py <input_package.json> <output_draft.json>")
        sys.exit(1)
        
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    with open(input_file, "r", encoding="utf-8") as f:
        pkg = json.load(f)
        
    result = solve_timetable(pkg)
    
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)
        
    print(f"Status: {result['status']}, Classes generated: {len(result.get('classes', []))}")


if __name__ == "__main__":
    main()
