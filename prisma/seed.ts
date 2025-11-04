import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding test database...');

  // Create test users
  const user1 = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      subscriptionTier: 'FREE',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      subscriptionTier: 'PREMIUM',
      role: 'admin',
    },
  });

  // Create test club
  const club = await prisma.club.upsert({
    where: { name: 'Test Club' },
    update: {},
    create: {
      name: 'Test Club',
      description: 'A test club for E2E testing',
      createdBy: user1.id,
    },
  });

  // Create test players
  const players = [
    {
      gomafiaId: 'gm-001',
      name: 'John Doe',
      eloRating: 1500,
      totalGames: 100,
      wins: 60,
      losses: 40,
      userId: user1.id,
      clubId: club.id,
    },
    {
      gomafiaId: 'gm-002',
      name: 'Jane Smith',
      eloRating: 1400,
      totalGames: 80,
      wins: 45,
      losses: 35,
      userId: user2.id,
      clubId: club.id,
    },
    {
      gomafiaId: 'gm-003',
      name: 'Bob Johnson',
      eloRating: 1600,
      totalGames: 120,
      wins: 80,
      losses: 40,
      userId: user1.id,
    },
  ];

  for (const playerData of players) {
    await prisma.player.upsert({
      where: { gomafiaId: playerData.gomafiaId },
      update: {},
      create: playerData,
    });
  }

  // Create test games
  const game = await prisma.game.create({
    data: {
      gomafiaId: 'game-001',
      date: new Date(),
      durationMinutes: 45,
      winnerTeam: 'BLACK',
      status: 'COMPLETED',
    },
  });

  // Create game participations
  const players_list = await prisma.player.findMany();
  if (players_list.length >= 2) {
    await prisma.gameParticipation.createMany({
      data: [
        {
          playerId: players_list[0].id,
          gameId: game.id,
          role: 'DON',
          team: 'BLACK',
          isWinner: true,
          performanceScore: 85,
        },
        {
          playerId: players_list[1].id,
          gameId: game.id,
          role: 'MAFIA',
          team: 'BLACK',
          isWinner: true,
          performanceScore: 75,
        },
      ],
    });
  }

  // Create role stats
  for (const player of players_list) {
    await prisma.playerRoleStats.upsert({
      where: {
        playerId_role: {
          playerId: player.id,
          role: 'DON',
        },
      },
      update: {},
      create: {
        playerId: player.id,
        role: 'DON',
        gamesPlayed: 10,
        wins: 7,
        losses: 3,
        winRate: 0.7,
        averagePerformance: 80.5,
        lastPlayed: new Date(),
      },
    });
  }

  // Seed regions with default regions data
  const defaultRegions = [
    {
      code: 'RU',
      name: 'Russia',
      country: 'Russia',
      isActive: true,
      playerCount: 0,
    },
    {
      code: 'UA',
      name: 'Ukraine',
      country: 'Ukraine',
      isActive: true,
      playerCount: 0,
    },
    {
      code: 'BY',
      name: 'Belarus',
      country: 'Belarus',
      isActive: true,
      playerCount: 0,
    },
    {
      code: 'KZ',
      name: 'Kazakhstan',
      country: 'Kazakhstan',
      isActive: true,
      playerCount: 0,
    },
    {
      code: 'US',
      name: 'United States',
      country: 'United States',
      isActive: true,
      playerCount: 0,
    },
    {
      code: 'DE',
      name: 'Germany',
      country: 'Germany',
      isActive: true,
      playerCount: 0,
    },
    {
      code: 'FR',
      name: 'France',
      country: 'France',
      isActive: true,
      playerCount: 0,
    },
    {
      code: 'GB',
      name: 'United Kingdom',
      country: 'United Kingdom',
      isActive: true,
      playerCount: 0,
    },
    {
      code: 'CA',
      name: 'Canada',
      country: 'Canada',
      isActive: true,
      playerCount: 0,
    },
    {
      code: 'AU',
      name: 'Australia',
      country: 'Australia',
      isActive: true,
      playerCount: 0,
    },
  ];

  for (const regionData of defaultRegions) {
    await prisma.region.upsert({
      where: { code: regionData.code },
      update: {},
      create: regionData,
    });
  }

  console.log('Test database seeded successfully!');
  console.log(`Seeded ${defaultRegions.length} regions`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
