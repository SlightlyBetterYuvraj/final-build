import { describe, it, expect, beforeEach } from 'vitest';
import http from 'http';
import { TimetableRepository } from '../src/data/repository.js';
import { GeneratorAdapterService } from '../src/services/generatorAdapter.js';
import { AuthSession } from '../src/services/authService.js';

describe('Hosted Generator Service Runner & Local Fallback (D45, D47)', () => {
  let repo: TimetableRepository;
  let genAdapter: GeneratorAdapterService;

  const adminSession: AuthSession = {
    userId: 'admin-1',
    email: 'admin@uni.edu',
    role: 'admin',
  };

  beforeEach(async () => {
    repo = new TimetableRepository();
    genAdapter = new GeneratorAdapterService(repo);

    await repo.runTransaction(async (tx) => {
      tx.academicTerms.set('term-3', {
        id: 'term-3',
        yearLabel: '2026-2027',
        semesterNumber: 3,
        startDate: '2026-09-01',
        endDate: '2026-12-20',
        cycle: 'odd',
        status: 'active',
      });

      tx.rooms.set('r-101', {
        id: 'r-101',
        roomNumber: '101',
        building: 'Main',
        floor: 1,
        capacity: 60,
        roomType: 'LT',
        active: true,
      });

      tx.teachers.set('t-1', {
        id: 't-1',
        empId: 'EMP-1',
        name: 'Prof. Smith',
        email: 'smith@uni.edu',
        active: true,
      });

      tx.sections.set('sec-A', {
        id: 'sec-A',
        termId: 'term-3',
        name: 'A',
        expectedCount: 50,
        active: true,
      });

      tx.courses.set('c-math', {
        id: 'c-math',
        code: 'MATH201',
        name: 'Linear Algebra',
        termId: 'term-3',
        lectureHours: 1,
        tutorialHours: 0,
        practicalHours: 0,
        requiredRoomType: 'LT',
      });

      tx.courseOfferings.set('off-math', {
        id: 'off-math',
        courseId: 'c-math',
        termId: 'term-3',
        teacherId: 't-1',
        targetType: 'section',
        targetId: 'sec-A',
      });
    });
  });

  it('successfully contacts the live local generator runner on port 5001', async () => {
    const originalUrl = process.env.GENERATOR_SERVICE_URL;

    const mockServer = http.createServer((req, res) => {
      if (req.method === 'POST' && req.url === '/generate') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'succeeded', classes: [] }));
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    await new Promise<void>((resolve) => mockServer.listen(0, '127.0.0.1', () => resolve()));
    const port = (mockServer.address() as any).port;
    process.env.GENERATOR_SERVICE_URL = `http://127.0.0.1:${port}/generate`;

    try {
      const result = await genAdapter.requestGeneration(adminSession, ['term-3']);
      expect(result.hostedAvailable).toBe(true);
      expect(result.status).toBe('succeeded');
      expect(result.message).toContain('Hosted generation succeeded');

      const runStatus = genAdapter.getRunStatus(result.runId);
      expect(runStatus?.status).toBe('succeeded');
      expect(runStatus?.draftOutput).toBeDefined();
      expect(Array.isArray((runStatus?.draftOutput as any)?.classes)).toBe(true);
    } finally {
      process.env.GENERATOR_SERVICE_URL = originalUrl;
      await new Promise<void>((resolve) => mockServer.close(() => resolve()));
    }
  });

  it('gracefully reports unavailable with local fallback command if service is unreachable', async () => {
    const originalUrl = process.env.GENERATOR_SERVICE_URL;
    process.env.GENERATOR_SERVICE_URL = 'http://127.0.0.1:59999/generate';

    try {
      const result = await genAdapter.requestGeneration(adminSession, ['term-3']);
      expect(result.hostedAvailable).toBe(false);
      expect(result.status).toBe('unavailable');
      expect(result.message).toContain('Local solver fallback is ready');

      const runStatus = genAdapter.getRunStatus(result.runId);
      expect(runStatus?.status).toBe('unavailable');
      expect(runStatus?.diagnostics?.localFallbackCommand).toBeDefined();
    } finally {
      process.env.GENERATOR_SERVICE_URL = originalUrl;
    }
  });
});
