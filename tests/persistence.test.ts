import { describe, it, expect } from 'vitest';
import { TimetableRepository } from '../src/data/repository.js';
import { Room } from '../src/domain/types.js';

describe('Phase 2 — Persistence, Transactions & Rollback Guarantees', () => {
  it('guarantees atomic rollback on exception inside transaction', async () => {
    const repo = new TimetableRepository();
    const initialRoom: Room = {
      id: 'r-1',
      roomNumber: '101',
      building: 'Main',
      floor: 1,
      capacity: 50,
      roomType: 'LT',
      active: true,
    };

    // Pre-populate initial state
    await repo.runTransaction(async (tx) => {
      tx.rooms.set('r-1', initialRoom);
    });

    expect(repo.getState().rooms.get('r-1')?.capacity).toBe(50);

    // Attempt a transaction that modifies the room and then throws an error
    await expect(
      repo.runTransaction(async (tx) => {
        const r = tx.rooms.get('r-1')!;
        r.capacity = 100; // intermediate write
        tx.rooms.set('r-2', {
          id: 'r-2',
          roomNumber: '102',
          building: 'Main',
          floor: 1,
          capacity: 40,
          roomType: 'LT',
          active: true,
        });
        throw new Error('SIMULATED_DB_FAILURE: Connection lost before commit');
      })
    ).rejects.toThrow('SIMULATED_DB_FAILURE');

    // Verify rollback guarantee (AGENTS.md rule 3):
    // Room 1 capacity must still be 50, and Room 2 must NOT exist!
    const stateAfterRollback = repo.getState();
    expect(stateAfterRollback.rooms.get('r-1')?.capacity).toBe(50);
    expect(stateAfterRollback.rooms.has('r-2')).toBe(false);
  });

  it('atomically commits state on successful transaction', async () => {
    const repo = new TimetableRepository();
    await repo.runTransaction(async (tx) => {
      tx.rooms.set('r-committed', {
        id: 'r-committed',
        roomNumber: '201',
        building: 'Science Block',
        floor: 2,
        capacity: 45,
        roomType: 'LT',
        active: true,
      });
    });

    expect(repo.getState().rooms.has('r-committed')).toBe(true);
    expect(repo.getState().rooms.get('r-committed')?.roomNumber).toBe('201');
  });

  it('persists audit events and delivers outbox notifications after commit', async () => {
    const repo = new TimetableRepository();
    repo.logAudit('admin-1', 'CREATE_RECORD', 'rooms', 'r-1', 'success', { note: 'test' });
    expect(repo.getState().auditEvents.length).toBe(1);
    expect(repo.getState().auditEvents[0].actorId).toBe('admin-1');

    await repo.runTransaction(async (tx) => {
      tx.notificationOutbox.push({
        id: 'n-1',
        recipientStudentId: 'stud-1',
        eventType: 'TEST_NOTICE',
        title: 'Notice',
        message: 'Hello Student',
        status: 'pending',
        retryCount: 0,
        createdAt: new Date().toISOString(),
      });
    });

    const pending = repo.getState().notificationOutbox.filter((n) => n.status === 'pending');
    expect(pending.length).toBe(1);

    // Deliver notifications post-commit
    const delivered = repo.deliverPendingNotifications();
    expect(delivered.length).toBe(1);
    expect(repo.getState().notificationOutbox[0].status).toBe('delivered');
  });
});
