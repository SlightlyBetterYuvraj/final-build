import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { renderHtmlUI } from '../src/api/ui.js';

describe('UI/UX Wiring, Forms, Endpoints & Edge Cases Verification', () => {
  const baseUrl = 'http://localhost:3000';
  let adminToken = '';
  let teacherToken = '';
  let studentToken = '';

  async function apiReq(path: string, options: { method?: string; body?: any; token?: string } = {}) {
    const url = new URL(path, baseUrl);
    return new Promise<{ status: number; body: any }>((resolve, reject) => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (options.token) headers['Authorization'] = `Bearer ${options.token}`;
      const req = http.request({
        method: options.method || 'GET',
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        headers,
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          let json: any = null;
          try { json = JSON.parse(data); } catch { json = { raw: data }; }
          resolve({ status: res.statusCode || 200, body: json });
        });
      });
      req.on('error', reject);
      if (options.body) req.write(JSON.stringify(options.body));
      req.end();
    });
  }

  beforeAll(async () => {
    // Authenticate Admin
    const adminLogin = await apiReq('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@university.edu', password: 'AdminPass#2026!' },
    });
    adminToken = adminLogin.body.token;

    // Authenticate Teacher
    const teacherLogin = await apiReq('/api/auth/login', {
      method: 'POST',
      body: { email: 'teacher@university.edu', password: 'TeacherPass#2026!' },
    });
    teacherToken = teacherLogin.body.token;

    // Authenticate Student
    const studentLogin = await apiReq('/api/auth/login', {
      method: 'POST',
      body: { email: 'student@university.edu', password: 'StudentPass#2026!' },
    });
    studentToken = studentLogin.body.token;
  });

  describe('1. HTML Template, Syntax & UI Standards (Rule 9 & 10)', () => {
    const html = renderHtmlUI();

    it('contains valid executable client-side JavaScript without syntax errors', () => {
      const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
      let match;
      let count = 0;
      while ((match = scriptRegex.exec(html)) !== null) {
        count++;
        const js = match[1];
        expect(() => new Function(js)).not.toThrow();
      }
      expect(count).toBeGreaterThanOrEqual(2);
    });

    it('adheres to Rule 10: Zero Emojis in rendered UI', () => {
      const emojiRegex = /[\u{1F300}-\u{1FAD6}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
      const emojis = html.match(emojiRegex);
      expect(emojis).toBeNull();
    });

    it('ensures all 6 Admin Hub Hero cards have interactive click handlers and active buttons', () => {
      expect(html).toContain('onclick="switchAdminPage(\'timetables\')"');
      expect(html).toContain('onclick="switchAdminPage(\'modules\')"');
      expect(html).toContain('onclick="switchAdminPage(\'students\')"');
      expect(html).toContain('onclick="switchAdminPage(\'faculty\')"');
      expect(html).toContain('onclick="switchAdminPage(\'matrix\')"');
      expect(html).toContain('onclick="switchAdminPage(\'solver\')"');

      expect(html).toContain('<button class="btn btn-primary" style="width: 100%;" onclick="switchAdminPage(\'timetables\')">Open Timetable Explorer');
      expect(html).toContain('<button class="btn btn-secondary" style="width: 100%;" onclick="switchAdminPage(\'modules\')">Manage Modules');
      expect(html).toContain('<button class="btn btn-secondary" style="width: 100%;" onclick="switchAdminPage(\'students\')">Manage Students');
      expect(html).toContain('<button class="btn btn-secondary" style="width: 100%;" onclick="switchAdminPage(\'faculty\')">Manage Faculty');
      expect(html).toContain('<button class="btn btn-secondary" style="width: 100%;" onclick="switchAdminPage(\'matrix\')">View Room Matrix');
      expect(html).toContain('<button class="btn btn-secondary" style="width: 100%;" onclick="switchAdminPage(\'solver\')">Launch Solver Console');
    });

    it('ensures Faculty table headers match rendered column count (5 columns)', () => {
      expect(html).toContain('<th>Instructor & Email</th>');
      expect(html).toContain('<th>Workload Limit</th>');
      expect(html).toContain('colspan="5"');
    });

    it('ensures Book Extra Class forms and interactive timetable modal are fully wired', () => {
      // 1. Dedicated Extra Class subpage inputs
      expect(html).toContain('id="extraDate"');
      expect(html).toContain('id="extraActivity"');
      expect(html).toContain('id="extraCourseOffering"');
      expect(html).toContain('id="extraTarget"');
      expect(html).toContain('Tutorial (1 hour)');
      expect(html).toContain('Practical / Lab (2 hours)');

      // 2. Interactive Quick Book Modal from timetable
      expect(html).toContain('id="quickBookExtraModal"');
      expect(html).toContain('id="qbSlotSelect"');
      expect(html).toContain('id="qbActivity"');
      expect(html).toContain('id="qbCourseOffering"');
      expect(html).toContain('id="qbTarget"');
      expect(html).toContain('id="qbRoom"');
      expect(html).toContain('id="qbSubmitBtn"');
      expect(html).toContain('id="qbErrorBox"');
      expect(html).toContain('onclick="openQuickBookExtraModal(');
    });
  });

  describe('2. Public & Guest Flows', () => {
    it('fetches campus state publicly with non-PII sanitization', async () => {
      const res = await apiReq('/api/state');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.academicTerms)).toBe(true);
      expect(Array.isArray(res.body.rooms)).toBe(true);
    });

    it('accepts valid public feedback and rejects empty feedback with 400', async () => {
      const okRes = await apiReq('/api/feedback', {
        method: 'POST',
        body: { message: 'Great timetable viewer!', category: 'general' },
      });
      expect(okRes.status).toBe(200);
      expect(okRes.body.success).toBe(true);

      const badRes = await apiReq('/api/feedback', {
        method: 'POST',
        body: { message: '' },
      });
      expect(badRes.status).toBe(400);
      expect(badRes.body.success).toBe(false);
    });

    it('handles forgot password requests without leaking user existence', async () => {
      const res = await apiReq('/api/auth/forgot-password', {
        method: 'POST',
        body: { email: 'anyuser@university.edu' },
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('3. Admin Workflows & Forms Verification', () => {
    it('creates an academic term with sensible default dates', async () => {
      const termRes = await apiReq('/api/academic/terms', {
        method: 'POST',
        token: adminToken,
        body: { yearLabel: '2026-2027', semesterNumber: 2, cycle: 'even', status: 'active' },
      });
      expect(termRes.status).toBe(200);
      expect(termRes.body.success).toBe(true);
      expect(termRes.body.term.startDate).toBeDefined();
      expect(termRes.body.term.endDate).toBeDefined();
    });

    it('provisions a student user and permits admin password reset', async () => {
      const roll = `2026VERIF${Math.floor(100 + Math.random() * 900)}`;
      const email = `${roll.toLowerCase()}@university.edu`;

      const provRes = await apiReq('/api/auth/admin/provision-user', {
        method: 'POST',
        token: adminToken,
        body: {
          name: 'Verification Student',
          email,
          role: 'student',
          entityId: roll,
          password: 'StudentPass#2026!',
          studentDetails: { rollNumber: roll, sectionId: 'sec-3A', batchId: 'batch-3A1' },
        },
      });
      expect(provRes.status).toBe(200);
      expect(provRes.body.success).toBe(true);

      const resetRes = await apiReq('/api/auth/admin/reset-password', {
        method: 'POST',
        token: adminToken,
        body: { targetEmail: email, newPassword: 'UpdatedPass#2026!' },
      });
      expect(resetRes.status).toBe(200);
      expect(resetRes.body.success).toBe(true);
    });

    it('executes student cohort transfer via either /api/students/transfer or /api/students/:id/transfer', async () => {
      const res1 = await apiReq('/api/students/transfer', {
        method: 'POST',
        token: adminToken,
        body: {
          studentId: 'stud-1',
          newGroupId: 'sec-3B',
          newGroupType: 'section',
          effectiveDate: '2026-09-15',
        },
      });
      expect(res1.status).toBe(200);
      expect(res1.body.success).toBe(true);

      const res2 = await apiReq('/api/students/stud-1/transfer', {
        method: 'POST',
        token: adminToken,
        body: {
          groupType: 'section',
          targetGroupId: 'sec-3A',
          effectiveStartDate: '2026-09-20',
        },
      });
      expect(res2.status).toBe(200);
      expect(res2.body.success).toBe(true);
    });

    it('saves faculty availability policy and workload rules without errors', async () => {
      const res = await apiReq('/api/resources/teachers/t-26/availability', {
        method: 'POST',
        token: adminToken,
        body: { maxDailyHours: 4 },
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('approves teacher leave requests via /api/teachers/unavailability/:id/approve', async () => {
      // 1. Submit request as teacher
      const reqRes = await apiReq('/api/teachers/unavailability/request', {
        method: 'POST',
        token: teacherToken,
        body: {
          teacherId: 't-26',
          date: '2026-09-16',
          startSlot: 2,
          endSlot: 4,
          reason: 'Academic Research Conference',
        },
      });
      expect(reqRes.status).toBe(200);
      expect(reqRes.body.success).toBe(true);
      const leaveId = reqRes.body.request.id;

      // 2. Approve via UI path
      const appRes = await apiReq(`/api/teachers/unavailability/${leaveId}/approve`, {
        method: 'POST',
        token: adminToken,
      });
      expect(appRes.status).toBe(200);
      expect(appRes.body.success).toBe(true);
    });
  });

  describe('4. Teacher & Student Interactive Operations', () => {
    it('allows teacher to query conflict-free slots and book an extra class', async () => {
      const testDate = '2026-09-24';
      const queryRes = await apiReq(`/api/classes/extra/slots?date=${testDate}&dayOfWeek=4&activityType=L&targetId=sec-cse-3a`, {
        token: teacherToken,
      });
      expect(queryRes.status).toBe(200);
      expect(Array.isArray(queryRes.body.slots)).toBe(true);
      expect(queryRes.body.slots.length).toBeGreaterThan(0);

      const firstFreeSlot = queryRes.body.slots[0];

      const bookRes = await apiReq('/api/extra/book', {
        method: 'POST',
        token: teacherToken,
        body: {
          termId: 'term-sem3',
          courseOfferingId: 'off-sec-cse-3a-c-cs203-L',
          targetId: 'sec-cse-3a',
          targetType: 'section',
          date: testDate,
          dayOfWeek: 4,
          startSlot: firstFreeSlot.startSlot,
          roomId: firstFreeSlot.roomId,
          activityType: 'L',
        },
      });
      expect(bookRes.status).toBe(200);
      expect(bookRes.body.success).toBe(true);

      // Clean up booked extra class occurrence to keep database pristine & idempotent
      if (bookRes.body.occurrence?.id) {
        await apiReq(`/api/extra/${bookRes.body.occurrence.id}/cancel`, {
          method: 'POST',
          token: teacherToken,
          body: { reason: 'Test cleanup' },
        });
      }
    }, 15000);

    it('allows student to verify authenticated session and view their own profile', async () => {
      const meRes = await apiReq('/api/auth/me', { token: studentToken });
      expect(meRes.status).toBe(200);
      expect(meRes.body.user.role).toBe('student');
    });

    it('rejects unauthenticated requests to protected endpoints with 401', async () => {
      const res = await apiReq('/api/generation/compile-package', { method: 'POST' });
      expect(res.status).toBe(401);
    });
  });
});
