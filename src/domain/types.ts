/**
 * Domain types and interfaces for the University Timetable & Class Management System.
 * Source of truth: docs/01_MASTER_PRD.md, docs/04_SCHEDULING_DOMAIN_RULES.md, docs/05_DATA_MODEL.md
 */

export type RoomType = 'LT' | 'P';
export type ActivityType = 'L' | 'T' | 'P';
export type TargetGroupType = 'section' | 'batch' | 'elective_group';
export type OccurrenceStatus = 'scheduled' | 'cancelled' | 'rescheduled' | 'completed' | 'superseded';
export type VersionStatus = 'draft' | 'published' | 'superseded' | 'archived';
export type RequestStatus = 'pending' | 'confirmed' | 'rejected';
export type UserRole = 'student' | 'teacher' | 'admin';

export interface TimeSlot {
  dayOfWeek: number; // 1 = Monday, ..., 5 = Friday (or 7)
  slotIndex: number; // 1-based index within the day
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "10:00"
  isBreak?: boolean; // lunch or break slot
}

export interface TimetableGridConfig {
  days: number[]; // e.g. [1, 2, 3, 4, 5]
  slotsPerDay: number; // e.g. 8
  slots: TimeSlot[];
}

export interface AcademicTerm {
  id: string;
  yearLabel: string;
  semesterNumber: number; // 1 to 8
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  cycle: 'odd' | 'even';
  status: 'planned' | 'active' | 'closed';
}

export interface Room {
  id: string;
  roomNumber: string;
  building: string;
  floor: number;
  capacity: number;
  roomType: RoomType;
  active: boolean;
}

export interface Teacher {
  id: string;
  empId: string;
  name: string;
  email: string;
  department?: string;
  active: boolean;
}

export interface Section {
  id: string;
  termId: string;
  name: string; // e.g. "A"
  expectedCount: number;
  active: boolean;
}

export interface Batch {
  id: string;
  sectionId: string;
  name: string; // e.g. "A1"
  expectedCount: number;
  active: boolean;
}

export interface Student {
  id: string;
  rollNumber: string;
  name: string;
  email: string;
  active: boolean;
}

export interface StudentGroupMembership {
  id: string;
  studentId: string;
  groupId: string; // sectionId or batchId
  groupType: 'section' | 'batch';
  effectiveStartDate: string; // YYYY-MM-DD
  effectiveEndDate?: string | null; // YYYY-MM-DD or null if ongoing
}

export interface ElectiveGroup {
  id: string;
  termId: string;
  courseId: string;
  name: string; // e.g. "AI Elective Group 1"
  expectedCount?: number;
}

export interface ElectiveAssignment {
  id: string;
  studentId: string;
  electiveGroupId: string;
  assignedBy: string;
  assignedAt: string;
  status: 'active' | 'incompatible' | 'archived';
  incompatibilityReason?: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  termId: string;
  lectureHours: number;   // L
  tutorialHours: number;  // T
  practicalHours: number; // P
  requiredRoomType: RoomType;
  department?: string;
  cardBgColor?: string;
  fontColor?: string;
  borderColor?: string;
}

export interface CourseOffering {
  id: string;
  courseId: string;
  termId: string;
  teacherId: string;
  targetType: TargetGroupType;
  targetId: string;
  component?: ActivityType; // optional: 'L' (Lecture), 'T' (Tutorial), or 'P' (Practical). Undefined means all components.
}

export interface TeacherAvailability {
  id: string;
  teacherId: string;
  dayOfWeek: number;
  slotIndex: number;
  isAvailable: boolean;
}

export interface TeacherUnavailabilityRequest {
  id: string;
  teacherId: string;
  date: string; // YYYY-MM-DD
  startSlot: number;
  endSlot: number;
  reason?: string;
  status: RequestStatus;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface ScheduledClass {
  id: string;
  versionId: string;
  courseOfferingId: string;
  termId: string;
  dayOfWeek: number;
  startSlot: number;
  duration: number; // 1 for L/T, 2 for P
  activityType: ActivityType;
  teacherId: string;
  roomId: string;
  targetType: TargetGroupType;
  targetId: string;
  status: 'scheduled' | 'cancelled';
}

export interface ClassOccurrence {
  id: string;
  versionId: string;
  recurringClassId?: string; // null if extra class
  courseOfferingId: string;
  termId: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: number;
  startSlot: number;
  duration: number;
  activityType: ActivityType;
  teacherId: string;
  roomId: string;
  targetType: TargetGroupType;
  targetId: string;
  status: OccurrenceStatus;
  cancellationReason?: string;
  replacementOccurrenceId?: string;
  isExtraClass?: boolean;
  bookedByTeacherId?: string; // for extra class ownership
}

export interface TimetableVersion {
  id: string;
  termId: string;
  versionNumber: number;
  status: VersionStatus;
  inputRevision: string;
  createdBy: string;
  createdAt: string;
  publishedAt?: string;
  priorVersionId?: string;
}

export interface ValidationErrorDetail {
  code: string;
  message: string;
  field?: string;
  entityId?: string;
  conflictingEntityId?: string;
  slot?: number;
  dayOfWeek?: number;
  date?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationErrorDetail[];
}
