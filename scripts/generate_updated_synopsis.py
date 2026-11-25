import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def create_element(name):
    return OxmlElement(name)

def set_cell_background(cell, fill_hex):
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=140, bottom=140, left=180, right=180):
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def set_table_borders(table, color="D1D5DB", sz="4", val="single"):
    tblPr = table._element.xpath('w:tblPr')
    if tblPr:
        borders = parse_xml(f'''
            <w:tblBorders {nsdecls("w")}>
                <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
                <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
                <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
                <w:left w:val="none"/>
                <w:right w:val="none"/>
                <w:insideV w:val="none"/>
            </w:tblBorders>
        ''')
        tblPr[0].append(borders)

def build_synopsis_docx(output_path):
    doc = Document()

    # Set page margins (Standard 1 inch)
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Styles & Colors
    PRIMARY = RGBColor(30, 41, 59)     # Deep Slate
    ACCENT = RGBColor(14, 116, 144)    # Cyan / Deep Teal (#0E7490)
    DARK_TEXT = RGBColor(51, 65, 85)   # Charcoal text
    MUTED = RGBColor(100, 116, 139)    # Slate Muted
    WHITE = RGBColor(255, 255, 255)

    # Header / Title Block
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(4)
    run_sub = title_p.add_run("PROJECT SYNOPSIS\n")
    run_sub.font.size = Pt(11)
    run_sub.font.bold = True
    run_sub.font.color.rgb = ACCENT

    run_main = title_p.add_run("TIMETABLE & CLASS MANAGEMENT SYSTEM (UTCMS)")
    run_main.font.size = Pt(22)
    run_main.font.bold = True
    run_main.font.color.rgb = PRIMARY

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(4)
    sub_p.paragraph_format.space_after = Pt(16)
    run_tag = sub_p.add_run("An Enterprise Relational Database System with Two-Tier Baseline/Daily Separation, Constraint-Driven Scheduling, Real-Time Rescheduling & Multi-Role Workflows")
    run_tag.font.size = Pt(10.5)
    run_tag.font.italic = True
    run_tag.font.color.rgb = DARK_TEXT

    # Meta Callout Table
    meta_table = doc.add_table(rows=1, cols=1)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_cell = meta_table.cell(0, 0)
    meta_cell.width = Inches(6.5)
    set_cell_background(meta_cell, "F1F5F9")
    set_cell_margins(meta_cell, top=140, bottom=140, left=180, right=180)
    
    mp = meta_cell.paragraphs[0]
    mp.paragraph_format.space_before = Pt(2)
    mp.paragraph_format.space_after = Pt(2)
    m_run = mp.add_run("Domain: ")
    m_run.bold = True
    m_run.font.size = Pt(9.5)
    mp.add_run("Database Management Systems (DBMS) & University Scheduling Architecture  |  ")
    m_run2 = mp.add_run("Stack: ")
    m_run2.bold = True
    m_run2.font.size = Pt(9.5)
    mp.add_run("PostgreSQL / Supabase, Node.js / TypeScript, Google OR-Tools CP-SAT\n")
    m_run3 = mp.add_run("Institution Target: ")
    m_run3.bold = True
    m_run3.font.size = Pt(9.5)
    mp.add_run("JK Lakshmipat University (JKLU)  |  ")
    m_run4 = mp.add_run("Status: ")
    m_run4.bold = True
    m_run4.font.size = Pt(9.5)
    mp.add_run("Production Hardened Mockup, Real-time Realized, Full ACID Transactions")

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    def add_section_heading(num_str, title_str):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run_num = p.add_run(num_str + " ")
        run_num.font.size = Pt(13)
        run_num.font.bold = True
        run_num.font.color.rgb = ACCENT
        run_title = p.add_run(title_str)
        run_title.font.size = Pt(13)
        run_title.font.bold = True
        run_title.font.color.rgb = PRIMARY
        return p

    def add_body_p(text, bold_prefix=None, space_after=6):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            run_b = p.add_run(bold_prefix)
            run_b.font.size = Pt(10)
            run_b.font.bold = True
            run_b.font.color.rgb = PRIMARY
        run = p.add_run(text)
        run.font.size = Pt(10)
        run.font.color.rgb = DARK_TEXT
        return p

    def add_bullet_p(title, text):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        run_b = p.add_run(title + ": ")
        run_b.font.size = Pt(10)
        run_b.font.bold = True
        run_b.font.color.rgb = PRIMARY
        run = p.add_run(text)
        run.font.size = Pt(10)
        run.font.color.rgb = DARK_TEXT
        return p

    # 1. INTRODUCTION
    add_section_heading("1.", "INTRODUCTION & BACKGROUND")
    add_body_p(
        "Managing collegiate academic timetables represents an intricate operational challenge in higher education. "
        "Academic administrators must reconcile multi-departmental curricula, finite venue capacities, specialized practical "
        "laboratory equipment, shared faculty availability, and student cohort constraints across concurrent semesters. In large "
        "university environments, even a localized modification—such as an urgent faculty absence or projector malfunction—triggers "
        "cascading timetable disruptions if unmonitored."
    )
    add_body_p(
        "The University Timetable and Class Management System (UTCMS) provides an enterprise relational database platform "
        "that centralizes scheduling, prevents scheduling collisions, and introduces an architectural decoupling between the static "
        "semester baseline schedule and dynamic, date-specific daily class occurrences. The platform integrates administrative planning, "
        "algorithmic conflict detection, atomic extra-class reservations, instant room-swaps/cancellations, and automated real-time "
        "notifications across student and faculty cohorts."
    )

    # 2. PROBLEM STATEMENT
    add_section_heading("2.", "PROBLEM STATEMENT")
    add_body_p(
        "Conventional collegiate timetable workflows rely heavily on distributed spreadsheets, physical noticeboards, and ad-hoc chat channels. "
        "This legacy approach introduces critical systemic deficiencies:"
    )
    add_bullet_p("Severe Concurrency & Clash Vulnerabilities", "When faculty arrange makeup sessions or when departments modify room allocations simultaneously, lack of transactional concurrency controls leads to double-booked venues, overlapping teacher commitments, and section conflicts.")
    add_bullet_p("Coupling of Semester Templates to Daily Realities", "Traditional systems treat a timetable as an inflexible master grid. If a single class is cancelled or swapped for one morning, administrators are either forced to overwrite the master semester template or announce changes informally, resulting in corrupted baseline records.")
    add_bullet_p("Manual Room & Slot Discovery Overhead", "Finding an unoccupied room matching specific capacity and room-type criteria (e.g., Computing Lab vs. Lecture Theatre) requires exhaustive manual cross-referencing.")
    add_bullet_p("Information Latency & Silent Cancellations", "Students frequently commute across campus only to find a venue locked or a class postponed due to lack of synchronized, reliable real-time notifications.")

    # 3. OBJECTIVES & ARCHITECTURAL HIGHLIGHTS
    add_section_heading("3.", "OBJECTIVES & UPDATED CAPABILITIES")
    add_body_p("The project accomplishes the following key technical and functional objectives:")
    add_bullet_p("Two-Tier Schedule Decoupling", "Architecturally isolate recurring semester patterns (scheduled_classes) from dated daily instances (class_occurrences). Daily adjustments never corrupt the official semester baseline.")
    add_bullet_p("Multi-Tier Conflict & Clashing Engine", "Enforce 5 strict hard invariants in real time: (1) Single-room occupancy per period, (2) Single-teacher assignment per period, (3) Section/Batch collision prevention, (4) Room capacity and equipment type verification (LT vs. Lab), and (5) Teacher availability policy compliance.")
    add_bullet_p("Atomic Rescheduling & Room Swaps", "Execute room reassignments and slot shifts within isolated database transactions. The system guarantees that either the new venue is locked and the old slot released cleanly, or the transaction rolls back without partial mutations.")
    add_bullet_p("Automated Extra Class Booking", "Provide an instant search algorithm that intersects faculty schedule, section free periods, and room availability to suggest valid 1-hour or 2-hour slots.")
    add_bullet_p("Auditability & Non-Repudiation", "Log every cancellation, room swap, extra class creation, and student cohort transfer in an append-only audit ledger (audit_events and class_occurrence_events).")
    add_bullet_p("Real-Time Notification Pipeline", "Dispatch instant alerts to affected student inboxes whenever a class occurrence is cancelled, rescheduled, or supplemented.")

    # 4. SYSTEM ARCHITECTURE & USER ROLES
    add_section_heading("4.", "SYSTEM ARCHITECTURE & USER WORKFLOWS")
    add_body_p(
        "The system employs a client-server architecture backed by a relational PostgreSQL database (Supabase), a high-performance "
        "Node.js/TypeScript backend API, and a server-rendered, accessible UI conforming to strict academic design standards (Zero Emojis, "
        "pastel course color taxonomy, and high contrast typography)."
    )
    add_bullet_p("Administrator Hub", "Controls academic terms, departments, venue master registries, faculty workload rules, course offerings, and baseline timetable versions. Has master authority to trigger OR-Tools solver runs, publish official drafts, and manage global overrides.")
    add_bullet_p("Faculty Portal", "Allows educators to view personal weekly schedules, submit unavailability/leave requests, identify conflict-free slots for makeup lectures, initiate class cancellations with recorded justification, and swap venues seamlessly.")
    add_bullet_p("Student Hub", "Provides a personalized, date-aware weekly grid reflecting active section and batch assignments. Cancelled classes appear with distinct strike-through pills and cancellation rationale; room swaps clearly indicate relocated venues. Includes an active notification inbox.")

    # 5. UPDATED RELATIONAL DATABASE MODEL
    add_section_heading("5.", "UPDATED RELATIONAL DATABASE MODEL")
    add_body_p(
        "The relational schema has been hardened beyond basic prototype entities into an enterprise-grade academic schema consisting "
        "of 18 structured relations supporting multi-tier foreign key integrity and ACID guarantees:"
    )

    # Relational Table
    table_data = [
        ("RELATION", "KEY ATTRIBUTES", "PURPOSE & INTEGRITY INVARIANTS"),
        ("ACADEMIC_TERMS", "id (PK), year_label, semester_number, start_date, end_date, cycle, status", "Defines temporal institutional boundaries (e.g. Odd Sem 2026-2027). Only one term is active at a time per cohort."),
        ("SECTIONS & BATCHES", "id (PK), term_id, name, expected_count, section_id", "Hierarchical student cohorts. Batches inherit section constraints for 2-hour lab divisions."),
        ("STUDENTS & MEMBERSHIPS", "id (PK), roll_number, name, email, group_id, group_type", "Maintains active student enrollment and maps students to primary sections, practical lab batches, and elective groups."),
        ("TEACHERS & AVAILABILITY", "id (PK), emp_id, name, email, day_of_week, slot_index, is_available", "Faculty records linked to weekly recurring availability matrices and administrative leave approvals."),
        ("ROOMS", "id (PK), room_number, building, floor, capacity, room_type, active", "Physical campus venues classified by type ('LT' for lectures, 'P' for practical labs) and seating limits."),
        ("COURSES & OFFERINGS", "id (PK), code, name, term_id, L-T-P hours, card_bg_color, teacher_id, target_id", "Academic curriculum catalog with L-T-P credits, assigned teachers, target sections, and color tags."),
        ("TIMETABLE_VERSIONS", "id (PK), term_id, version_number, status, published_at", "Immutable versioned timetable drafts ('draft', 'published', 'archived') preventing unapproved schedule churn."),
        ("SCHEDULED_CLASSES", "id (PK), version_id, course_offering_id, day_of_week, start_slot, duration, room_id", "The canonical recurring weekly baseline schedule. Governs standard timetable periods (Slots 1–7, Mon–Sat)."),
        ("CLASS_OCCURRENCES", "id (PK), recurring_class_id, date, start_slot, duration, room_id, status, replacement_id", "The concrete dated daily schedule. Tracks daily execution ('scheduled', 'cancelled', 'rescheduled') and overrides."),
        ("CLASS_OCCURRENCE_EVENTS", "id (PK), occurrence_id, event_type, reason, actor_id, created_at", "Immutable event history detailing why a class was cancelled or moved, capturing actor accountability."),
        ("EXTRA_CLASSES", "id (PK), term_id, course_id, teacher_id, room_id, date, slot, target_type, target_id", "One-off supplemental sessions scheduled atomically without disturbing recurring weekly patterns."),
        ("NOTIFICATION_OUTBOX", "id (PK), recipient_student_id, event_type, title, message, status, delivered_at", "Real-time notification queue dispatched upon occurrence updates, room swaps, or cancellations.")
    ]

    table = doc.add_table(rows=len(table_data), cols=3)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table)

    col_widths = [Inches(1.8), Inches(1.8), Inches(2.9)]

    for row_idx, data in enumerate(table_data):
        row = table.rows[row_idx]
        for col_idx, text in enumerate(data):
            cell = row.cells[col_idx]
            cell.width = col_widths[col_idx]
            set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
            cp = cell.paragraphs[0]
            cp.paragraph_format.space_before = Pt(2)
            cp.paragraph_format.space_after = Pt(2)
            cp.paragraph_format.line_spacing = 1.1

            if row_idx == 0:
                set_cell_background(cell, "0E7490") # Dark Teal
                run = cp.add_run(text)
                run.font.size = Pt(8.5)
                run.font.bold = True
                run.font.color.rgb = WHITE
            else:
                if row_idx % 2 == 1:
                    set_cell_background(cell, "F8FAFC")
                else:
                    set_cell_background(cell, "FFFFFF")
                run = cp.add_run(text)
                run.font.size = Pt(8.5)
                if col_idx == 0:
                    run.font.bold = True
                    run.font.color.rgb = PRIMARY
                else:
                    run.font.color.rgb = DARK_TEXT

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    add_body_p(
        "Key Relational Invariant: The database decouples SCHEDULED_CLASSES from CLASS_OCCURRENCES via foreign key linkage. "
        "A cancellation or venue swap updates solely the dated CLASS_OCCURRENCES tuple, recording the change in CLASS_OCCURRENCE_EVENTS "
        "and preserving the master SCHEDULED_CLASSES blueprint intact.",
        bold_prefix="Architectural Principle: "
    )

    # 6. MATHEMATICAL SOLVER & HARD CONSTRAINTS
    add_section_heading("6.", "MATHEMATICAL SOLVER & SCHEDULING CONSTRAINTS")
    add_body_p(
        "In addition to real-time administrative operations, UTCMS features integration with Google OR-Tools CP-SAT "
        "(Constraint Programming - Satisfiability) solver for automated, clash-free timetable generation:"
    )
    add_bullet_p("Hard Constraint: No Room Overlaps", "For every room r and time slot (day d, slot s), at most one scheduled class may occupy the venue: Σ X(c, r, d, s) ≤ 1.")
    add_bullet_p("Hard Constraint: No Faculty Overlaps", "A teacher t cannot conduct two simultaneous lectures or labs: Σ X(c, t, d, s) ≤ 1.")
    add_bullet_p("Hard Constraint: Cohort Integrity", "Students in section s or batch b cannot be scheduled for concurrent courses.")
    add_bullet_p("Hard Constraint: Consecutive Lab Blocks", "Practical laboratory components (activity_type = 'P') require 2 consecutive periods in matching technical facilities (room_type = 'P').")
    add_bullet_p("Hard Constraint: Teacher Unavailability", "Periods flagged as unavailable by faculty policies are strictly forbidden from assignment.")

    # 7. VERIFICATION & LIVE DEMONSTRATION DATASET
    add_section_heading("7.", "LIVE DEMONSTRATION DATASET & PRODUCTION HARDENING")
    add_body_p(
        "The system has been verified and populated with an authentic institutional dataset modeled after JK Lakshmipat University (JKLU), "
        "supporting live presentation workflows:"
    )
    add_bullet_p("Comprehensive Campus Registry", "22 physical venues (Aryabhata & Ramanujan Lecture Theatres LT-1 to LT-6, Academic Block Classrooms AB1/AB2, Computing Labs 1–4, AI Research Lab, and Seminar Halls), 26 faculty profiles, 16 multi-branch sections, and 32 lab batches.")
    add_bullet_p("Rich Timetable Grid", "139 conflict-free recurring classes across Odd Semesters 1, 3, 5, and 7, rendered with distinct accessible pastel color coding.")
    add_bullet_p("Demonstrated Live Overrides", "Live database contains active, pre-configured showcase states for presentation testing: 4 cancelled classes with official leave reasons and 4 rescheduled room-swaps (e.g., LT-1 moved to LT-4 due to projector maintenance).")
    add_bullet_p("Delivered Notifications", "33 personalized real-time notification records linked to student demo profiles (e.g., Charlie Brown and Yuvraj Singh Rathore).")

    # 8. CONCLUSION
    add_section_heading("8.", "CONCLUSION")
    add_body_p(
        "The modernized Timetable & Class Management System transforms collegiate scheduling from a static, fragile administrative task "
        "into a resilient, real-time enterprise service. By architecturally decoupling recurring semester patterns from dated daily operations, "
        "enforcing mathematical constraint validation, ensuring atomic transaction safety during reschedules, and providing instantaneous "
        "notification dispatch, UTCMS successfully resolves the chronic scheduling friction and communication delays inherent in traditional "
        "university environments."
    )

    doc.save(output_path)
    print(f"✓ Successfully generated updated synopsis document: {output_path}")

if __name__ == '__main__':
    out_file = '/home/ubuu/dbmain/bck2/Timetable_Management_System_Synopsis_Updated.docx'
    build_synopsis_docx(out_file)
