import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

describe('Import API Endpoints Integration Tests', () => {
  let db: PrismaClient;
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  beforeEach(async () => {
    db = new PrismaClient();
  });

  afterEach(async () => {
    await db.$disconnect();
  });

  describe('POST /api/gomafia-sync/import', () => {
    it('should trigger import when no import is running', async () => {
      // Ensure no import is running
      await db.syncStatus.deleteMany({});

      const response = await fetch(`${baseUrl}/api/gomafia-sync/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data.message).toContain('Import started');
      expect(data.status).toBeDefined();

      // Verify sync status was created
      const syncStatus = await db.syncStatus.findUnique({
        where: { id: 'current' },
      });

      expect(syncStatus).toBeDefined();
      expect(syncStatus?.isRunning).toBe(true);
    });

    it('should reject import when another import is already running', async () => {
      // Create a running import
      await db.syncStatus.upsert({
        where: { id: 'current' },
        update: {
          isRunning: true,
          progress: 25,
          currentPhase: 'CLUBS',
          currentOperation: 'Importing clubs...',
        },
        create: {
          id: 'current',
          isRunning: true,
          progress: 25,
          currentPhase: 'CLUBS',
          currentOperation: 'Importing clubs...',
        },
      });

      const response = await fetch(`${baseUrl}/api/gomafia-sync/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(409);
      const data = await response.json();

      expect(data.error).toContain('already running');
      expect(data.code).toBe('IMPORT_ALREADY_RUNNING');
    });

    it('should accept auto-triggered flag in request body', async () => {
      // Ensure no import is running
      await db.syncStatus.deleteMany({});

      const response = await fetch(`${baseUrl}/api/gomafia-sync/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoTriggered: true }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data.message).toContain('Import started');
    });
  });

  describe('GET /api/gomafia-sync/import/check-empty', () => {
    it('should detect empty database', async () => {
      // Ensure database is empty
      await db.player.deleteMany({});
      await db.game.deleteMany({});

      const response = await fetch(
        `${baseUrl}/api/gomafia-sync/import/check-empty`
      );

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data.isEmpty).toBe(true);
      expect(data.playerCount).toBe(0);
      expect(data.gameCount).toBe(0);
      expect(data.shouldAutoImport).toBe(true);
    });

    it('should detect non-empty database', async () => {
      // Create a test player
      await db.player.create({
        data: {
          id: 'test-player-api-check',
          userId: 'test-user',
          gomafiaId: 'test-api-check-1',
          name: 'Test Player API Check',
          eloRating: 1200,
          totalGames: 0,
          wins: 0,
          losses: 0,
        },
      });

      const response = await fetch(
        `${baseUrl}/api/gomafia-sync/import/check-empty`
      );

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data.isEmpty).toBe(false);
      expect(data.playerCount).toBeGreaterThan(0);
      expect(data.shouldAutoImport).toBe(false);

      // Cleanup
      await db.player.delete({ where: { gomafiaId: 'test-api-check-1' } });
    });

    it('should return valid JSON structure', async () => {
      const response = await fetch(
        `${baseUrl}/api/gomafia-sync/import/check-empty`
      );

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data).toHaveProperty('isEmpty');
      expect(data).toHaveProperty('playerCount');
      expect(data).toHaveProperty('gameCount');
      expect(data).toHaveProperty('shouldAutoImport');

      expect(typeof data.isEmpty).toBe('boolean');
      expect(typeof data.playerCount).toBe('number');
      expect(typeof data.gameCount).toBe('number');
      expect(typeof data.shouldAutoImport).toBe('boolean');
    });
  });

  describe('GET /api/gomafia-sync/import/status', () => {
    it('should return current import status', async () => {
      // Create a sync status
      await db.syncStatus.upsert({
        where: { id: 'current' },
        update: {
          isRunning: true,
          progress: 50,
          currentPhase: 'TOURNAMENTS',
          currentOperation: 'Importing tournaments...',
        },
        create: {
          id: 'current',
          isRunning: true,
          progress: 50,
          currentPhase: 'TOURNAMENTS',
          currentOperation: 'Importing tournaments...',
        },
      });

      const response = await fetch(`${baseUrl}/api/gomafia-sync/import/status`);

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data.isRunning).toBe(true);
      expect(data.progress).toBe(50);
      expect(data.currentPhase).toBe('TOURNAMENTS');
      expect(data.currentOperation).toContain('tournaments');
    });

    it('should return idle status when no import is running', async () => {
      // Ensure no import is running
      await db.syncStatus.deleteMany({});

      const response = await fetch(`${baseUrl}/api/gomafia-sync/import/status`);

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data.isRunning).toBe(false);
      expect(data.progress).toBe(0);
    });
  });
});
