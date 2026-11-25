/**
 * Subagent 1: Comprehensive Auth, Core Flows & Cross-Role State Verifier
 * Tests against live server at http://localhost:3000 and generator at http://localhost:5001.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const GENERATOR_URL = process.env.GENERATOR_URL || 'http://localhost:5001';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function assert(suite: string, name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({ suite, name, passed: true, durationMs: Date.now() - start });
    console.log(`  [PASS] ${name} (${Date.now() - start}ms)`);
  } catch (err: any) {
    results.push({ suite, name, passed: false, error: err.message, durationMs: Date.now() - start });
    console.error(`  [FAIL] ${name}: ${err.message} (${Date.now() - start}ms)`);
  }
}

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  let body: any = null;
  const text = await res.text();
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, headers: res.headers, body };
}

async function runAllTests() {
  console.log(`=======================================================`);
  console.log(`Starting Subagent 1 Live Verification on ${BASE_URL}`);
  console.log(`=======================================================\n`);

  // Tokens for actors
  let adminToken = '';
  let teacherToken = '';
  let studentToken = '';

  let adminUser: any = null;
  let teacherUser: any = null;
  let studentUser: any = null;

  // =========================================================================
  // 1. AUTH & RBAC VERIFICATION FOR EVERY ROLE
  // =========================================================================
  console.log(`--- SUITE 1: Auth & RBAC for EVERY role ---`);

  await assert('Auth & RBAC', 'Admin login with AdminPass#2026!', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@university.edu', password: 'AdminPass#2026!' }),
    });
    if (res.status !== 200 || !res.body.success || !res.body.token) {
      throw new Error(`Admin login failed: ${JSON.stringify(res.body)}`);
    }
    adminToken = res.body.token;
    adminUser = res.body.user;
    if (adminUser.role !== 'admin') throw new Error(`Expected role admin, got ${adminUser.role}`);
  });

  await assert('Auth & RBAC', 'Teacher login with TeacherPass#2026!', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'teacher@university.edu', password: 'TeacherPass#2026!' }),
    });
    if (res.status !== 200 || !res.body.success || !res.body.token) {
      throw new Error(`Teacher login failed: ${JSON.stringify(res.body)}`);
    }
    teacherToken = res.body.token;
    teacherUser = res.body.user;
    if (teacherUser.role !== 'teacher') throw new Error(`Expected role teacher, got ${teacherUser.role}`);
  });

  await assert('Auth & RBAC', 'Student login with StudentPass#2026!', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'student@university.edu', password: 'StudentPass#2026!' }),
    });
    if (res.status !== 200 || !res.body.success || !res.body.token) {
      throw new Error(`Student login failed: ${JSON.stringify(res.body)}`);
    }
    studentToken = res.body.token;
    studentUser = res.body.user;
    if (studentUser.role !== 'student') throw new Error(`Expected role student, got ${studentUser.role}`);
  });

  await assert('Auth & RBAC', 'GET /api/auth/me returns verified profile for all 3 roles', async () => {
    const adminMe = await request('/api/auth/me', { headers: { Authorization: `Bearer ${adminToken}` } });
    if (adminMe.status !== 200 || adminMe.body.user?.role !== 'admin') {
      throw new Error(`Admin auth/me failed: ${JSON.stringify(adminMe.body)}`);
    }

    const teacherMe = await request('/api/auth/me', { headers: { Authorization: `Bearer ${teacherToken}` } });
    if (teacherMe.status !== 200 || teacherMe.body.user?.role !== 'teacher') {
      throw new Error(`Teacher auth/me failed: ${JSON.stringify(teacherMe.body)}`);
    }

    const studentMe = await request('/api/auth/me', { headers: { Authorization: `Bearer ${studentToken}` } });
    if (studentMe.status !== 200 || studentMe.body.user?.role !== 'student') {
      throw new Error(`Student auth/me failed: ${JSON.stringify(studentMe.body)}`);
    }
  });

  await assert('Auth & RBAC', 'POST /api/auth/logout succeeds', async () => {
    const res = await request('/api/auth/logout', { method: 'POST' });
    if (res.status !== 200 || !res.body.success) throw new Error(`Logout failed: ${JSON.stringify(res.body)}`);
  });

  await assert('Auth & RBAC', 'RBAC: Teacher access to Admin route is forbidden (403)', async () => {
    const res = await request('/api/academic/terms', {
      method: 'POST',
      headers: { Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({ yearLabel: '2026-2027', semesterNumber: 9, startDate: '2026-08-01', endDate: '2026-12-20' }),
    });
    if (res.status !== 403) throw new Error(`Expected status 403, got ${res.status}`);
  });

  await assert('Auth & RBAC', 'RBAC: Student access to Admin route is forbidden (403)', async () => {
    const res = await request('/api/resources/rooms', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ roomNumber: '999', building: 'Test', capacity: 30, roomType: 'LT' }),
    });
    if (res.status !== 403) throw new Error(`Expected status 403, got ${res.status}`);
  });

  await assert('Auth & RBAC', 'RBAC: Student access to Teacher route is forbidden (403)', async () => {
    const res = await request('/api/classes/extra/book', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ date: '2026-09-01', startSlot: 1, roomId: 'r-101' }),
    });
    if (res.status !== 403) throw new Error(`Expected status 403, got ${res.status}`);
  });

  await assert('Auth & RBAC', 'Unauthenticated request to protected route is unauthorized (401)', async () => {
    const resMe = await request('/api/auth/me');
    if (resMe.status !== 401) throw new Error(`Expected 401 on /api/auth/me, got ${resMe.status}`);

    const resTerm = await request('/api/academic/terms', {
      method: 'POST',
      body: JSON.stringify({ yearLabel: '2026-2027', semesterNumber: 9 }),
    });
    if (resTerm.status !== 401) throw new Error(`Expected 401 on /api/academic/terms, got ${resTerm.status}`);

    const resExtra = await request('/api/classes/extra/book', {
      method: 'POST',
      body: JSON.stringify({ date: '2026-09-01' }),
    });
    if (resExtra.status !== 401) throw new Error(`Expected 401 on /api/classes/extra/book, got ${resExtra.status}`);
  });

  await assert('Auth & RBAC', 'Invalid login credentials rejected with 401', async () => {
    const wrongPass = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@university.edu', password: 'WrongPassword123!' }),
    });
    if (wrongPass.status !== 401) throw new Error(`Expected 401 on wrong password, got ${wrongPass.status}`);

    const wrongUser = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'nobody@nowhere.edu', password: 'AnyPassword123!' }),
    });
    if (wrongUser.status !== 401) throw new Error(`Expected 401 on non-existent user, got ${wrongUser.status}`);
  });

  await assert('Auth & RBAC', 'Password Change and Admin Password Reset lifecycle', async () => {
    // 1. Password change with short password fails
    const shortRes = await request('/api/auth/change-password', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ newPassword: '123' }),
    });
    if (shortRes.status !== 400) throw new Error(`Expected 400 for short password, got ${shortRes.status}`);

    // 2. Student changes password successfully
    const changeRes = await request('/api/auth/change-password', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ newPassword: 'StudentUpdated#2026!' }),
    });
    if (changeRes.status !== 200 || !changeRes.body.success) {
      throw new Error(`Password change failed: ${JSON.stringify(changeRes.body)}`);
    }

    // 3. Verify student can log in with new password
    const loginNew = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'student@university.edu', password: 'StudentUpdated#2026!' }),
    });
    if (loginNew.status !== 200) throw new Error(`Login with updated password failed: ${JSON.stringify(loginNew.body)}`);

    // 4. Admin resets student password back to StudentPass#2026!
    const adminReset = await request('/api/auth/admin/reset-password', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ targetEmail: 'student@university.edu', newPassword: 'StudentPass#2026!' }),
    });
    if (adminReset.status !== 200 || !adminReset.body.success) {
      throw new Error(`Admin password reset failed: ${JSON.stringify(adminReset.body)}`);
    }

    // 5. Verify student can log in again with StudentPass#2026!
    const loginOriginal = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'student@university.edu', password: 'StudentPass#2026!' }),
    });
    if (loginOriginal.status !== 200) throw new Error(`Login with reset password failed: ${JSON.stringify(loginOriginal.body)}`);
    studentToken = loginOriginal.body.token; // Refresh student token

    // 6. Non-admin attempting admin reset is forbidden (403)
    const unauthorizedReset = await request('/api/auth/admin/reset-password', {
      method: 'POST',
      headers: { Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({ targetEmail: 'student@university.edu', newPassword: 'HackedPass#2026!' }),
    });
    if (unauthorizedReset.status !== 403) throw new Error(`Expected 403 on teacher reset password, got ${unauthorizedReset.status}`);
  });

  // =========================================================================
  // 2. CORE CRUD LIFECYCLES END-TO-END
  // =========================================================================
  console.log(`\n--- SUITE 2: Core CRUD Lifecycles end-to-end ---`);

  const timestamp = Date.now().toString().slice(-5);
  const testTermId = `term-e2e-${timestamp}`;
  const testSecId = `sec-e2e-${timestamp}`;
  const testBatchId = `batch-e2e-${timestamp}`;
  const testCourseId = `c-e2e-${timestamp}`;
  const testTeacherId = `t-e2e-${timestamp}`;
  const testRoomId = `r-e2e-${timestamp}`;
  const testOfferingId = `off-e2e-${timestamp}`;

  // Secondary entities for isolated conflict testing
  const testTeacher2Id = `t2-e2e-${timestamp}`;
  const testSec2Id = `sec2-e2e-${timestamp}`;
  const testOffering2Id = `off2-e2e-${timestamp}`;

  await assert('CRUD Lifecycle', 'Master Data Creation: Term, Section, Batch, Room, Teacher, Course, Offering', async () => {
    // Term
    const termRes = await request('/api/academic/terms', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        id: testTermId,
        yearLabel: '2026-2027',
        semesterNumber: 1,
        startDate: '2026-08-01',
        endDate: '2026-12-20',
        cycle: 'odd',
        status: 'active',
      }),
    });
    if (termRes.status !== 200 || !termRes.body.success) throw new Error(`Create term failed: ${JSON.stringify(termRes.body)}`);

    // Section 1
    const secRes = await request('/api/academic/sections', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        id: testSecId,
        termId: testTermId,
        name: `Section E2E ${timestamp}`,
        expectedCount: 40,
      }),
    });
    if (secRes.status !== 200 || !secRes.body.success) throw new Error(`Create section failed: ${JSON.stringify(secRes.body)}`);

    // Section 2
    const sec2Res = await request('/api/academic/sections', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        id: testSec2Id,
        termId: testTermId,
        name: `Section 2 E2E ${timestamp}`,
        expectedCount: 30,
      }),
    });
    if (sec2Res.status !== 200 || !sec2Res.body.success) throw new Error(`Create section 2 failed: ${JSON.stringify(sec2Res.body)}`);

    // Batch
    const batchRes = await request('/api/academic/batches', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        id: testBatchId,
        sectionId: testSecId,
        name: `Batch 1`,
        expectedCount: 20,
      }),
    });
    if (batchRes.status !== 200 || !batchRes.body.success) throw new Error(`Create batch failed: ${JSON.stringify(batchRes.body)}`);

    // Room
    const roomRes = await request('/api/resources/rooms', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        id: testRoomId,
        roomNumber: `E2E-${timestamp}`,
        building: 'Tech Park',
        floor: 2,
        capacity: 50,
        roomType: 'LT',
      }),
    });
    if (roomRes.status !== 200 || !roomRes.body.success) throw new Error(`Create room failed: ${JSON.stringify(roomRes.body)}`);

    // Teacher 1
    const teacherRes = await request('/api/resources/teachers', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        id: testTeacherId,
        empId: `EMP-${timestamp}`,
        name: `Prof. E2E ${timestamp}`,
        email: `prof.e2e.${timestamp}@university.edu`,
      }),
    });
    if (teacherRes.status !== 200 || !teacherRes.body.success) throw new Error(`Create teacher failed: ${JSON.stringify(teacherRes.body)}`);

    // Teacher 2
    const teacher2Res = await request('/api/resources/teachers', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        id: testTeacher2Id,
        empId: `EMP2-${timestamp}`,
        name: `Prof. Beta ${timestamp}`,
        email: `prof.beta.${timestamp}@university.edu`,
      }),
    });
    if (teacher2Res.status !== 200 || !teacher2Res.body.success) throw new Error(`Create teacher 2 failed: ${JSON.stringify(teacher2Res.body)}`);

    // Course (1 lecture hour so 1 session is complete)
    const courseRes = await request('/api/catalog/courses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        id: testCourseId,
        code: `CS${timestamp}`,
        name: `Modern Architecture ${timestamp}`,
        termId: testTermId,
        lectureHours: 1,
        tutorialHours: 0,
        practicalHours: 0,
        requiredRoomType: 'LT',
      }),
    });
    if (courseRes.status !== 200 || !courseRes.body.success) throw new Error(`Create course failed: ${JSON.stringify(courseRes.body)}`);

    // Course Offering 1
    const offRes = await request('/api/catalog/offerings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        id: testOfferingId,
        courseId: testCourseId,
        termId: testTermId,
        teacherId: testTeacherId,
        targetType: 'section',
        targetId: testSecId,
        component: 'L',
      }),
    });
    if (offRes.status !== 200 || !offRes.body.success) throw new Error(`Create offering failed: ${JSON.stringify(offRes.body)}`);

    // Course Offering 2
    const off2Res = await request('/api/catalog/offerings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        id: testOffering2Id,
        courseId: testCourseId,
        termId: testTermId,
        teacherId: testTeacher2Id,
        targetType: 'section',
        targetId: testSec2Id,
        component: 'L',
      }),
    });
    if (off2Res.status !== 200 || !off2Res.body.success) throw new Error(`Create offering 2 failed: ${JSON.stringify(off2Res.body)}`);
  });

  const studentRoll = `2026E2E${timestamp}`;
  await assert('CRUD Lifecycle', 'Bulk Student Provisioning: Enroll student in section & batch', async () => {
    const res = await request('/api/admin/students/bulk', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        students: [
          {
            name: `E2E Student ${timestamp}`,
            email: `student.e2e.${timestamp}@university.edu`,
            rollNumber: studentRoll,
            sectionId: testSecId,
            batchId: testBatchId,
          },
        ],
      }),
    });
    if (res.status !== 200 || !res.body.success) throw new Error(`Bulk provisioning failed: ${JSON.stringify(res.body)}`);
  });

  let publishedDraftVersionId = '';
  await assert('CRUD Lifecycle', 'Timetable Generation, Solver Request, Draft Upload & Publication', async () => {
    // 1. Compile Package
    const pkgRes = await request('/api/generation/compile-package', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ termIds: [testTermId] }),
    });
    if (pkgRes.status !== 200 || !pkgRes.body.success) throw new Error(`Compile package failed: ${JSON.stringify(pkgRes.body)}`);
    const pkg = pkgRes.body.package;

    // 2. Request Generation (contacts generator on port 5001)
    const genRes = await request('/api/generation/request', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ termIds: [testTermId] }),
    });
    if (genRes.status !== 200) throw new Error(`Generation request failed: ${JSON.stringify(genRes.body)}`);

    // 3. Draft Upload: 1 session for 1 required lecture hour
    const draft = {
      schemaVersion: '1.0.0',
      packageId: pkg.packageId,
      inputRevision: pkg.inputRevision,
      status: 'succeeded',
      termIds: [testTermId],
      expectedOfferingIds: [testOfferingId],
      classes: [
        {
          courseOfferingId: testOfferingId,
          termId: testTermId,
          dayOfWeek: 2, // Tuesday
          startSlot: 2,
          duration: 1,
          activityType: 'L',
          teacherId: testTeacherId,
          roomId: testRoomId,
          targetType: 'section',
          targetId: testSecId,
        },
      ],
    };

    const uploadRes = await request('/api/generation/draft/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ draft }),
    });
    if (uploadRes.status !== 200 || !uploadRes.body.success) throw new Error(`Draft upload failed: ${JSON.stringify(uploadRes.body)}`);
    publishedDraftVersionId = uploadRes.body.version.id;

    // 4. Publish Version
    const pubRes = await request(`/api/timetable/versions/${publishedDraftVersionId}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (pubRes.status !== 200 || !pubRes.body.success) throw new Error(`Publish failed: ${JSON.stringify(pubRes.body)}`);
    if (pubRes.body.instantiatedOccurrences <= 0) throw new Error(`No occurrences instantiated!`);
  });

  let bookedExtraClassId = '';
  await assert('CRUD Lifecycle', 'Extra Class: Query available slots -> Book extra class -> Cancel extra class', async () => {
    // 1. Query available slots
    const slotsRes = await request(
      `/api/classes/extra/available-slots?date=2026-09-02&dayOfWeek=3&activityType=L&teacherId=${testTeacherId}&targetType=section&targetId=${testSecId}`
    );
    if (slotsRes.status !== 200 || !slotsRes.body.success) throw new Error(`Query available slots failed: ${JSON.stringify(slotsRes.body)}`);
    if (!Array.isArray(slotsRes.body.slots) || slotsRes.body.slots.length === 0) {
      throw new Error(`Expected at least one available slot.`);
    }

    const freeSlot = slotsRes.body.slots[0];

    // 2. Book extra class into the valid non-break free slot
    const bookRes = await request('/api/classes/extra/book', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        date: '2026-09-02',
        dayOfWeek: freeSlot.dayOfWeek,
        startSlot: freeSlot.slotIndex,
        activityType: 'L',
        courseOfferingId: testOfferingId,
        termId: testTermId,
        roomId: freeSlot.eligibleRooms[0]?.id || testRoomId,
        targetType: 'section',
        targetId: testSecId,
        teacherId: testTeacherId,
      }),
    });
    if (bookRes.status !== 200 || !bookRes.body.success) throw new Error(`Book extra class failed: ${JSON.stringify(bookRes.body)}`);
    bookedExtraClassId = bookRes.body.occurrence.id;

    // 3. Cancel extra class
    const cancelRes = await request(`/api/classes/extra/${bookedExtraClassId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ reason: 'Scheduling conflict resolved' }),
    });
    if (cancelRes.status !== 200 || !cancelRes.body.success) throw new Error(`Cancel extra class failed: ${JSON.stringify(cancelRes.body)}`);
    if (cancelRes.body.occurrence.status !== 'cancelled') throw new Error(`Expected status cancelled, got ${cancelRes.body.occurrence.status}`);
  });

  await assert('CRUD Lifecycle', 'Regular Class Management: Cancel occurrence -> Reschedule occurrence', async () => {
    // Retrieve an instantiated occurrence for our test section
    const stateRes = await request('/api/state', { headers: { Authorization: `Bearer ${adminToken}` } });
    const occurrences = stateRes.body.classOccurrences || [];
    const occ = occurrences.find((o: any) => o.targetId === testSecId && o.status === 'scheduled');
    if (!occ) throw new Error(`No scheduled occurrence found for section ${testSecId}`);

    // 1. Cancel occurrence
    const cancelRes = await request(`/api/classes/occurrences/${occ.id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ reason: 'Guest lecture arranged' }),
    });
    if (cancelRes.status !== 200 || !cancelRes.body.success) throw new Error(`Cancel occurrence failed: ${JSON.stringify(cancelRes.body)}`);
    if (cancelRes.body.occurrence.status !== 'cancelled') throw new Error(`Expected status cancelled, got ${cancelRes.body.occurrence.status}`);

    // 2. Reschedule occurrence to a new slot (Friday slot 5)
    const rescheduleRes = await request(`/api/classes/occurrences/${occ.id}/reschedule`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        date: '2026-09-04',
        dayOfWeek: 5,
        startSlot: 5,
        roomId: testRoomId,
      }),
    });
    if (rescheduleRes.status !== 200 || !rescheduleRes.body.success) {
      throw new Error(`Reschedule occurrence failed: ${JSON.stringify(rescheduleRes.body)}`);
    }
    if (rescheduleRes.body.occurrence.status !== 'scheduled' || rescheduleRes.body.occurrence.startSlot !== 5) {
      throw new Error(`Occurrence not rescheduled properly: ${JSON.stringify(rescheduleRes.body.occurrence)}`);
    }
  });

  let facultyLeaveId = '';
  await assert('CRUD Lifecycle', 'Faculty Unavailability: Request -> Admin Confirmation & Approval', async () => {
    // 1. Submit leave request as Teacher
    const reqRes = await request('/api/teachers/unavailability/request', {
      method: 'POST',
      headers: { Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({
        date: '2026-09-10',
        startSlot: 1,
        endSlot: 4,
        reason: 'National Symposium Presentation',
      }),
    });
    if (reqRes.status !== 200 || !reqRes.body.success) throw new Error(`Submit leave request failed: ${JSON.stringify(reqRes.body)}`);
    facultyLeaveId = reqRes.body.request.id;
    if (reqRes.body.request.status !== 'pending') throw new Error(`Expected pending status, got ${reqRes.body.request.status}`);

    // 2. Confirm leave request as Admin (using /confirm endpoint)
    const confirmRes = await request(`/api/teachers/unavailability/${facultyLeaveId}/confirm`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (confirmRes.status !== 200 || !confirmRes.body.success) throw new Error(`Confirm leave failed: ${JSON.stringify(confirmRes.body)}`);
    if (confirmRes.body.request.status !== 'confirmed') throw new Error(`Expected confirmed status, got ${confirmRes.body.request.status}`);
  });

  await assert('CRUD Lifecycle', 'Student Section/Batch Transfer: Atomic transfer with effectiveDate', async () => {
    // Create destination section B
    const secBRes = await request('/api/academic/sections', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        id: `sec-b-${timestamp}`,
        termId: testTermId,
        name: `Section B ${timestamp}`,
        expectedCount: 35,
      }),
    });
    if (secBRes.status !== 200 || !secBRes.body.success) throw new Error(`Create destination section failed: ${JSON.stringify(secBRes.body)}`);

    const transferRes = await request('/api/students/transfer', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        studentId: studentRoll,
        newGroupId: `sec-b-${timestamp}`,
        newGroupType: 'section',
        effectiveDate: '2026-09-15',
      }),
    });
    if (transferRes.status !== 200 || !transferRes.body.success) throw new Error(`Student transfer failed: ${JSON.stringify(transferRes.body)}`);
    if (transferRes.body.newMembership?.groupId !== `sec-b-${timestamp}`) {
      throw new Error(`New membership groupId mismatch: ${JSON.stringify(transferRes.body.newMembership)}`);
    }
  });

  // =========================================================================
  // 3. CONFLICT & NEGATIVE SCENARIOS
  // =========================================================================
  console.log(`\n--- SUITE 3: Real Conflict & Negative Scenarios ---`);

  // Setup: Book an anchor class on 2026-09-08, slot 2, room testRoomId, teacher testTeacherId, section testSecId
  let anchorOccId = '';
  await assert('Negative & Conflicts', 'Setup anchor class for conflict testing', async () => {
    const bookRes = await request('/api/classes/extra/book', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        date: '2026-09-08',
        dayOfWeek: 2,
        startSlot: 2,
        activityType: 'L',
        courseOfferingId: testOfferingId,
        termId: testTermId,
        roomId: testRoomId,
        targetType: 'section',
        targetId: testSecId,
        teacherId: testTeacherId,
      }),
    });
    if (bookRes.status !== 200 || !bookRes.body.success) throw new Error(`Setup anchor class failed: ${JSON.stringify(bookRes.body)}`);
    anchorOccId = bookRes.body.occurrence.id;
  });

  await assert('Negative & Conflicts', 'Room Conflict: Double-booking same room & slot is rejected (400)', async () => {
    // Different teacher (testTeacher2Id) and different section (testSec2Id) try to use the same room (testRoomId) at the same time
    const res = await request('/api/classes/extra/book', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        date: '2026-09-08',
        dayOfWeek: 2,
        startSlot: 2,
        activityType: 'L',
        courseOfferingId: testOffering2Id,
        termId: testTermId,
        roomId: testRoomId, // Same room!
        targetType: 'section',
        targetId: testSec2Id, // Different section
        teacherId: testTeacher2Id, // Different teacher
      }),
    });
    if (res.status !== 400 || !res.body.error?.includes('ERR_ROOM_CONFLICT')) {
      throw new Error(`Expected 400 ERR_ROOM_CONFLICT, got status ${res.status}: ${JSON.stringify(res.body)}`);
    }
  });

  await assert('Negative & Conflicts', 'Teacher Conflict: Booking teacher already teaching in that slot is rejected (400)', async () => {
    // Same teacher (testTeacherId) tries to teach a different section (testSec2Id) in a different room (room-cslab1) at the same time
    const res = await request('/api/classes/extra/book', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        date: '2026-09-08',
        dayOfWeek: 2,
        startSlot: 2,
        activityType: 'L',
        courseOfferingId: testOfferingId,
        termId: testTermId,
        roomId: 'room-ab1-102', // Different lecture room
        targetType: 'section',
        targetId: testSec2Id, // Different section
        teacherId: testTeacherId, // Same teacher!
      }),
    });
    if (res.status !== 400 || !res.body.error?.includes('ERR_TEACHER_CONFLICT')) {
      throw new Error(`Expected 400 ERR_TEACHER_CONFLICT, got status ${res.status}: ${JSON.stringify(res.body)}`);
    }
  });

  await assert('Negative & Conflicts', 'Student Group Conflict: Booking section already having a class is rejected (400)', async () => {
    // Same section (testSecId) tries to have another class in another room (room-cslab1) with another teacher (testTeacher2Id)
    const res = await request('/api/classes/extra/book', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        date: '2026-09-08',
        dayOfWeek: 2,
        startSlot: 2,
        activityType: 'L',
        courseOfferingId: testOffering2Id,
        termId: testTermId,
        roomId: 'room-ab1-102', // Different lecture room
        targetType: 'section',
        targetId: testSecId, // Same section!
        teacherId: testTeacher2Id, // Different teacher
      }),
    });
    if (res.status !== 400 || !res.body.error?.includes('ERR_STUDENT_COHORT_CONFLICT')) {
      throw new Error(`Expected 400 ERR_STUDENT_COHORT_CONFLICT, got status ${res.status}: ${JSON.stringify(res.body)}`);
    }
  });

  await assert('Negative & Conflicts', 'Atomic Reschedule: Rescheduling to an occupied slot fails without releasing old slot', async () => {
    // 1. Create a second class at slot 6
    const class2Res = await request('/api/classes/extra/book', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        date: '2026-09-08',
        dayOfWeek: 2,
        startSlot: 6,
        activityType: 'L',
        courseOfferingId: testOfferingId,
        termId: testTermId,
        roomId: testRoomId,
        targetType: 'section',
        targetId: testSecId,
        teacherId: testTeacherId,
      }),
    });
    if (class2Res.status !== 200) throw new Error(`Create second class failed: ${JSON.stringify(class2Res.body)}`);
    const class2Id = class2Res.body.occurrence.id;

    // 2. Try to reschedule class 2 into slot 2 (which is occupied by anchorOccId)
    const failedReschedule = await request(`/api/classes/occurrences/${class2Id}/reschedule`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        date: '2026-09-08',
        dayOfWeek: 2,
        startSlot: 2, // Conflict!
        roomId: testRoomId,
      }),
    });
    if (failedReschedule.status !== 400) {
      throw new Error(`Expected 400 on conflicting reschedule, got ${failedReschedule.status}`);
    }

    // 3. Invariant check: class 2 MUST remain at slot 6, untouched
    const stateRes = await request('/api/state', { headers: { Authorization: `Bearer ${adminToken}` } });
    const class2Current = stateRes.body.classOccurrences.find((o: any) => o.id === class2Id);
    if (!class2Current || class2Current.startSlot !== 6) {
      throw new Error(`Atomic rollback failed! Class 2 state corrupted: ${JSON.stringify(class2Current)}`);
    }

    // Invariant check: anchor class at slot 2 MUST remain at slot 2, untouched
    const anchorCurrent = stateRes.body.classOccurrences.find((o: any) => o.id === anchorOccId);
    if (!anchorCurrent || anchorCurrent.startSlot !== 2) {
      throw new Error(`Atomic rollback failed! Anchor class state corrupted: ${JSON.stringify(anchorCurrent)}`);
    }
  });

  await assert('Negative & Conflicts', 'Malformed & Invalid Payloads are strictly rejected (400)', async () => {
    // Missing required field: Section without name
    const missingName = await request('/api/academic/sections', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ termId: testTermId, expectedCount: 40 }),
    });
    if (missingName.status !== 400) throw new Error(`Expected 400 for missing section name, got ${missingName.status}`);

    // Negative capacity for room
    const negCap = await request('/api/resources/rooms', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ roomNumber: 'Neg-1', building: 'Main', capacity: -20, roomType: 'LT' }),
    });
    if (negCap.status !== 400) throw new Error(`Expected 400 for negative capacity, got ${negCap.status}`);

    // Negative cohort size
    const negCount = await request('/api/academic/sections', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ termId: testTermId, name: 'NegCohort', expectedCount: -5 }),
    });
    if (negCount.status !== 400) throw new Error(`Expected 400 for negative expectedCount, got ${negCount.status}`);

    // Odd practical hours (violates ERR_ODD_P_HOURS)
    const oddHours = await request('/api/catalog/courses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        code: `ODD${timestamp}`,
        name: 'Odd Practical Course',
        termId: testTermId,
        lectureHours: 2,
        practicalHours: 3, // ODD!
        requiredRoomType: 'P',
      }),
    });
    if (oddHours.status !== 400 || !oddHours.body.error?.includes('ERR_ODD_P_HOURS')) {
      throw new Error(`Expected 400 ERR_ODD_P_HOURS, got ${oddHours.status}: ${JSON.stringify(oddHours.body)}`);
    }

    // Foreign key violation: Offering referencing non-existent teacher
    const badTeacher = await request('/api/catalog/offerings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        courseId: testCourseId,
        termId: testTermId,
        teacherId: 'non-existent-teacher-999',
        targetType: 'section',
        targetId: testSecId,
      }),
    });
    if (badTeacher.status !== 400) throw new Error(`Expected 400 for non-existent teacher, got ${badTeacher.status}`);
  });

  // =========================================================================
  // 4. CROSS-ROLE STATE PROPAGATION & NOTIFICATIONS
  // =========================================================================
  console.log(`\n--- SUITE 4: Cross-Role State Propagation ---`);

  // Charlie Brown (stud-1) is enrolled in sec-cse-3a.
  // Teacher t-1 (teacher@university.edu) teaches sec-cse-3b.
  // Let's enroll stud-1 in sec-cse-3b as well so stud-1 receives all updates for t-1's section!
  await assert('Cross-Role Propagation', 'Setup: Enroll student stud-1 into teacher t-1 cohort sec-cse-3b', async () => {
    const res = await request('/api/students/transfer', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        studentId: 'stud-1',
        newGroupId: 'sec-cse-3b',
        newGroupType: 'section',
        effectiveDate: '2026-08-01',
      }),
    });
    if (res.status !== 200 || !res.body.success) throw new Error(`Enroll student in sec-cse-3b failed: ${JSON.stringify(res.body)}`);
  });

  await assert('Cross-Role Propagation', 'Teacher cancels regular class -> Student sees cancellation in state and inbox', async () => {
    // 1. Get an active occurrence belonging to Teacher (t-1) for cohort sec-cse-3b
    const stateRes = await request('/api/state', { headers: { Authorization: `Bearer ${studentToken}` } });
    const occurrences = stateRes.body.classOccurrences || [];
    const occ = occurrences.find((o: any) => o.teacherId === 't-1' && o.targetId === 'sec-cse-3b' && o.status === 'scheduled');
    if (!occ) throw new Error(`No scheduled occurrence found for teacher t-1 and section sec-cse-3b`);

    // 2. Teacher t-1 cancels the occurrence
    const cancelRes = await request(`/api/classes/occurrences/${occ.id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({ reason: 'Faculty conference participation' }),
    });
    if (cancelRes.status !== 200 || !cancelRes.body.success) {
      throw new Error(`Teacher cancel failed: ${JSON.stringify(cancelRes.body)}`);
    }

    // 3. Student queries /api/state: occurrence MUST be marked cancelled
    const studentStateRes = await request('/api/state', { headers: { Authorization: `Bearer ${studentToken}` } });
    const updatedOcc = studentStateRes.body.classOccurrences.find((o: any) => o.id === occ.id);
    if (!updatedOcc || updatedOcc.status !== 'cancelled') {
      throw new Error(`Student does not see cancelled status in /api/state: ${JSON.stringify(updatedOcc)}`);
    }

    // 4. Student queries /api/notifications/inbox: MUST receive cancellation notice
    const inboxRes = await request('/api/notifications/inbox', { headers: { Authorization: `Bearer ${studentToken}` } });
    if (inboxRes.status !== 200) throw new Error(`Get inbox failed: ${JSON.stringify(inboxRes.body)}`);
    const notices = inboxRes.body.notices || [];
    const hasCancelNotice = notices.some(
      (n: any) => n.entityId === occ.id && n.eventType === 'CLASS_CANCELLED'
    );
    if (!hasCancelNotice) {
      throw new Error(`Student did not receive CLASS_CANCELLED notification in inbox! Found notices: ${JSON.stringify(notices.slice(-3))}`);
    }
  });

  await assert('Cross-Role Propagation', 'Teacher reschedules class -> Student sees reschedule in state and inbox', async () => {
    // 1. Get another scheduled occurrence for teacher t-1 and section sec-cse-3b
    const stateRes = await request('/api/state', { headers: { Authorization: `Bearer ${teacherToken}` } });
    const occurrences = stateRes.body.classOccurrences || [];
    const occ = occurrences.find((o: any) => o.teacherId === 't-1' && o.targetId === 'sec-cse-3b' && o.status === 'scheduled');
    if (!occ) throw new Error(`No scheduled occurrence found for teacher t-1 and section sec-cse-3b`);

    // 2. Teacher reschedules the occurrence to a free slot (Friday slot 5)
    const rescheduleRes = await request(`/api/classes/occurrences/${occ.id}/reschedule`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({
        date: '2026-10-02',
        dayOfWeek: 5,
        startSlot: 5,
        roomId: occ.roomId,
      }),
    });
    if (rescheduleRes.status !== 200 || !rescheduleRes.body.success) {
      throw new Error(`Teacher reschedule failed: ${JSON.stringify(rescheduleRes.body)}`);
    }

    // 3. Student queries /api/state: occurrence MUST be updated to slot 5 and date 2026-10-02
    const studentStateRes = await request('/api/state', { headers: { Authorization: `Bearer ${studentToken}` } });
    const updatedOcc = studentStateRes.body.classOccurrences.find((o: any) => o.id === occ.id);
    if (!updatedOcc || updatedOcc.startSlot !== 5 || updatedOcc.date !== '2026-10-02') {
      throw new Error(`Student state does not reflect rescheduled occurrence: ${JSON.stringify(updatedOcc)}`);
    }

    // 4. Student queries /api/notifications/inbox: MUST receive reschedule notice
    const inboxRes = await request('/api/notifications/inbox', { headers: { Authorization: `Bearer ${studentToken}` } });
    const notices = inboxRes.body.notices || [];
    const hasRescheduleNotice = notices.some(
      (n: any) => n.entityId === occ.id && n.eventType === 'CLASS_RESCHEDULED'
    );
    if (!hasRescheduleNotice) {
      throw new Error(`Student did not receive CLASS_RESCHEDULED notification in inbox!`);
    }
  });

  await assert('Cross-Role Propagation', 'Teacher books extra class for Section -> Student in Section sees class and gets notified', async () => {
    // 1. Query available conflict-free slot for Teacher t-1 and section sec-cse-3b
    const bookDate = '2026-11-26';
    const availRes = await request(
      `/api/classes/extra/available-slots?date=${bookDate}&activityType=L&targetType=section&targetId=sec-cse-3b&teacherId=t-1`,
      { headers: { Authorization: `Bearer ${teacherToken}` } }
    );
    const validSlot = availRes.body.slots?.[0] || { slotIndex: 6, dayOfWeek: 4, roomId: 'room-ab1-101' };

    // 2. Teacher t-1 books extra class
    const extraRes = await request('/api/classes/extra/book', {
      method: 'POST',
      headers: { Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({
        date: bookDate,
        dayOfWeek: validSlot.dayOfWeek,
        startSlot: validSlot.slotIndex,
        activityType: 'L',
        courseOfferingId: 'off-sec-cse-3b-c-cs203-L',
        termId: 'term-sem3',
        roomId: validSlot.roomId || 'room-ab1-101',
        targetType: 'section',
        targetId: 'sec-cse-3b',
        teacherId: 't-1',
      }),
    });
    if (extraRes.status !== 200 || !extraRes.body.success) {
      throw new Error(`Book extra class failed: ${JSON.stringify(extraRes.body)}`);
    }
    const extraOcc = extraRes.body.occurrence;

    // 3. Student queries /api/state: extra class MUST be present in classOccurrences
    const studentStateRes = await request('/api/state', { headers: { Authorization: `Bearer ${studentToken}` } });
    const foundOcc = studentStateRes.body.classOccurrences.find((o: any) => o.id === extraOcc.id);
    if (!foundOcc) {
      throw new Error(`Student does not see newly booked extra class in /api/state!`);
    }

    // 4. Student queries /api/notifications/inbox: MUST receive extra class notification
    const inboxRes = await request('/api/notifications/inbox', { headers: { Authorization: `Bearer ${studentToken}` } });
    const notices = inboxRes.body.notices || [];
    const hasNotice = notices.some(
      (n: any) => n.entityId === extraOcc.id && n.eventType === 'EXTRA_CLASS_BOOKED'
    );
    if (!hasNotice) {
      throw new Error(`Student did not receive EXTRA_CLASS_BOOKED notification in inbox!`);
    }
  });

  await assert('Cross-Role Propagation', 'Student Section Transfer: Student sees timetable of Section B instead of Section A after transfer', async () => {
    // Transfer student stud-1 to section sec-cse-3a with effectiveDate 2026-10-15
    const transferRes = await request('/api/students/transfer', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        studentId: 'stud-1',
        newGroupId: 'sec-cse-3a',
        newGroupType: 'section',
        effectiveDate: '2026-10-15',
      }),
    });
    if (transferRes.status !== 200 || !transferRes.body.success) {
      throw new Error(`Student transfer failed: ${JSON.stringify(transferRes.body)}`);
    }

    // Query state and verify active memberships
    const stateRes = await request('/api/state', { headers: { Authorization: `Bearer ${studentToken}` } });
    const memberships = (stateRes.body.studentGroupMemberships || []).filter(
      (m: any) => m.studentId === 'stud-1' && m.groupType === 'section'
    );

    // Old membership sec-cse-3b should have effectiveEndDate <= 2026-10-15
    const oldMemId = transferRes.body.oldMembership?.id;
    const secBMem = oldMemId ? memberships.find((m: any) => m.id === oldMemId) : memberships.find((m: any) => m.groupId === 'sec-cse-3b' && m.effectiveEndDate);
    if (!secBMem || !secBMem.effectiveEndDate || secBMem.effectiveEndDate > '2026-10-15') {
      throw new Error(`Old membership for sec-cse-3b was not properly capped: ${JSON.stringify(secBMem)}`);
    }

    // New membership sec-cse-3a should have effectiveStartDate === 2026-10-15
    const newMemId = transferRes.body.newMembership?.id;
    const secAMem = newMemId ? memberships.find((m: any) => m.id === newMemId) : memberships.find((m: any) => m.groupId === 'sec-cse-3a' && !m.effectiveEndDate);
    if (!secAMem || secAMem.effectiveStartDate !== '2026-10-15') {
      throw new Error(`New membership for sec-cse-3a not properly set: ${JSON.stringify(secAMem)}`);
    }
  });

  await assert('Cross-Role Propagation', 'Teacher Leave Confirmation: Affected occurrences are cancelled and student is notified', async () => {
    // 1. Enroll stud-1 into sec-cse-3b with effective date 2026-10-18
    await request('/api/students/transfer', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        studentId: 'stud-1',
        newGroupId: 'sec-cse-3b',
        newGroupType: 'section',
        effectiveDate: '2026-10-18',
      }),
    });

    // 2. Book a class on 2026-12-08, slot 1 for Teacher t-1 and section sec-cse-3b
    const leaveTestDate = '2026-12-08';
    const bookRes = await request('/api/classes/extra/book', {
      method: 'POST',
      headers: { Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({
        date: leaveTestDate,
        dayOfWeek: 2,
        startSlot: 1,
        activityType: 'L',
        courseOfferingId: 'off-sec-cse-3b-c-cs203-L',
        termId: 'term-sem3',
        roomId: 'room-ab1-101',
        targetType: 'section',
        targetId: 'sec-cse-3b',
        teacherId: 't-1',
      }),
    });
    if (bookRes.status !== 200 || !bookRes.body.success) {
      throw new Error(`Setup class for leave confirmation failed: ${JSON.stringify(bookRes.body)}`);
    }
    const targetOcc = bookRes.body.occurrence;

    // 3. Teacher submits leave request covering leaveTestDate slots 1-3
    const leaveRes = await request('/api/teachers/unavailability/request', {
      method: 'POST',
      headers: { Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({
        date: leaveTestDate,
        startSlot: 1,
        endSlot: 3,
        reason: 'Family Emergency Leave',
      }),
    });
    if (leaveRes.status !== 200 || !leaveRes.body.success) {
      throw new Error(`Submit leave request failed: ${JSON.stringify(leaveRes.body)}`);
    }
    const leaveId = leaveRes.body.request.id;

    // 4. Admin confirms leave request
    const confirmRes = await request(`/api/teachers/unavailability/${leaveId}/confirm`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (confirmRes.status !== 200 || !confirmRes.body.success) {
      throw new Error(`Admin confirm leave failed: ${JSON.stringify(confirmRes.body)}`);
    }

    // 5. Verify target occurrence status is NOW cancelled in /api/state
    const stateRes = await request('/api/state', { headers: { Authorization: `Bearer ${studentToken}` } });
    const verifiedOcc = stateRes.body.classOccurrences.find((o: any) => o.id === targetOcc.id);
    if (!verifiedOcc || verifiedOcc.status !== 'cancelled') {
      throw new Error(`Occurrence was not automatically cancelled upon leave confirmation! State: ${JSON.stringify(verifiedOcc)}`);
    }

    // 6. Verify student in Section B received cancellation notification in /api/notifications/inbox
    const inboxRes = await request('/api/notifications/inbox', { headers: { Authorization: `Bearer ${studentToken}` } });
    const notices = inboxRes.body.notices || [];
    const hasNotice = notices.some(
      (n: any) => n.entityId === targetOcc.id && n.eventType === 'CLASS_CANCELLED'
    );
    if (!hasNotice) {
      throw new Error(`Student did not receive CLASS_CANCELLED notification for confirmed faculty leave!`);
    }
  });

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log(`\n=======================================================`);
  console.log(`TEST EXECUTION SUMMARY`);
  console.log(`=======================================================`);
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`Total tests:  ${results.length}`);
  console.log(`Passed:       ${passed}`);
  console.log(`Failed:       ${failed}`);

  if (failed > 0) {
    console.log(`\nFailed tests:`);
    for (const r of results.filter((r) => !r.passed)) {
      console.log(`  - [${r.suite}] ${r.name}: ${r.error}`);
    }
    process.exit(1);
  } else {
    console.log(`\nAll Subagent 1 verifications passed successfully!`);
    process.exit(0);
  }
}

runAllTests().catch((e) => {
  console.error(`Fatal verification error:`, e);
  process.exit(1);
});
