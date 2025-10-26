import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { chromium, Browser } from 'playwright';
import { ClubsPhase } from '@/lib/gomafia/import/phases/clubs-phase';
import { ImportOrchestrator } from '@/lib/gomafia/import/import-orchestrator';

describe('Clubs Phase Integration Tests', () => {
  let db: PrismaClient;
  let browser: Browser;
  let orchestrator: ImportOrchestrator;
  let clubsPhase: ClubsPhase;

  beforeEach(async () => {
    db = new PrismaClient();
    browser = await chromium.launch({ headless: true });
    orchestrator = new ImportOrchestrator(db, browser);
    clubsPhase = new ClubsPhase(orchestrator);
  });

  afterEach(async () => {
    // Cleanup any test clubs
    await db.club.deleteMany({
      where: { name: { startsWith: 'Test Club' } },
    });
    await browser.close();
    await db.$disconnect();
  });

  it('should initialize clubs phase', () => {
    expect(clubsPhase).toBeDefined();
  });

  it('should return correct phase name', () => {
    expect(clubsPhase.getPhaseName()).toBe('CLUBS');
  });

  it('should validate club data before insertion', async () => {
    const validClub = {
      gomafiaId: 'test-club-1',
      name: 'Test Club Valid',
      region: 'Москва',
      president: 'Test President',
      members: 50,
    };

    const isValid = await clubsPhase.validateData(validClub);
    expect(isValid).toBe(true);
  });

  it('should reject invalid club data', async () => {
    const invalidClub = {
      gomafiaId: '',
      name: 'A', // Too short
      region: null,
      president: null,
      members: -1, // Negative
    };

    const isValid = await clubsPhase.validateData(invalidClub);
    expect(isValid).toBe(false);
  });

  it('should skip duplicate clubs', async () => {
    // Create a test club first
    const user = await db.user.findFirst();
    const userId = user?.id || 'test-user-id';

    await db.club.create({
      data: {
        id: 'test-club-existing',
        gomafiaId: 'existing-123',
        name: 'Existing Club',
        createdBy: userId,
      },
    });

    const isDuplicate = await clubsPhase.checkDuplicate('existing-123');
    expect(isDuplicate).toBe(true);

    const isNew = await clubsPhase.checkDuplicate('new-456');
    expect(isNew).toBe(false);

    // Cleanup
    await db.club.delete({ where: { gomafiaId: 'existing-123' } });
  });

  it('should track phase progress', async () => {
    const checkpoint = clubsPhase.createCheckpoint(5, 10, ['club1', 'club2']);

    expect(checkpoint.phase).toBe('CLUBS');
    expect(checkpoint.lastBatchIndex).toBe(5);
    expect(checkpoint.totalBatches).toBe(10);
    expect(checkpoint.processedIds).toEqual(['club1', 'club2']);
  });

  it('should normalize region names', async () => {
    const normalizedMoscow = clubsPhase.normalizeRegion('МСК');
    expect(normalizedMoscow).toBe('Москва');

    const normalizedSpb = clubsPhase.normalizeRegion('СПб');
    expect(normalizedSpb).toBe('Санкт-Петербург');
  });
});
