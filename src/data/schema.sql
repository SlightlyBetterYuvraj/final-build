-- ====================================================================
-- PostgreSQL / Supabase Authoritative Schema
-- University Timetable & Class Management System
-- Source of truth: docs/05_DATA_MODEL.md, docs/08_SECURITY_CONFIG_AND_OPERATIONS.md
-- NOTE: Additive and safe migrations only. No DROP TABLE or TRUNCATE.
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 1. Academic Structure
CREATE TABLE IF NOT EXISTS academic_terms (
    id VARCHAR(64) PRIMARY KEY,
    year_label VARCHAR(64) NOT NULL,
    semester_number INT NOT NULL CHECK (semester_number BETWEEN 1 AND 8),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    cycle VARCHAR(16) NOT NULL CHECK (cycle IN ('odd', 'even')),
    status VARCHAR(16) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_term_dates CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS sections (
    id VARCHAR(64) PRIMARY KEY,
    term_id VARCHAR(64) NOT NULL REFERENCES academic_terms(id),
    name VARCHAR(32) NOT NULL,
    expected_count INT NOT NULL DEFAULT 60,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS batches (
    id VARCHAR(64) PRIMARY KEY,
    section_id VARCHAR(64) NOT NULL REFERENCES sections(id),
    name VARCHAR(32) NOT NULL,
    expected_count INT NOT NULL DEFAULT 30,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(64) PRIMARY KEY,
    roll_number VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    email VARCHAR(128) UNIQUE NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_group_memberships (
    id VARCHAR(64) PRIMARY KEY,
    student_id VARCHAR(64) NOT NULL REFERENCES students(id),
    group_id VARCHAR(64) NOT NULL,
    group_type VARCHAR(16) NOT NULL CHECK (group_type IN ('section', 'batch')),
    effective_start_date DATE NOT NULL,
    effective_end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_membership_dates CHECK (effective_end_date IS NULL OR effective_end_date >= effective_start_date)
);

CREATE INDEX IF NOT EXISTS idx_sgm_student_dates ON student_group_memberships(student_id, effective_start_date, effective_end_date);

CREATE TABLE IF NOT EXISTS elective_groups (
    id VARCHAR(64) PRIMARY KEY,
    term_id VARCHAR(64) NOT NULL REFERENCES academic_terms(id),
    course_id VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    expected_count INT DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS elective_assignments (
    id VARCHAR(64) PRIMARY KEY,
    student_id VARCHAR(64) NOT NULL REFERENCES students(id),
    elective_group_id VARCHAR(64) NOT NULL REFERENCES elective_groups(id),
    status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'incompatible', 'archived')),
    incompatibility_reason TEXT,
    assigned_by VARCHAR(64) NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_student_elective UNIQUE(student_id, elective_group_id)
);

-- 2. Teaching Resources & Rooms
CREATE TABLE IF NOT EXISTS teachers (
    id VARCHAR(64) PRIMARY KEY,
    emp_id VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    email VARCHAR(128) UNIQUE NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rooms (
    id VARCHAR(64) PRIMARY KEY,
    room_number VARCHAR(32) NOT NULL,
    building VARCHAR(64) NOT NULL,
    floor INT NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    room_type VARCHAR(8) NOT NULL CHECK (room_type IN ('LT', 'P')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_room_location UNIQUE (building, room_number)
);

CREATE TABLE IF NOT EXISTS teacher_availability (
    id VARCHAR(64) PRIMARY KEY,
    teacher_id VARCHAR(64) NOT NULL REFERENCES teachers(id),
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    slot_index INT NOT NULL CHECK (slot_index > 0),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_teacher_slot UNIQUE (teacher_id, day_of_week, slot_index)
);

CREATE TABLE IF NOT EXISTS teacher_unavailability_requests (
    id VARCHAR(64) PRIMARY KEY,
    teacher_id VARCHAR(64) NOT NULL REFERENCES teachers(id),
    date DATE NOT NULL,
    start_slot INT NOT NULL,
    end_slot INT NOT NULL,
    reason TEXT,
    status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by VARCHAR(64),
    reviewed_at TIMESTAMPTZ,
    CONSTRAINT check_req_slots CHECK (end_slot >= start_slot)
);

-- 3. Courses and Offerings
CREATE TABLE IF NOT EXISTS courses (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    term_id VARCHAR(64) NOT NULL REFERENCES academic_terms(id),
    lecture_hours INT NOT NULL DEFAULT 0,
    tutorial_hours INT NOT NULL DEFAULT 0,
    practical_hours INT NOT NULL DEFAULT 0,
    required_room_type VARCHAR(8) NOT NULL CHECK (required_room_type IN ('LT', 'P')),
    card_bg_color TEXT,
    font_color TEXT,
    border_color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_course_hours CHECK (lecture_hours >= 0 AND tutorial_hours >= 0 AND practical_hours >= 0)
);

CREATE TABLE IF NOT EXISTS course_offerings (
    id VARCHAR(64) PRIMARY KEY,
    course_id VARCHAR(64) NOT NULL REFERENCES courses(id),
    term_id VARCHAR(64) NOT NULL REFERENCES academic_terms(id),
    teacher_id VARCHAR(64) NOT NULL REFERENCES teachers(id),
    target_type VARCHAR(16) NOT NULL CHECK (target_type IN ('section', 'batch', 'elective_group')),
    target_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Timetable Versions and Scheduling
CREATE TABLE IF NOT EXISTS timetable_versions (
    id VARCHAR(64) PRIMARY KEY,
    term_id VARCHAR(64) NOT NULL REFERENCES academic_terms(id),
    version_number INT NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'superseded', 'archived')),
    input_revision VARCHAR(64) NOT NULL,
    created_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    prior_version_id VARCHAR(64) REFERENCES timetable_versions(id)
);

CREATE TABLE IF NOT EXISTS scheduled_classes (
    id VARCHAR(64) PRIMARY KEY,
    version_id VARCHAR(64) NOT NULL REFERENCES timetable_versions(id),
    course_offering_id VARCHAR(64) NOT NULL REFERENCES course_offerings(id),
    term_id VARCHAR(64) NOT NULL REFERENCES academic_terms(id),
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    start_slot INT NOT NULL,
    duration INT NOT NULL CHECK (duration IN (1, 2)),
    activity_type VARCHAR(8) NOT NULL CHECK (activity_type IN ('L', 'T', 'P')),
    teacher_id VARCHAR(64) NOT NULL REFERENCES teachers(id),
    room_id VARCHAR(64) NOT NULL REFERENCES rooms(id),
    target_type VARCHAR(16) NOT NULL CHECK (target_type IN ('section', 'batch', 'elective_group')),
    target_id VARCHAR(64) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS class_occurrences (
    id VARCHAR(64) PRIMARY KEY,
    version_id VARCHAR(64) NOT NULL REFERENCES timetable_versions(id),
    recurring_class_id VARCHAR(64) REFERENCES scheduled_classes(id),
    course_offering_id VARCHAR(64) NOT NULL REFERENCES course_offerings(id),
    term_id VARCHAR(64) NOT NULL REFERENCES academic_terms(id),
    date DATE NOT NULL,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    start_slot INT NOT NULL,
    duration INT NOT NULL CHECK (duration IN (1, 2)),
    activity_type VARCHAR(8) NOT NULL CHECK (activity_type IN ('L', 'T', 'P')),
    teacher_id VARCHAR(64) NOT NULL REFERENCES teachers(id),
    room_id VARCHAR(64) NOT NULL REFERENCES rooms(id),
    target_type VARCHAR(16) NOT NULL CHECK (target_type IN ('section', 'batch', 'elective_group')),
    target_id VARCHAR(64) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'rescheduled', 'completed')),
    cancellation_reason TEXT,
    replacement_occurrence_id VARCHAR(64) REFERENCES class_occurrences(id),
    is_extra_class BOOLEAN NOT NULL DEFAULT FALSE,
    booked_by_teacher_id VARCHAR(64) REFERENCES teachers(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_co_date_slot ON class_occurrences(date, start_slot);
CREATE INDEX IF NOT EXISTS idx_co_teacher ON class_occurrences(teacher_id, date);
CREATE INDEX IF NOT EXISTS idx_co_room ON class_occurrences(room_id, date);

-- Exclusion constraints using btree_gist to guarantee concurrency double-booking prevention in multi-worker setups (BE-14)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'no_room_slot_double_booking'
    ) THEN
        ALTER TABLE class_occurrences ADD CONSTRAINT no_room_slot_double_booking
        EXCLUDE USING gist (
            room_id WITH =,
            date WITH =,
            int4range(start_slot, start_slot + duration) WITH &&
        ) WHERE (status = 'scheduled');
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'no_teacher_slot_double_booking'
    ) THEN
        ALTER TABLE class_occurrences ADD CONSTRAINT no_teacher_slot_double_booking
        EXCLUDE USING gist (
            teacher_id WITH =,
            date WITH =,
            int4range(start_slot, start_slot + duration) WITH &&
        ) WHERE (status = 'scheduled');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS class_occurrence_events (
    id VARCHAR(64) PRIMARY KEY,
    occurrence_id VARCHAR(64) NOT NULL REFERENCES class_occurrences(id),
    event_type VARCHAR(32) NOT NULL CHECK (event_type IN ('cancelled', 'rescheduled', 'room_changed', 'teacher_changed', 'replacement')),
    prior_payload JSONB,
    new_payload JSONB,
    reason TEXT,
    actor_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Extra Classes
CREATE TABLE IF NOT EXISTS extra_classes (
    id VARCHAR(64) PRIMARY KEY,
    date DATE NOT NULL,
    course_offering_id VARCHAR(64) NOT NULL REFERENCES course_offerings(id),
    activity_type VARCHAR(8) NOT NULL CHECK (activity_type IN ('L', 'T', 'P')),
    teacher_id VARCHAR(64) NOT NULL REFERENCES teachers(id),
    room_id VARCHAR(64) NOT NULL REFERENCES rooms(id),
    start_slot INT NOT NULL,
    duration INT NOT NULL CHECK (duration IN (1, 2)),
    target_type VARCHAR(16) NOT NULL CHECK (target_type IN ('section', 'batch', 'elective_group')),
    target_id VARCHAR(64) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'rescheduled')),
    booking_teacher_id UUID REFERENCES auth.users(id),
    booked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exclusion constraints using btree_gist for extra classes (BE-14)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'no_extra_room_double_booking'
    ) THEN
        ALTER TABLE extra_classes ADD CONSTRAINT no_extra_room_double_booking
        EXCLUDE USING gist (
            room_id WITH =,
            date WITH =,
            int4range(start_slot, start_slot + duration) WITH &&
        ) WHERE (status = 'scheduled');
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'no_extra_teacher_double_booking'
    ) THEN
        ALTER TABLE extra_classes ADD CONSTRAINT no_extra_teacher_double_booking
        EXCLUDE USING gist (
            teacher_id WITH =,
            date WITH =,
            int4range(start_slot, start_slot + duration) WITH &&
        ) WHERE (status = 'scheduled');
    END IF;
END $$;

-- 6. User Profiles (Authoritative Supabase Auth mapping)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    entity_id TEXT, -- References student_id or teacher_id where applicable
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Legacy test fixture table (kept for backward compatibility with local mocks)
CREATE TABLE IF NOT EXISTS user_profiles (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(128) UNIQUE NOT NULL,
    role VARCHAR(16) NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    linked_id VARCHAR(64),
    password_hash VARCHAR(256) NOT NULL,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Audit & Notification Outbox
CREATE TABLE IF NOT EXISTS audit_events (
    id VARCHAR(64) PRIMARY KEY,
    actor_id VARCHAR(64) NOT NULL,
    action VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    outcome VARCHAR(16) NOT NULL CHECK (outcome IN ('success', 'failure')),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_outbox (
    id VARCHAR(64) PRIMARY KEY,
    recipient_student_id VARCHAR(64) NOT NULL REFERENCES students(id),
    event_type VARCHAR(64) NOT NULL,
    title VARCHAR(256) NOT NULL,
    message TEXT NOT NULL,
    entity_type VARCHAR(64),
    entity_id VARCHAR(64),
    payload JSONB,
    status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed')),
    retry_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_outbox_pending ON notification_outbox(status) WHERE status = 'pending';

-- ====================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Helper functions for RLS checks
CREATE OR REPLACE FUNCTION get_auth_role()
RETURNS TEXT LANGUAGE SQL STABLE AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_auth_entity_id()
RETURNS TEXT LANGUAGE SQL STABLE AS $$
    SELECT entity_id FROM profiles WHERE id = auth.uid();
$$;

-- Enable RLS on profiles and scheduling tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE extra_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
-- Users can read their own profile; admins can read all profiles
DROP POLICY IF EXISTS profiles_select_policy ON profiles;
CREATE POLICY profiles_select_policy ON profiles
    FOR SELECT USING (auth.uid() = id OR get_auth_role() = 'admin');

-- Only admins can insert or update user profiles
DROP POLICY IF EXISTS profiles_insert_policy ON profiles;
CREATE POLICY profiles_insert_policy ON profiles
    FOR INSERT WITH CHECK (get_auth_role() = 'admin');

DROP POLICY IF EXISTS profiles_update_policy ON profiles;
CREATE POLICY profiles_update_policy ON profiles
    FOR UPDATE USING (get_auth_role() = 'admin') WITH CHECK (get_auth_role() = 'admin');

-- 2. Scheduled Classes Policies
-- Public/students/teachers can read published classes; admins can read all
DROP POLICY IF EXISTS sc_select_policy ON scheduled_classes;
CREATE POLICY sc_select_policy ON scheduled_classes
    FOR SELECT USING (
        version_id IN (SELECT id FROM timetable_versions WHERE status = 'published')
        OR get_auth_role() = 'admin'
    );

-- Only admins can modify scheduled_classes
DROP POLICY IF EXISTS sc_admin_all ON scheduled_classes;
CREATE POLICY sc_admin_all ON scheduled_classes
    FOR ALL USING (get_auth_role() = 'admin') WITH CHECK (get_auth_role() = 'admin');

-- 3. Class Occurrences Policies
-- Public/students/teachers can read published occurrences; admins can read all
DROP POLICY IF EXISTS co_select_policy ON class_occurrences;
CREATE POLICY co_select_policy ON class_occurrences
    FOR SELECT USING (
        version_id IN (SELECT id FROM timetable_versions WHERE status = 'published')
        OR get_auth_role() = 'admin'
    );

-- Only teachers can modify their assigned occurrences; admins can modify any
DROP POLICY IF EXISTS co_teacher_update_policy ON class_occurrences;
CREATE POLICY co_teacher_update_policy ON class_occurrences
    FOR UPDATE USING (
        (get_auth_role() = 'teacher' AND teacher_id = get_auth_entity_id())
        OR get_auth_role() = 'admin'
    ) WITH CHECK (
        (get_auth_role() = 'teacher' AND teacher_id = get_auth_entity_id())
        OR get_auth_role() = 'admin'
    );

DROP POLICY IF EXISTS co_admin_modify_policy ON class_occurrences;
CREATE POLICY co_admin_modify_policy ON class_occurrences
    FOR ALL USING (get_auth_role() = 'admin') WITH CHECK (get_auth_role() = 'admin');

-- 4. Extra Classes Policies
-- Teachers and students can read extra classes
DROP POLICY IF EXISTS ec_select_policy ON extra_classes;
CREATE POLICY ec_select_policy ON extra_classes
    FOR SELECT USING (
        get_auth_role() IN ('teacher', 'admin')
        OR true
    );

-- Teachers and admins can insert extra classes
DROP POLICY IF EXISTS ec_insert_policy ON extra_classes;
CREATE POLICY ec_insert_policy ON extra_classes
    FOR INSERT WITH CHECK (
        get_auth_role() IN ('teacher', 'admin')
    );

-- Teachers can update/cancel extra classes where booking_teacher_id = auth.uid(); admins can manage all
DROP POLICY IF EXISTS ec_teacher_update_policy ON extra_classes;
CREATE POLICY ec_teacher_update_policy ON extra_classes
    FOR UPDATE USING (
        (get_auth_role() = 'teacher' AND booking_teacher_id = auth.uid())
        OR get_auth_role() = 'admin'
    ) WITH CHECK (
        (get_auth_role() = 'teacher' AND booking_teacher_id = auth.uid())
        OR get_auth_role() = 'admin'
    );

DROP POLICY IF EXISTS ec_admin_all ON extra_classes;
CREATE POLICY ec_admin_all ON extra_classes
    FOR ALL USING (get_auth_role() = 'admin') WITH CHECK (get_auth_role() = 'admin');

-- 5. Audit Events Policies
-- Read-only for admins; insert allowed only by trusted server service-role
DROP POLICY IF EXISTS audit_select_admin ON audit_events;
CREATE POLICY audit_select_admin ON audit_events
    FOR SELECT USING (get_auth_role() = 'admin');

-- 6. Notification Outbox Policies (D05, D22)
-- Enforce row-level security for student notification inbox
ALTER TABLE notification_outbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS outbox_student_policy ON notification_outbox;
CREATE POLICY outbox_student_policy ON notification_outbox
    FOR SELECT USING (true);

DROP POLICY IF EXISTS outbox_admin_all ON notification_outbox;
CREATE POLICY outbox_admin_all ON notification_outbox
    FOR ALL USING (get_auth_role() = 'admin') WITH CHECK (get_auth_role() = 'admin');

-- 7. Supabase Realtime Publication Replication (D05, D22, Phase 1 Real-Time)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND tablename = 'class_occurrences'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE class_occurrences;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND tablename = 'notification_outbox'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE notification_outbox;
        END IF;
    END IF;
END $$;

