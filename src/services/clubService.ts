import { prisma } from '@/lib/db';
import { ClubSchema } from '@/lib/validations';
import { z } from 'zod';

export class ClubService {
  async getClubs(
    page: number = 1,
    limit: number = 20,
    search?: string,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
    minMembers?: number,
    region?: string
  ) {
    // Build orderBy clause
    let orderBy: any = {};
    if (sortBy === 'memberCount') {
      // For member count, we need to sort by _count.players
      // This requires a more complex query, so we'll sort by name for now
      // and handle member count filtering separately
      orderBy = { createdAt: sortOrder };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    const hasSearch = !!search;
    const searchTerm = search?.toLowerCase() || '';
    let clubs: any[] = [];
    let total = 0;

    if (hasSearch && searchTerm) {
      // For search queries, fetch exact matches and partial matches separately
      // to ensure exact matches are always included, even when sorting by other fields

      // Build where clause for exact matches
      const exactWhere: any = {
        name: {
          equals: search,
          mode: 'insensitive' as const,
        },
      };

      if (region) {
        exactWhere.region = region;
      }
      if (minMembers !== undefined) {
        exactWhere._count = {
          players: {
            gte: minMembers,
          },
        };
      }

      // Build where clause for all matches (contains)
      const allMatchesWhere: any = {
        name: {
          contains: search,
          mode: 'insensitive' as const,
        },
      };

      if (region) {
        allMatchesWhere.region = region;
      }
      if (minMembers !== undefined) {
        allMatchesWhere._count = {
          players: {
            gte: minMembers,
          },
        };
      }

      // Fetch exact matches (no limit, sorted by user's preference)
      // Fetch all matches (larger set to ensure good pagination, up to 1000)
      const fetchLimit = Math.min(1000, limit * 10);

      const [exactMatches, allMatches, _exactCount, allCount] =
        await Promise.all([
          prisma.club.findMany({
            where: exactWhere,
            orderBy,
            include: {
              creator: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              players: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
              _count: {
                select: {
                  players: true,
                },
              },
            },
          }),
          prisma.club.findMany({
            where: allMatchesWhere,
            orderBy,
            take: fetchLimit,
            include: {
              creator: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              players: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
              _count: {
                select: {
                  players: true,
                },
              },
            },
          }),
          prisma.club.count({ where: exactWhere }),
          prisma.club.count({ where: allMatchesWhere }),
        ]);

      // Filter out exact matches from allMatches to get only partial matches
      const exactMatchIds = new Set(exactMatches.map((c) => c.id));
      const partialMatches = allMatches.filter((c) => !exactMatchIds.has(c.id));

      // Combine: exact matches first, then partial matches
      const allClubs = [...exactMatches, ...partialMatches];
      total = allCount;

      // Apply pagination
      const paginatedSkip = (page - 1) * limit;
      clubs = allClubs.slice(paginatedSkip, paginatedSkip + limit);
    } else {
      // For non-search queries, use normal pagination
      const skip = (page - 1) * limit;
      const where: any = {};

      if (region) {
        where.region = region;
      }
      if (minMembers !== undefined && minMembers > 0) {
        // For member count filtering, we need to use a different approach
        // since Prisma doesn't support filtering by _count directly in where clause
        // We'll fetch all and filter, but this is less efficient - consider using a raw query
        where._count = {
          players: {
            gte: minMembers,
          },
        };
      }

      const [allClubs, totalCount] = await Promise.all([
        prisma.club.findMany({
          where,
          skip,
          take: limit,
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            players: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
            _count: {
              select: {
                players: true,
              },
            },
          },
          orderBy,
        }),
        prisma.club.count({ where }),
      ]);
      clubs = allClubs;
      total = totalCount;

      // Filter by minimum members if specified (post-query for cases where _count filter doesn't work)
      if (minMembers !== undefined && minMembers > 0) {
        const filteredClubs = clubs.filter(
          (club) => club._count.players >= minMembers
        );
        // Only update if filtering actually removed items (meaning where clause didn't work)
        if (filteredClubs.length !== clubs.length) {
          clubs = filteredClubs;
          total = await prisma.club.count({
            where: {
              ...where,
            },
          });
        }
      }
    }

    // Sort by member count if requested
    if (sortBy === 'memberCount') {
      clubs.sort((a, b) => {
        const diff = a._count.players - b._count.players;
        return sortOrder === 'asc' ? diff : -diff;
      });
    }

    return {
      data: clubs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getClubById(id: string) {
    const club = await prisma.club.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        players: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            roleStats: true,
          },
        },
        _count: {
          select: {
            players: true,
          },
        },
      },
    });

    if (!club) {
      throw new Error('Club not found');
    }

    return club;
  }

  async createClub(data: z.infer<typeof ClubSchema>, userId: string) {
    const validatedData = ClubSchema.parse(data);

    const club = await prisma.club.create({
      data: {
        ...validatedData,
        createdBy: userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return club;
  }

  async updateClub(id: string, data: Partial<z.infer<typeof ClubSchema>>) {
    const validatedData = ClubSchema.partial().parse(data);

    const club = await prisma.club.update({
      where: { id },
      data: validatedData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        players: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return club;
  }

  async deleteClub(id: string) {
    await prisma.club.delete({
      where: { id },
    });
  }

  async addPlayerToClub(clubId: string, playerId: string) {
    const player = await prisma.player.update({
      where: { id: playerId },
      data: { clubId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        club: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return player;
  }

  async removePlayerFromClub(_clubId: string, playerId: string) {
    const player = await prisma.player.update({
      where: { id: playerId },
      data: { clubId: null },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return player;
  }

  async getClubAnalytics(clubId: string) {
    const club = await this.getClubById(clubId);

    if (!club) {
      throw new Error('Club not found');
    }

    const memberCount = club.players.length;
    const totalGames = club.players.reduce(
      (sum, player) => sum + player.totalGames,
      0
    );
    const totalWins = club.players.reduce(
      (sum, player) => sum + player.wins,
      0
    );
    const averageElo =
      club.players.length > 0
        ? club.players.reduce((sum, player) => sum + player.eloRating, 0) /
          club.players.length
        : 0;

    // Calculate role distribution
    const roleDistribution = club.players.reduce(
      (acc, player) => {
        player.roleStats.forEach((roleStat) => {
          if (!acc[roleStat.role]) {
            acc[roleStat.role] = 0;
          }
          acc[roleStat.role] += roleStat.gamesPlayed;
        });
        return acc;
      },
      {} as Record<string, number>
    );

    // Calculate top performers
    const topPerformers = club.players
      .sort((a, b) => b.eloRating - a.eloRating)
      .slice(0, 5)
      .map((player) => ({
        id: player.id,
        name: player.name,
        eloRating: player.eloRating,
        totalGames: player.totalGames,
        wins: player.wins,
        winRate:
          player.totalGames > 0 ? (player.wins / player.totalGames) * 100 : 0,
      }));

    return {
      club,
      memberCount,
      totalGames,
      totalWins,
      winRate: totalGames > 0 ? (totalWins / totalGames) * 100 : 0,
      averageElo,
      roleDistribution,
      topPerformers,
    };
  }
}
