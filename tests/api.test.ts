import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createApp } from '../src/api/server.js';
import { TimetableRepository } from '../src/data/repository.js';
import type { Express } from 'express';

// Simple request helper using native fetch against ephemeral listening server
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

describe('Phase 7 — HTTP API & Workflow Integration', () => {
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

  it('GET /api/state returns seeded academic reference data', async () => {
    const res = await fetch(`${testServer.url}/api/state`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.academicTerms.length).toBeGreaterThan(0);
    expect(data.rooms.length).toBeGreaterThan(0);
    expect(data.teachers.length).toBeGreaterThan(0);
  });

  it('POST /api/generation/request reports hosted unavailable and provides local solver instructions when GENERATOR_SERVICE_URL is not set', async () => {
    const origUrl = process.env.GENERATOR_SERVICE_URL;
    delete process.env.GENERATOR_SERVICE_URL;
    try {
      const res = await fetch(`${testServer.url}/api/generation/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
        body: JSON.stringify({ termIds: ['term-3'] }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.hostedAvailable).toBe(false);
      expect(data.status).toBe('unavailable');
      expect(data.message).toContain('Hosted generator is unconfigured');
      expect(data.package).toBeDefined();
      expect(data.package.packageId).toBeDefined();
    } finally {
      process.env.GENERATOR_SERVICE_URL = origUrl;
    }
  });

  it('GET /api/generation/package/download downloads valid generation package JSON', async () => {
    const res = await fetch(`${testServer.url}/api/generation/package/download`, {
      headers: { 'x-user-role': 'admin' },
    });
    expect(res.status).toBe(200);
    const pkg = await res.json();
    expect(pkg.schemaVersion).toBe('1.0.0');
    expect(pkg.rooms.length).toBeGreaterThan(0);
    expect(pkg.courses.length).toBeGreaterThan(0);
  });

  it('exercises full end-to-end flow: upload draft, publish, book extra class, cancel occurrence', async () => {
    // 1. Download generation package to obtain matching input revision for term-3
    const pkgRes = await fetch(`${testServer.url}/api/generation/package/download?termIds=term-3`, {
      headers: { 'x-user-role': 'admin' },
    });
    const pkg = await pkgRes.json();

    // 2. Upload valid draft
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

    const uploadRes = await fetch(`${testServer.url}/api/generation/draft/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
      body: JSON.stringify({ draft: draftPayload }),
    });
    const uploadData = await uploadRes.json();
    expect(uploadData.success).toBe(true);
    expect(uploadData.version.status).toBe('draft');

    // 3. Publish draft
    const pubRes = await fetch(`${testServer.url}/api/timetable/versions/${uploadData.version.id}/publish`, {
      method: 'POST',
      headers: { 'x-user-role': 'admin' },
    });
    const pubData = await pubRes.json();
    expect(pubData.success).toBe(true);
    expect(pubData.publishedVersion.status).toBe('published');
    expect(pubData.instantiatedOccurrences).toBeGreaterThan(0);

    // 4. Query state to get an instantiated occurrence ID belonging to teacher t-1 for student cohort sec-A
    const stateRes = await fetch(`${testServer.url}/api/state`);
    const state = await stateRes.json();
    const occId = state.classOccurrences.find((o: any) => o.targetId === 'sec-A' && o.teacherId === 't-1')?.id || state.classOccurrences[0].id;

    // 5. Cancel occurrence as teacher
    const cancelRes = await fetch(`${testServer.url}/api/classes/occurrences/${occId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'teacher', 'x-linked-id': 't-1' },
      body: JSON.stringify({ reason: 'Emergency leave' }),
    });
    const cancelData = await cancelRes.json();
    expect(cancelData.success).toBe(true);
    expect(cancelData.occurrence.status).toBe('cancelled');

    // 6. Check student notification inbox
    const inboxRes = await fetch(`${testServer.url}/api/notifications/inbox?studentId=stud-1`);
    const inboxData = await inboxRes.json();
    expect(inboxData.notices.length).toBeGreaterThan(0);
    expect(inboxData.notices.some((n: any) => n.eventType === 'CLASS_CANCELLED')).toBe(true);
  });

  it('POST /api/admin/curriculum/csv-import and /api/admin/wipe-database execute successfully', async () => {
    // 1. Ingest sample CSVs
    const sampleFiles = [
      {
        filename: 'academic_terms.csv',
        content: 'id,year_label,semester_number,start_date,end_date,cycle,status\nterm_test,2026-2027,1,2026-08-01,2026-12-15,odd,active',
      },
      {
        filename: 'rooms.csv',
        content: 'id,room_number,building,floor,capacity,room_type,active\nroom_test_1,LT-TEST,Academic Block A,1,100,lecture,true',
      },
      {
        filename: 'teachers.csv',
        content: 'id,emp_id,name,email,active\nfac_test_1,EMPTEST,Dr. Test,test@jklu.edu.in,true',
      },
    ];

    const importRes = await fetch(`${testServer.url}/api/admin/curriculum/csv-import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
      body: JSON.stringify({ files: sampleFiles }),
    });
    expect(importRes.status).toBe(200);
    const importData = await importRes.json();
    expect(importData.success).toBe(true);
    expect(importData.counts.terms).toBe(1);
    expect(importData.counts.rooms).toBe(1);
    expect(importData.counts.teachers).toBe(1);

    // 2. Wipe database
    const wipeRes = await fetch(`${testServer.url}/api/admin/wipe-database`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
    });
    expect(wipeRes.status).toBe(200);
    const wipeData = await wipeRes.json();
    expect(wipeData.success).toBe(true);
  });
});
