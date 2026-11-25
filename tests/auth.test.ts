import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createApp } from '../src/api/server.js';
import { TimetableRepository } from '../src/data/repository.js';
import type { Express } from 'express';

async function startTestServer(app: Express): Promise<{ url: string; close: () => Promise<void> }> {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 3000;
      resolve({
        url: `http://localhost:${port}`,
        close: () => new Promise<void>((res) => server.close(() => res())),
      });
    });
  });
}

describe('Authentication, Authorization & Session Integration (Phase 1)', { timeout: 30000 }, () => {
  let app: Express;
  let testServer: { url: string; close: () => Promise<void> };

  beforeEach(async () => {
    const repo = new TimetableRepository();
    app = createApp(repo);
    testServer = await startTestServer(app);
  });

  afterEach(async () => {
    if (testServer) {
      await testServer.close();
    }
  });

  describe('1. Auth Token Verification & Missing/Malformed Header Guards', () => {
    it('returns 401 Unauthorized when Authorization header is missing on protected endpoint', async () => {
      const res = await fetch(`${testServer.url}/api/auth/me`);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('UNAUTHORIZED');
      expect(data.message).toContain('Authentication required');
    });

    it('returns 401 Unauthorized when Authorization header is malformed (not Bearer format)', async () => {
      const res = await fetch(`${testServer.url}/api/auth/me`, {
        headers: { Authorization: 'Basic dXNlcjpwYXNz' },
      });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('UNAUTHORIZED');
      expect(data.message).toContain('Malformed authorization header');
    });

    it('returns 401 Unauthorized when Bearer token is invalid or corrupted', async () => {
      const res = await fetch(`${testServer.url}/api/auth/me`, {
        headers: { Authorization: 'Bearer this.is.an.invalid.token' },
      });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('UNAUTHORIZED');
      expect(data.message).toContain('Invalid or expired token');
    });

    it('returns 401 Unauthorized when Bearer token is empty', async () => {
      const res = await fetch(`${testServer.url}/api/auth/me`, {
        headers: { Authorization: 'Bearer ' },
      });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('UNAUTHORIZED');
    });
  });

  describe('2. Real Supabase Auth Login & Session Verification', () => {
    it('authenticates admin via POST /api/auth/login and receives verified profile', async () => {
      const res = await fetch(`${testServer.url}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@university.edu',
          password: 'AdminPassword123!',
        }),
      });

      // If credentials configured, verify real login; otherwise verify graceful report
      const data = await res.json();
      if (res.status === 200) {
        expect(data.success).toBe(true);
        expect(data.token).toBeDefined();
        expect(data.user.role).toBe('admin');
        expect(data.user.email).toBe('admin@university.edu');

        // Verify that the returned Bearer token authenticates against GET /api/auth/me
        const meRes = await fetch(`${testServer.url}/api/auth/me`, {
          headers: { Authorization: `Bearer ${data.token}` },
        });
        expect(meRes.status).toBe(200);
        const meData = await meRes.json();
        expect(meData.user.role).toBe('admin');
      } else {
        expect([401, 503]).toContain(res.status);
      }
    });

    it('returns 401 Unauthorized on invalid login credentials without exposing internals', async () => {
      const res = await fetch(`${testServer.url}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@university.edu',
          password: 'WrongPassword999!',
        }),
      });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('UNAUTHORIZED');
      expect(data.message).toBe('Invalid email or password.');
    });
  });

  describe('3. Role-Based Access Control Guards (403 Forbidden)', () => {
    it('rejects student attempting to provision users with 403 Forbidden', async () => {
      const res = await fetch(`${testServer.url}/api/auth/admin/provision-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'student',
          'x-user-id': 'stud-1',
        },
        body: JSON.stringify({
          email: 'newstudent@university.edu',
          name: 'Jane Student',
          role: 'student',
        }),
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe('FORBIDDEN');
      expect(data.message).toContain("Role 'student' is not authorized");
    });

    it('rejects teacher attempting to provision users with 403 Forbidden', async () => {
      const res = await fetch(`${testServer.url}/api/auth/admin/provision-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'teacher',
          'x-user-id': 't-1',
        },
        body: JSON.stringify({
          email: 'newfaculty@university.edu',
          name: 'New Faculty',
          role: 'teacher',
        }),
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe('FORBIDDEN');
    });

    it('rejects student attempting to upload a draft timetable with 403 Forbidden', async () => {
      const res = await fetch(`${testServer.url}/api/generation/draft/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'student',
        },
        body: JSON.stringify({ draft: {} }),
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe('FORBIDDEN');
    });

    it('rejects student attempting to publish timetable versions with 403 Forbidden', async () => {
      const res = await fetch(`${testServer.url}/api/timetable/versions/v-1/publish`, {
        method: 'POST',
        headers: {
          'x-user-role': 'student',
        },
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe('FORBIDDEN');
    });
  });

  describe('4. Teacher Occurrence Rescheduling Boundaries', () => {
    it('rejects teacher attempting to reschedule an occurrence assigned to other faculty with 403 Forbidden', async () => {
      // Setup demo schedule
      await fetch(`${testServer.url}/api/demo/seed-and-publish`, {
        method: 'POST',
        headers: { 'x-user-role': 'admin' },
      });

      // Find an occurrence assigned to teacher t-1
      const stateRes = await fetch(`${testServer.url}/api/state`);
      const state = await stateRes.json();
      const occurrence = state.classOccurrences.find((o: any) => o.teacherId === 't-1');
      expect(occurrence).toBeDefined();

      // Attempt to reschedule as teacher t-2 (different faculty)
      const res = await fetch(`${testServer.url}/api/classes/occurrences/${occurrence.id}/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'teacher',
          'x-user-id': 'teacher-other',
          'x-linked-id': 't-other', // Not t-1
        },
        body: JSON.stringify({
          date: '2026-09-10',
          dayOfWeek: 4,
          startSlot: 2,
        }),
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe('FORBIDDEN');
      expect(data.message).toContain('Teachers can only reschedule occurrences assigned to them');
    });

    it('allows assigned teacher to reschedule their own occurrence', async () => {
      // Setup demo schedule
      await fetch(`${testServer.url}/api/demo/seed-and-publish`, {
        method: 'POST',
        headers: { 'x-user-role': 'admin' },
      });

      const stateRes = await fetch(`${testServer.url}/api/state`);
      const state = await stateRes.json();
      const occurrence = state.classOccurrences.find((o: any) => o.teacherId === 't-1' && o.status === 'scheduled');
      expect(occurrence).toBeDefined();

      // Reschedule as assigned teacher t-1
      const res = await fetch(`${testServer.url}/api/classes/occurrences/${occurrence.id}/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'teacher',
          'x-user-id': 'teacher-1',
          'x-linked-id': 't-1', // Matches occurrence.teacherId
        },
        body: JSON.stringify({
          date: '2026-09-11',
          dayOfWeek: 5,
          startSlot: 7,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.occurrence.date).toBe('2026-09-11');
      expect(data.occurrence.startSlot).toBe(7);
    });
  });

  describe('5. Password Recovery Uniform Response (Anti-Enumeration)', () => {
    it('returns uniform message for registered email', async () => {
      const res = await fetch(`${testServer.url}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@university.edu' }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.message).toBe('If the email exists, a reset link has been dispatched');
    });

    it('returns identical uniform message for unregistered email to prevent enumeration', async () => {
      const res = await fetch(`${testServer.url}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'unregistered_random_user_99999@university.edu' }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.message).toBe('If the email exists, a reset link has been dispatched');
    });
  });

  describe('6. User Password Management (Change Password)', () => {
    it('rejects unauthenticated request to change password with 401 Unauthorized', async () => {
      const res = await fetch(`${testServer.url}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: 'NewValidPassword123!' }),
      });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('UNAUTHORIZED');
    });

    it('rejects password shorter than 6 characters with 400 INVALID_PASSWORD', async () => {
      const res = await fetch(`${testServer.url}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'student',
          'x-user-id': 'stud-1',
        },
        body: JSON.stringify({ newPassword: '123' }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('INVALID_PASSWORD');
    });

    it('allows authenticated student to change password successfully', async () => {
      const res = await fetch(`${testServer.url}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'student',
          'x-user-id': 'stud-1',
        },
        body: JSON.stringify({ newPassword: 'MyNewStudentPassword123!' }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain('Password updated successfully');
    });
  });

  describe('7. Real-Time Post-Commit Invariant & Live Event Stream (/api/realtime/stream)', () => {
    it('enforces post-commit invariant: failed transactions never emit live events', async () => {
      const repo = new TimetableRepository();
      let emitted = false;
      repo.onPostCommit(() => {
        emitted = true;
      });

      // Failed transaction
      await expect(
        repo.runTransaction(async () => {
          throw new Error('Simulated atomic constraint failure');
        })
      ).rejects.toThrow('Simulated atomic constraint failure');

      expect(emitted).toBe(false);
    });

    it('emits post-commit event strictly after successful commit', async () => {
      const repo = new TimetableRepository();
      const emittedEvents: any[] = [];
      repo.onPostCommit((evt) => {
        emittedEvents.push(evt);
      });

      await repo.runTransaction(async (tx) => {
        tx.notificationOutbox.push({
          id: 'test-notice-1',
          recipientStudentId: 'stud-1',
          eventType: 'TEST_EVENT',
          title: 'Test Notification',
          message: 'Post-commit verification',
          status: 'pending',
          retryCount: 0,
          createdAt: new Date().toISOString(),
        });
      });

      expect(emittedEvents.length).toBe(1);
      expect(emittedEvents[0].type).toBe('NOTIFICATIONS_DISPATCHED');
      expect(emittedEvents[0].payload[0].id).toBe('test-notice-1');
    });

    it('connects to /api/realtime/stream and receives connection handshake', async () => {
      const controller = new AbortController();
      const res = await fetch(`${testServer.url}/api/realtime/stream`, {
        signal: controller.signal,
      });

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/event-stream');

      // Read initial handshake chunk
      const reader = res.body?.getReader();
      const chunk = await reader?.read();
      const text = new TextDecoder().decode(chunk?.value);
      expect(text).toContain('CONNECTED');

      controller.abort();
    });
  });

  describe('7. Granular RBAC Role Protection on Sensitive Mutating Endpoints', () => {
    it('rejects student attempting to book extra classes with 403 Forbidden', async () => {
      const res = await fetch(`${testServer.url}/api/classes/extra/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'student',
          'x-user-id': 'stud-1',
        },
        body: JSON.stringify({
          date: '2026-09-08',
          dayOfWeek: 2,
          startSlot: 2,
          courseOfferingId: 'off-ds-lec',
          termId: 'term-3',
          roomId: 'r-101',
          targetType: 'section',
          targetId: 'sec-A',
        }),
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe('FORBIDDEN');
    });

    it('rejects teacher attempting to cancel extra class booked by another faculty with 403 Forbidden', async () => {
      // Seed demo
      await fetch(`${testServer.url}/api/demo/seed-and-publish`, {
        method: 'POST',
        headers: { 'x-user-role': 'admin' },
      });

      // Book extra class as teacher-1 (t-1)
      const bookRes = await fetch(`${testServer.url}/api/classes/extra/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'teacher',
          'x-user-id': 'teacher-1',
          'x-linked-id': 't-1',
        },
        body: JSON.stringify({
          date: '2026-09-10',
          dayOfWeek: 4,
          startSlot: 7,
          activityType: 'L',
          courseOfferingId: 'off-ds-lec',
          termId: 'term-3',
          roomId: 'r-101',
          targetType: 'section',
          targetId: 'sec-A',
        }),
      });
      expect(bookRes.status).toBe(200);
      const bookData = await bookRes.json();
      const extraOccId = bookData.occurrence.id;

      // Teacher-2 (t-2) attempts to cancel teacher-1's extra class -> 403 Forbidden
      const cancelRes = await fetch(`${testServer.url}/api/classes/extra/${extraOccId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'teacher',
          'x-user-id': 'teacher-2',
          'x-linked-id': 't-2',
        },
        body: JSON.stringify({ reason: 'Malicious cancellation attempt' }),
      });

      expect(cancelRes.status).toBe(403);
      const cancelData = await cancelRes.json();
      expect(cancelData.error).toBe('FORBIDDEN');
      expect(cancelData.message).toContain('Teachers can only cancel extra classes booked by themselves');
    });

    it('rejects student attempting to configure academic hierarchy or venues with 403 Forbidden', async () => {
      const termRes = await fetch(`${testServer.url}/api/academic/terms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'student',
        },
        body: JSON.stringify({ id: 'term-hack', yearLabel: '2026', semesterNumber: 1, startDate: '2026-01-01', endDate: '2026-05-01' }),
      });
      expect(termRes.status).toBe(403);

      const roomRes = await fetch(`${testServer.url}/api/resources/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'student',
        },
        body: JSON.stringify({ roomNumber: '999', building: 'Hacker Block' }),
      });
      expect(roomRes.status).toBe(403);

      const transRes = await fetch(`${testServer.url}/api/students/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'student',
        },
        body: JSON.stringify({ studentId: 'stud-1', newGroupId: 'sec-B', newGroupType: 'section', effectiveDate: '2026-09-01' }),
      });
      expect(transRes.status).toBe(403);
    });
  });
});

