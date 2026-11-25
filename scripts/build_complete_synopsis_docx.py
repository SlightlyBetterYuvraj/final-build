import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

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

def build_synopsis():
    doc = Document()

    # Margins: Standard 1.0 inch
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Color Palette matching original styled PDF
    PRIMARY = RGBColor(15, 23, 42)      # Deep slate / Charcoal #0F172A
    ACCENT = RGBColor(14, 116, 144)     # Dark Teal / Cyan #0E7490
    DARK_TEXT = RGBColor(51, 65, 85)    # Slate body #334155
    WHITE = RGBColor(255, 255, 255)

    # ================= PAGE 1: TITLE & COVER =================
    # Top spacing
    p_top = doc.add_paragraph()
    p_top.paragraph_format.space_before = Pt(30)
    p_top.paragraph_format.space_after = Pt(10)

    # JKLU Logo
    logo_path = '/home/ubuu/dbmain/bck2/JK_Lakshmipat_University_Logo.jpg'
    if os.path.exists(logo_path):
        p_logo = doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo.paragraph_format.space_after = Pt(24)
        run_logo = p_logo.add_run()
        run_logo.add_picture(logo_path, width=Inches(1.8))

    # Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_after = Pt(6)
    r_title = p_title.add_run("TIMETABLE MANAGEMENT SYSTEM")
    r_title.font.size = Pt(26)
    r_title.font.bold = True
    r_title.font.color.rgb = PRIMARY

    # Subtitle
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(24)
    r_sub = p_sub.add_run("Project Synopsis")
    r_sub.font.size = Pt(16)
    r_sub.font.color.rgb = ACCENT

    # Tagline
    p_tag = doc.add_paragraph()
    p_tag.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_tag.paragraph_format.space_after = Pt(40)
    r_tag = p_tag.add_run(
        "A database-based system for managing college timetables, room availability, "
        "free time slots, extra classes, cancellations and rescheduling."
    )
    r_tag.font.size = Pt(11)
    r_tag.font.italic = True
    r_tag.font.color.rgb = DARK_TEXT

    # Footer note on cover
    p_foot = doc.add_paragraph()
    p_foot.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_foot.paragraph_format.space_before = Pt(80)
    r_foot = p_foot.add_run("Database Management System Project\nDepartment of Computer Science & Engineering")
    r_foot.font.size = Pt(11)
    r_foot.font.bold = True
    r_foot.font.color.rgb = PRIMARY

    doc.add_page_break()

    # Helper functions for sections
    def add_heading_1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.size = Pt(13)
        run.font.bold = True
        run.font.color.rgb = PRIMARY
        return p

    def add_body(text, space_after=6, italic=False, bold=False):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(text)
        run.font.size = Pt(10)
        run.font.color.rgb = DARK_TEXT
        run.font.italic = italic
        run.font.bold = bold
        return p

    def add_bullet(text):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(3.5)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(text)
        run.font.size = Pt(10)
        run.font.color.rgb = DARK_TEXT
        return p

    # ================= 1. INTRODUCTION =================
    add_heading_1("1. INTRODUCTION")
    add_body(
        "Managing a college timetable becomes difficult when many sections, teachers, rooms and "
        "classes have to be coordinated at the same time. Even a small change in one class can affect "
        "other schedules. The proposed Timetable Management System is designed to make this "
        "process simpler by keeping timetable information in one place and making it easier to check "
        "availability and manage changes."
    )
    add_body(
        "The system will allow faculty and administrators to work with the timetable while students can "
        "view their schedules and receive updates when a class is cancelled or rescheduled. It will also "
        "help faculty find a suitable free room and time slot when an extra class needs to be arranged."
    )

    # ================= 2. PROBLEM STATEMENT =================
    add_heading_1("2. PROBLEM STATEMENT")
    add_body(
        "In a conventional timetable system, checking whether a room or a particular time slot is "
        "available often requires manual coordination. This becomes more complicated when a teacher "
        "wants to arrange an additional class or when an existing class has to be moved. There is also "
        "a risk of creating clashes between a teacher, a section, a room and another scheduled class."
    )
    add_body(
        "Students may also miss important changes if cancellation or rescheduling information is not "
        "communicated quickly. The proposed system aims to reduce these problems by maintaining "
        "the timetable centrally and checking the existing schedule before a class is booked."
    )

    # ================= 3. OBJECTIVES =================
    add_heading_1("3. OBJECTIVES")
    add_bullet("Maintain timetable information in a centralized database.")
    add_bullet("Allow faculty to check which time slots are free for a particular section.")
    add_bullet("Allow faculty to check which rooms are free at a selected time.")
    add_bullet("Provide a way to schedule an additional class using an available slot and room.")
    add_bullet("Reduce timetable clashes involving teachers, rooms and sections.")
    add_bullet("Support cancellation and rescheduling of classes.")
    add_bullet("Notify affected students when an important timetable change is made.")
    add_bullet("Make timetable information easier to access for students, faculty and administrators.")

    # ================= 4. PROPOSED SYSTEM / MODEL =================
    add_heading_1("4. PROPOSED SYSTEM / MODEL")
    add_body(
        "The proposed system will store the main timetable data in a relational database. A scheduled "
        "class will connect the course, faculty member, section, room and time slot involved. When a "
        "faculty member wants to arrange an extra class, the system can check the existing timetable "
        "and show suitable free combinations of rooms and time slots."
    )
    add_body("Administrator", bold=True, space_after=2)
    add_body(
        "The administrator manages the basic information used by the timetable, such as students, "
        "sections, faculty, courses, rooms and time slots. The administrator can also maintain the main "
        "timetable."
    )
    add_body("Faculty", bold=True, space_after=2)
    add_body(
        "Faculty members can view their schedules, check the availability of a section, look for free "
        "rooms and schedule an additional class. They can also initiate cancellation or rescheduling of "
        "a class where the system permits it."
    )
    add_body("Students", bold=True, space_after=2)
    add_body(
        "Students can view the timetable associated with their section. When a class is cancelled or "
        "rescheduled, the system can provide a notification so that students do not have to depend only "
        "on manual communication."
    )

    # ================= 5. RELATIONAL MODEL =================
    add_heading_1("5. RELATIONAL MODEL")
    add_body(
        "The relational model is based on the entities represented in the ER design. The following "
        "relations form the main structure of the proposed database:"
    )

    # Original Table
    rel_data = [
        ("RELATION", "PURPOSE"),
        ("STUDENT", "Stores student information and the section to which a student belongs."),
        ("SECTION", "Stores the different academic sections used in the timetable."),
        ("FACULTY", "Stores faculty information used for assigning classes."),
        ("COURSE", "Stores information about courses or subjects."),
        ("ROOM", "Stores classrooms and other rooms that can be assigned to classes."),
        ("TIME_SLOT", "Stores the available timetable periods."),
        ("CLASS", "Stores scheduled classes and connects faculty, course, section, room and time slot."),
        ("NOTIFICATION", "Stores or represents timetable-related notifications sent to affected students.")
    ]

    table_orig = doc.add_table(rows=len(rel_data), cols=2)
    table_orig.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table_orig)

    col_widths_orig = [Inches(2.0), Inches(4.5)]
    for r_idx, (rel_name, rel_desc) in enumerate(rel_data):
        row = table_orig.rows[r_idx]
        for c_idx, val in enumerate([rel_name, rel_desc]):
            cell = row.cells[c_idx]
            cell.width = col_widths_orig[c_idx]
            set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
            cp = cell.paragraphs[0]
            cp.paragraph_format.space_before = Pt(2)
            cp.paragraph_format.space_after = Pt(2)
            cp.paragraph_format.line_spacing = 1.15
            if r_idx == 0:
                set_cell_background(cell, "0E7490")
                r = cp.add_run(val)
                r.font.size = Pt(9)
                r.font.bold = True
                r.font.color.rgb = WHITE
            else:
                if r_idx % 2 == 1:
                    set_cell_background(cell, "F8FAFC")
                else:
                    set_cell_background(cell, "FFFFFF")
                r = cp.add_run(val)
                r.font.size = Pt(9)
                if c_idx == 0:
                    r.font.bold = True
                    r.font.color.rgb = PRIMARY
                else:
                    r.font.color.rgb = DARK_TEXT

    doc.add_paragraph().paragraph_format.space_after = Pt(6)
    add_body(
        "Central role of CLASS: The CLASS relation represents an actual scheduled class and links the "
        "relevant faculty, course, section, room and time slot. Availability can therefore be calculated from "
        "the classes already scheduled instead of maintaining a separate list of supposedly free rooms or slots."
    )

    # ================= 6. ER MODEL / ARCHITECTURE =================
    add_heading_1("6. ER MODEL & ARCHITECTURAL DIAGRAM")
    add_body(
        "The ER model represents the entities and relationships used to design the database. It "
        "provides the structure from which the relational tables can be derived."
    )

    # Insert Extracted ER Model / Architecture Diagram Image
    er_img_path = '/home/ubuu/dbmain/bck2/pdf_img-000.png'
    if os.path.exists(er_img_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(8)
        p_img.paragraph_format.space_after = Pt(8)
        run_img = p_img.add_run()
        run_img.add_picture(er_img_path, width=Inches(6.2))

    add_body(
        "The important relationships in the model represent how students belong to sections, faculty "
        "members conduct classes, courses are scheduled for sections, and each class occupies a "
        "room and time slot. Notifications are associated with timetable changes so that affected "
        "students can be informed."
    )

    # ================= 7. CONCLUSION (ORIGINAL) =================
    add_heading_1("7. CONCLUSION (ORIGINAL SCOPE)")
    add_body(
        "The Timetable Management System provides a practical way of handling common timetable "
        "problems in a college. Instead of relying on manual checking and communication, the system "
        "keeps the required information together and uses it to find available rooms and slots, schedule "
        "additional classes and manage timetable changes. "
        "This approach can make timetable management more organized for administrators and faculty "
        "while giving students clearer and more timely information about their classes."
    )

    doc.add_page_break()

    # ================= 8. UPDATED ARCHITECTURAL ENHANCEMENTS & PRODUCTION ADDITIONS =================
    add_heading_1("8. RECENT ARCHITECTURAL & IMPLEMENTATION ENHANCEMENTS")
    add_body(
        "During progressive engineering and production hardening for JK Lakshmipat University (JKLU), "
        "the foundational model was significantly upgraded to enterprise database and scheduling standards:"
    )

    add_body("8.1 Two-Tier Architecture: Recurring Baseline vs. Daily Occurrences", bold=True, space_after=3)
    add_body(
        "In production collegiate environments, a timetable is not a static monolith. The system architecturally "
        "decouples recurring weekly semester schedules (scheduled_classes) from concrete, dated daily class instances "
        "(class_occurrences). Daily exceptions—such as an urgent faculty leave, room maintenance, or makeup session—are "
        "recorded as localized overrides on specific calendar dates. The canonical semester baseline remains completely "
        "unaltered, eliminating schedule corruption and historical drift."
    )

    add_body("8.2 Google OR-Tools Mathematical Solver & Multi-Tier Constraints", bold=True, space_after=3)
    add_body(
        "To eliminate human error during semester initialization, the system integrates the Google OR-Tools CP-SAT "
        "(Constraint Programming - Satisfiability) solver engine. The solver programmatically guarantees 5 core invariants:"
    )
    add_bullet("Room Exclusivity: No room is double-booked for any given day and period.")
    add_bullet("Teacher Exclusivity: Faculty members are never allocated to overlapping lectures or lab sessions.")
    add_bullet("Cohort Non-Collision: Concurrent compulsory courses are never assigned to the same section or batch.")
    add_bullet("Consecutive 2-Hour Practical Blocks: Laboratory courses (activity_type = 'P') are scheduled in uninterrupted 2-period blocks in designated computing or engineering labs.")
    add_bullet("Faculty Availability Policies: Teacher unavailability requests and working-hour thresholds are respected as strict boundaries.")

    add_body("8.3 Production-Hardened Relational Database Schema", bold=True, space_after=3)
    add_body(
        "The schema was expanded from the initial basic entities into a comprehensive 18-table relational architecture "
        "with full foreign key cascading, check constraints, and transactional isolation in PostgreSQL (Supabase):"
    )

    # Detailed Production Schema Table
    hardened_data = [
        ("RELATION", "ATTRIBUTES", "ENHANCED ROLE & INTEGRITY CONSTRAINTS"),
        ("ACADEMIC_TERMS", "id, year_label, semester_number, start_date, end_date, cycle, status", "Governs institutional semester lifecycles; guarantees only active terms generate dated occurrences."),
        ("SECTIONS & BATCHES", "id, term_id, name, expected_count, section_id", "Hierarchical student cohort management supporting lecture sections and practical lab batch divisions."),
        ("TEACHERS & AVAILABILITY", "id, emp_id, name, email, day_of_week, slot_index, is_available", "Faculty registry linked to individual availability policies and leave requests."),
        ("ROOMS", "id, room_number, building, floor, capacity, room_type", "Venues tagged by facility type ('LT' for Lecture Theatre, 'P' for Lab) and maximum capacity."),
        ("COURSES & OFFERINGS", "id, code, name, term_id, L-T-P hours, teacher_id, target_id, card_bg_color", "Full curriculum specifications with distinct pastel color tags for clean visual scanning."),
        ("TIMETABLE_VERSIONS", "id, term_id, version_number, status, published_at", "Immutable version control ('draft', 'published', 'archived') preventing unauthorized timetable edits."),
        ("SCHEDULED_CLASSES", "id, version_id, course_offering_id, day_of_week, start_slot, duration, room_id", "The recurring baseline weekly timetable template (Mon–Sat, Slots 1–7)."),
        ("CLASS_OCCURRENCES", "id, recurring_class_id, date, start_slot, duration, room_id, status, replacement_id", "Dated daily instances. Tracks active operational state ('scheduled', 'cancelled', 'rescheduled')."),
        ("CLASS_OCCURRENCE_EVENTS", "id, occurrence_id, event_type, reason, actor_id, created_at", "Immutable audit ledger recording the reason and author of every cancellation or venue change."),
        ("EXTRA_CLASSES", "id, term_id, course_id, teacher_id, room_id, date, slot, target_id", "Atomic reservation of ad-hoc remedial or guest lecture sessions."),
        ("NOTIFICATION_OUTBOX", "id, recipient_student_id, event_type, title, message, status, delivered_at", "Real-time student notification queue dispatched on cancellations, reschedulings, or extra classes.")
    ]

    table_hard = doc.add_table(rows=len(hardened_data), cols=3)
    table_hard.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table_hard)

    col_widths_hard = [Inches(1.8), Inches(1.8), Inches(2.9)]
    for r_idx, row_vals in enumerate(hardened_data):
        row = table_hard.rows[r_idx]
        for c_idx, val in enumerate(row_vals):
            cell = row.cells[c_idx]
            cell.width = col_widths_hard[c_idx]
            set_cell_margins(cell, top=90, bottom=90, left=130, right=130)
            cp = cell.paragraphs[0]
            cp.paragraph_format.space_before = Pt(2)
            cp.paragraph_format.space_after = Pt(2)
            cp.paragraph_format.line_spacing = 1.1
            if r_idx == 0:
                set_cell_background(cell, "0E7490")
                r = cp.add_run(val)
                r.font.size = Pt(8.5)
                r.font.bold = True
                r.font.color.rgb = WHITE
            else:
                if r_idx % 2 == 1:
                    set_cell_background(cell, "F8FAFC")
                else:
                    set_cell_background(cell, "FFFFFF")
                r = cp.add_run(val)
                r.font.size = Pt(8.5)
                if c_idx == 0:
                    r.font.bold = True
                    r.font.color.rgb = PRIMARY
                else:
                    r.font.color.rgb = DARK_TEXT

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # ================= 9. LIVE POPULATED DEMONSTRATION DATASET =================
    add_heading_1("9. LIVE PRESENTATION DATASET & SHOWCASE OVERRIDES")
    add_body(
        "To validate the system under real-world conditions and demonstrate viewing, cancelling, rescheduling, "
        "and notification mechanisms, the live PostgreSQL database has been populated with a comprehensive, "
        "idempotent dataset modeled after JK Lakshmipat University (JKLU):"
    )
    add_bullet("4 Academic Terms: Active Odd Semesters 1, 3, 5, and 7 (Academic Year 2026-2027).")
    add_bullet("22 JKLU Campus Venues: Lecture Theatres LT-1 to LT-6 (Aryabhata & Ramanujan Blocks), Academic Classrooms AB1/AB2, Computing Labs 1–4, VLSI/VHDL Lab, AI Research Lab, and Seminar Halls A & B.")
    add_bullet("16 Multi-Branch Sections & 32 Batches: Spanning B.Tech CSE, AI&DS, ECE, BBA, and B.Des cohorts.")
    add_bullet("26 Realistic Faculty Profiles: Configured with official departmental emails and designated course allocations.")
    add_bullet("64 Enrolled Student Profiles & 128 Group Memberships: Preserving presentation demo personas (Charlie Brown stud-1 & Yuvraj Singh Rathore 2025Btech290).")
    add_bullet("139 Scheduled Recurring Classes & 141 Class Occurrences: High-density, clash-free period grid across Monday through Saturday.")
    add_bullet("4 Pre-Configured Cancelled Showcases: Demonstrating instant strike-through badges and cancellation reasons (e.g. CS201 faculty on leave, CS301 guest lecture in auditorium).")
    add_bullet("4 Pre-Configured Rescheduled Room-Swaps: Demonstrating zero-collision room swaps with replacement occurrence pointers (e.g. EC201 swapped from LT-1 to LT-4 due to projector calibration).")
    add_bullet("33 Real-Time In-App Notifications: Staggered delivered alerts notifying students of venue swaps, cancelled periods, and extra practical review sessions.")

    # ================= 10. REVISED CONCLUSION =================
    add_heading_1("10. REVISED CONCLUSION & SUMMARY")
    add_body(
        "The finalized Timetable & Class Management System achieves a complete, robust transformation of academic scheduling. "
        "By grounding daily operations in rigorous relational invariants, mathematical optimization, two-tier schedule separation, "
        "and instant notification distribution, the system ensures collegiate institutions maintain reliable, clash-free schedules "
        "while seamlessly adapting to day-to-day campus dynamics."
    )

    output_path = '/home/ubuu/Downloads/Timetable_Management_System_Synopsis_Formatted (1).docx'
    doc.save(output_path)
    print(f"✓ Successfully generated updated synopsis directly at: {output_path}")

    # Also save to current workspace for safety
    backup_path = '/home/ubuu/dbmain/bck2/Timetable_Management_System_Synopsis_Formatted.docx'
    doc.save(backup_path)
    print(f"✓ Backup saved at: {backup_path}")

if __name__ == '__main__':
    build_synopsis()
