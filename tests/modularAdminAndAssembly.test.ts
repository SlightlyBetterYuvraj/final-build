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

describe('Modular Administrative Management & Assembly Console Integration Tests', () => {
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

  describe('1. Academic Hierarchy (Years/Terms -> Sections -> Batches)', () => {
    it('creates an academic term with operating grid settings', async () => {
      const res = await fetch(`${testServer.url}/api/academic/terms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
        body: JSON.stringify({
          id: 'term-5',
          yearLabel: '2026-2027',
          semesterNumber: 5,
          cycle: 'odd',
          startDate: '2026-09-01',
          endDate: '2026-12-20',
          status: 'active',
          gridConfig: { days: [1, 2, 3, 4, 5], slotsPerDay: 8 },
        }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.term.id).toBe('term-5');
      expect(data.term.semesterNumber).toBe(5);

      // Verify in /api/state
      const stateRes = await fetch(`${testServer.url}/api/state`);
      const state = await stateRes.json();
      const createdTerm = state.academicTerms.find((t: any) => t.id === 'term-5');
      expect(createdTerm).toBeDefined();
    });

    it('rejects academic term creation when user role is not admin', async () => {
      const res = await fetch(`${testServer.url}/api/academic/terms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'student' },
        body: JSON.stringify({
          yearLabel: '2026-2027',
          semesterNumber: 7,
          startDate: '2026-09-01',
          endDate: '2026-12-20',
        }),
      });
      expect(res.status).toBe(403);
    });

    it('creates a section under an academic term with cohort student size', async () => {
      const res = await fetch(`${testServer.url}/api/academic/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
        body: JSON.stringify({
          termId: 'term-3',
          name: 'Section B',
          expectedCount: 45,
        }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.section.name).toBe('Section B');
      expect(data.section.expectedCount).toBe(45);
      expect(data.section.termId).toBe('term-3');
    });

    it('rejects section creation with non-existent term or zero cohort size', async () => {
      const res = await fetch(`${testServer.url}/api/academic/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
        body: JSON.stringify({
          termId: 'non-existent-term',
          name: 'Section X',
          expectedCount: 40,
        }),
      });
      expect(res.status).toBe(400);

      const resZero = await fetch(`${testServer.url}/api/academic/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
        body: JSON.stringify({
          termId: 'term-3',
          name: 'Section Zero',
          expectedCount: 0,
        }),
      });
      expect(resZero.status).toBe(400);
    });

    it('creates a practical/tutorial sub-batch under a parent section', async () => {
      const res = await fetch(`${testServer.url}/api/academic/batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
        body: JSON.stringify({
          sectionId: 'sec-A',
          name: 'Batch A2',
          expectedCount: 25,
        }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.batch.name).toBe('Batch A2');
      expect(data.batch.sectionId).toBe('sec-A');
      expect(data.batch.expectedCount).toBe(25);
    });
  });

  describe('2. Course Catalog & Delivery Settings (with ERR_ODD_P_HOURS Guardrail)', () => {
    it('creates a course with even practical hours (e.g. P = 2 or P = 4)', async () => {
      const res = await fetch(`${testServer.url}/api/catalog/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
        body: JSON.stringify({
          code: 'CS202',
          name: 'Database Systems',
          termId: 'term-3',
          department: 'Computer Science',
          lectureHours: 3,
          tutorialHours: 1,
          practicalHours: 2,
          requiredRoomType: 'LT',
        }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.course.code).toBe('CS202');
      expect(data.course.practicalHours).toBe(2);
    });

    it('strictly rejects course creation with odd practical hours under ERR_ODD_P_HOURS (D07/D44)', async () => {
      const res = await fetch(`${testServer.url}/api/catalog/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
        body: JSON.stringify({
          code: 'CS203',
          name: 'Operating Systems',
          termId: 'term-3',
          department: 'Computer Science',
          lectureHours: 3,
          tutorialHours: 0,
          practicalHours: 3, // Odd practical hours
          requiredRoomType: 'P',
        }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.code).toBe('ERR_ODD_P_HOURS');
      expect(data.error).toContain('Practical hours must be an even integer');
    });

    it('creates a course offering mapping course -> teacher -> cohort', async () => {
      const res = await fetch(`${testServer.url}/api/catalog/offerings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
        body: JSON.stringify({
          courseId: 'c-ds',
          teacherId: 't-2',
          targetType: 'batch',
          targetId: 'batch-A1',
        }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.offering.teacherId).toBe('t-2');
      expect(data.offering.targetType).toBe('batch');
      expect(data.offering.targetId).toBe('batch-A1');
    });
  });

  describe('3. Venues & Faculty Management', () => {
    it('creates rooms with LT and P capabilities', async () => {
      const resLt = await fetch(`${testServer.url}/api/resources/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
        body: JSON.stringify({
          roomNumber: '103',
          building: 'Engineering Block',
          floor: 1,
          capacity: 70,
          roomType: 'LT',
        }),
      });
      expect(resLt.status).toBe(200);
      const dataLt = await resLt.json();
      expect(dataLt.room.roomType).toBe('LT');

      const resP = await fetch(`${testServer.url}/api/resources/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
        body: JSON.stringify({
          roomNumber: 'Lab-B',
          building: 'CS Block',
          floor: 2,
          capacity: 30,
          roomType: 'P',
        }),
      });
      expect(resP.status).toBe(200);
      const dataP = await resP.json();
      expect(dataP.room.roomType).toBe('P');
    });

    it('registers faculty and sets regular weekly slot unavailability (D33)', async () => {
      const resTeacher = await fetch(`${testServer.url}/api/resources/teachers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
        body: JSON.stringify({
          empId: 'EMP-105',
          name: 'Dr. Carol Danvers',
          email: 'carol@uni.edu',
          department: 'Physics',
        }),
      });
      expect(resTeacher.status).toBe(200);
      const teacherData = await resTeacher.json();
      const teacherId = teacherData.teacher.id;

      // Set unavailability for Monday (day 1) period 2
      const resAvail = await fetch(`${testServer.url}/api/resources/teachers/${teacherId}/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
        body: JSON.stringify({
          dayOfWeek: 1,
          slotIndex: 2,
          isAvailable: false,
        }),
      });
      expect(resAvail.status).toBe(200);

      // Verify unavailability in /api/state
      const stateRes = await fetch(`${testServer.url}/api/state`);
      const state = await stateRes.json();
      const ta = state.teacherAvailabilities.find((a: any) => a.teacherId === teacherId && a.dayOfWeek === 1 && a.slotIndex === 2);
      expect(ta).toBeDefined();
      expect(ta.isAvailable).toBe(false);
    });
  });

  describe('4. Solver Input & Assembly Console', () => {
    it('POST /api/generation/compile-package compiles scope and reports pre-flight feasibility metrics', async () => {
      const res = await fetch(`${testServer.url}/api/generation/compile-package`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
        body: JSON.stringify({
          termIds: ['term-3'],
          scope: {
            roomIds: ['r-101', 'r-lab1'],
            teacherIds: ['t-1'],
            courseOfferingIds: ['off-ds-lec'],
            sectionIds: ['sec-A'],
          },
        }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.package).toBeDefined();
      expect(data.package.packageId).toBeDefined();
      expect(data.package.inputRevision).toBeDefined();
      expect(data.stats).toBeDefined();
      expect(data.stats.totalSlotsRequired).toBeGreaterThan(0);
      expect(data.stats.totalCapacity).toBeGreaterThan(0);
      expect(data.stats.isFeasible).toBe(true);
      expect(Array.isArray(data.stats.warnings)).toBe(true);
    });

    it('GET /api/generation/package/download supports scoped query parameters', async () => {
      const res = await fetch(`${testServer.url}/api/generation/package/download?termIds=term-3&roomIds=r-101`, {
        headers: { 'x-user-role': 'admin' },
      });
      expect(res.status).toBe(200);
      const pkg = await res.json();
      expect(pkg.rooms.length).toBe(1);
      expect(pkg.rooms[0].id).toBe('r-101');
    });

    it('executes full composition lifecycle: compile package, stage draft, and explicitly publish', async () => {
      // 1. Compile scoped package
      const compRes = await fetch(`${testServer.url}/api/generation/compile-package`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
        body: JSON.stringify({ termIds: ['term-3'] }),
      });
      const compData = await compRes.json();
      const pkg = compData.package;

      // 2. Stage draft matching compiled package revision (satisfying complete contact hours for c-ds: 2 L, 2 P)
      const draftPayload = {
        schemaVersion: '1.0.0',
        packageId: pkg.packageId,
        inputRevision: pkg.inputRevision,
        status: 'succeeded',
        termIds: ['term-3'],
        expectedOfferingIds: ['off-ds-lec'],
        classes: [
          {
            courseOfferingId: 'off-ds-lec',
            termId: 'term-3',
            dayOfWeek: 1,
            startSlot: 1,
            duration: 1,
            activityType: 'L',
            teacherId: 't-1',
            roomId: 'r-101',
            targetType: 'section',
            targetId: 'sec-A',
          },
          {
            courseOfferingId: 'off-ds-lec',
            termId: 'term-3',
            dayOfWeek: 2,
            startSlot: 1,
            duration: 1,
            activityType: 'L',
            teacherId: 't-1',
            roomId: 'r-101',
            targetType: 'section',
            targetId: 'sec-A',
          },
          {
            courseOfferingId: 'off-ds-lec',
            termId: 'term-3',
            dayOfWeek: 3,
            startSlot: 1,
            duration: 2,
            activityType: 'P',
            teacherId: 't-1',
            roomId: 'r-lab1',
            targetType: 'section',
            targetId: 'sec-A',
          },
        ],
      };

      const stageRes = await fetch(`${testServer.url}/api/generation/draft/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
        body: JSON.stringify({ draft: draftPayload }),
      });
      expect(stageRes.status).toBe(200);
      const stageData = await stageRes.json();
      expect(stageData.version.status).toBe('draft');

      // 3. Explicitly publish draft version
      const pubRes = await fetch(`${testServer.url}/api/timetable/versions/${stageData.version.id}/publish`, {
        method: 'POST',
        headers: { 'x-user-role': 'admin' },
      });
      expect(pubRes.status).toBe(200);
      const pubData = await pubRes.json();
      expect(pubData.publishedVersion.status).toBe('published');
      expect(pubData.instantiatedOccurrences).toBeGreaterThan(0);
    });
  });
});
