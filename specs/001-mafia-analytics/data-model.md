# Data Model: Sport Mafia Game Analytics Platform

**Date**: December 2024  
**Feature**: Sport Mafia Game Analytics Platform  
**Purpose**: Define entities, relationships, and data structure for the analytics platform

## Entity Definitions

### User

**Purpose**: Platform users with authentication and subscription management

**Attributes**:

- `id`: UUID (Primary Key)
- `email`: String (Unique, Required)
- `name`: String (Required)
- `avatar`: String (Optional)
- `subscription_tier`: Enum (Free, Premium, Club, Enterprise)
- `created_at`: DateTime
- `updated_at`: DateTime
- `last_login`: DateTime (Optional)

**Relationships**:

- One-to-many with Player (users can have multiple player profiles)
- One-to-many with Club (users can be members of multiple clubs)
- One-to-many with Tournament (users can participate in tournaments)

**Validation Rules**:

- Email must be valid format
- Name must be 2-50 characters
- Subscription tier must be valid enum value

### Player

**Purpose**: Individual Mafia game players with performance data

**Attributes**:

- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key to User)
- `gomafia_id`: String (Unique, Required) - ID from gomafia.pro
- `name`: String (Required)
- `elo_rating`: Integer (Default: 1200)
- `total_games`: Integer (Default: 0)
- `wins`: Integer (Default: 0)
- `losses`: Integer (Default: 0)
- `club_id`: UUID (Foreign Key to Club, Optional)
- `created_at`: DateTime
- `updated_at`: DateTime

**Relationships**:

- Many-to-one with User (player belongs to user)
- Many-to-one with Club (player can belong to club)
- One-to-many with GameParticipation (player participates in games)
- One-to-many with PlayerRoleStats (player has role-specific statistics)

**Validation Rules**:

- Name must be 2-50 characters
- ELO rating must be between 0-3000
- Total games must be >= 0
- Wins + losses must equal total games

### Club

**Purpose**: Teams or organizations with member management

**Attributes**:

- `id`: UUID (Primary Key)
- `name`: String (Required, Unique)
- `description`: String (Optional)
- `logo_url`: String (Optional)
- `created_by`: UUID (Foreign Key to User)
- `created_at`: DateTime
- `updated_at`: DateTime

**Relationships**:

- One-to-many with Player (club has multiple players)
- One-to-many with Tournament (club can participate in tournaments)
- One-to-many with ClubMembership (club has memberships)

**Validation Rules**:

- Name must be 3-100 characters
- Description must be <= 500 characters

### Game

**Purpose**: Individual Mafia game instances

**Attributes**:

- `id`: UUID (Primary Key)
- `gomafia_id`: String (Unique, Required) - ID from gomafia.pro
- `tournament_id`: UUID (Foreign Key to Tournament, Optional)
- `date`: DateTime (Required)
- `duration_minutes`: Integer (Optional)
- `winner_team`: Enum (Black, Red, Draw)
- `status`: Enum (Scheduled, InProgress, Completed, Cancelled)
- `created_at`: DateTime
- `updated_at`: DateTime

**Relationships**:

- Many-to-one with Tournament (game can belong to tournament)
- One-to-many with GameParticipation (game has participants)
- One-to-many with GameRoleAssignment (game has role assignments)

**Validation Rules**:

- Date must be in the past for completed games
- Duration must be positive if provided
- Status must be valid enum value

### GameParticipation

**Purpose**: Join table for players participating in games

**Attributes**:

- `id`: UUID (Primary Key)
- `player_id`: UUID (Foreign Key to Player)
- `game_id`: UUID (Foreign Key to Game)
- `role`: Enum (Don, Mafia, Sheriff, Citizen)
- `team`: Enum (Black, Red)
- `is_winner`: Boolean
- `performance_score`: Integer (Optional) - calculated performance metric

**Relationships**:

- Many-to-one with Player
- Many-to-one with Game

**Validation Rules**:

- Role must be valid enum value
- Team must be valid enum value
- Performance score must be between 0-100 if provided

### Tournament

**Purpose**: Competitive events with brackets and results

**Attributes**:

- `id`: UUID (Primary Key)
- `name`: String (Required)
- `description`: String (Optional)
- `start_date`: DateTime (Required)
- `end_date`: DateTime (Optional)
- `status`: Enum (Scheduled, InProgress, Completed, Cancelled)
- `max_participants`: Integer (Optional)
- `entry_fee`: Decimal (Optional)
- `prize_pool`: Decimal (Optional)
- `created_by`: UUID (Foreign Key to User)
- `created_at`: DateTime
- `updated_at`: DateTime

**Relationships**:

- One-to-many with Game (tournament has multiple games)
- One-to-many with TournamentParticipation (tournament has participants)
- Many-to-one with User (tournament created by user)

**Validation Rules**:

- Name must be 3-100 characters
- Start date must be in the future for scheduled tournaments
- End date must be after start date
- Max participants must be positive if provided

### PlayerRoleStats

**Purpose**: Role-specific performance statistics for players

**Attributes**:

- `id`: UUID (Primary Key)
- `player_id`: UUID (Foreign Key to Player)
- `role`: Enum (Don, Mafia, Sheriff, Citizen)
- `games_played`: Integer (Default: 0)
- `wins`: Integer (Default: 0)
- `losses`: Integer (Default: 0)
- `win_rate`: Decimal (Calculated: wins / games_played)
- `average_performance`: Decimal (Calculated average performance score)
- `last_played`: DateTime (Optional)
- `created_at`: DateTime
- `updated_at`: DateTime

**Relationships**:

- Many-to-one with Player

**Validation Rules**:

- Role must be valid enum value
- Games played must be >= 0
- Wins + losses must equal games played
- Win rate must be between 0-1

### Analytics

**Purpose**: Pre-computed analytics and metrics

**Attributes**:

- `id`: UUID (Primary Key)
- `entity_type`: Enum (Player, Club, Tournament)
- `entity_id`: UUID (Foreign Key to respective entity)
- `metric_name`: String (Required)
- `metric_value`: Decimal (Required)
- `metric_period`: Enum (Daily, Weekly, Monthly, AllTime)
- `calculated_at`: DateTime
- `valid_until`: DateTime (Optional)

**Relationships**:

- Polymorphic relationship with Player, Club, or Tournament

**Validation Rules**:

- Metric name must be valid enum value
- Metric value must be numeric
- Valid until must be in the future if provided

## Database Schema (Prisma)

```prisma
model User {
  id              String    @id @default(uuid())
  email           String    @unique
  name            String
  avatar          String?
  subscriptionTier SubscriptionTier @default(FREE)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  lastLogin       DateTime?

  players         Player[]
  clubs           Club[]
  tournaments     Tournament[]

  @@map("users")
}

model Player {
  id          String    @id @default(uuid())
  userId      String
  gomafiaId   String    @unique
  name        String
  eloRating   Int       @default(1200)
  totalGames  Int       @default(0)
  wins        Int       @default(0)
  losses      Int       @default(0)
  clubId      String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user        User      @relation(fields: [userId], references: [id])
  club        Club?     @relation(fields: [clubId], references: [id])
  participations GameParticipation[]
  roleStats   PlayerRoleStats[]

  @@map("players")
}

model Club {
  id          String    @id @default(uuid())
  name        String    @unique
  description String?
  logoUrl     String?
  createdBy   String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  creator     User      @relation(fields: [createdBy], references: [id])
  players     Player[]
  tournaments Tournament[]

  @@map("clubs")
}

model Game {
  id              String    @id @default(uuid())
  gomafiaId       String    @unique
  tournamentId    String?
  date            DateTime
  durationMinutes Int?
  winnerTeam      WinnerTeam?
  status          GameStatus @default(SCHEDULED)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  tournament      Tournament? @relation(fields: [tournamentId], references: [id])
  participations  GameParticipation[]

  @@map("games")
}

model GameParticipation {
  id               String    @id @default(uuid())
  playerId         String
  gameId           String
  role             PlayerRole
  team             Team
  isWinner         Boolean
  performanceScore Int?

  player           Player    @relation(fields: [playerId], references: [id])
  game             Game      @relation(fields: [gameId], references: [id])

  @@unique([playerId, gameId])
  @@map("game_participations")
}

model Tournament {
  id              String    @id @default(uuid())
  name            String
  description     String?
  startDate       DateTime
  endDate         DateTime?
  status          TournamentStatus @default(SCHEDULED)
  maxParticipants Int?
  entryFee        Decimal?
  prizePool       Decimal?
  createdBy       String
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  creator         User      @relation(fields: [createdBy], references: [id])
  games           Game[]

  @@map("tournaments")
}

model PlayerRoleStats {
  id                  String    @id @default(uuid())
  playerId            String
  role                PlayerRole
  gamesPlayed         Int       @default(0)
  wins                Int       @default(0)
  losses              Int       @default(0)
  winRate             Decimal   @default(0)
  averagePerformance  Decimal   @default(0)
  lastPlayed          DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  player              Player    @relation(fields: [playerId], references: [id])

  @@unique([playerId, role])
  @@map("player_role_stats")
}

model Analytics {
  id          String    @id @default(uuid())
  entityType  EntityType
  entityId    String
  metricName  String
  metricValue Decimal
  metricPeriod MetricPeriod
  calculatedAt DateTime @default(now())
  validUntil  DateTime?

  @@map("analytics")
}

enum SubscriptionTier {
  FREE
  PREMIUM
  CLUB
  ENTERPRISE
}

enum PlayerRole {
  DON
  MAFIA
  SHERIFF
  CITIZEN
}

enum Team {
  BLACK
  RED
}

enum WinnerTeam {
  BLACK
  RED
  DRAW
}

enum GameStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum TournamentStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum EntityType {
  PLAYER
  CLUB
  TOURNAMENT
}

enum MetricPeriod {
  DAILY
  WEEKLY
  MONTHLY
  ALL_TIME
}
```

## Data Validation Rules

### Zod Schemas

```typescript
// User validation
const UserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(50),
  avatar: z.string().url().optional(),
  subscriptionTier: z.enum(['FREE', 'PREMIUM', 'CLUB', 'ENTERPRISE']),
});

// Player validation
const PlayerSchema = z
  .object({
    gomafiaId: z.string().min(1),
    name: z.string().min(2).max(50),
    eloRating: z.number().int().min(0).max(3000),
    totalGames: z.number().int().min(0),
    wins: z.number().int().min(0),
    losses: z.number().int().min(0),
  })
  .refine((data) => data.wins + data.losses === data.totalGames, {
    message: 'Wins + losses must equal total games',
  });

// Game validation
const GameSchema = z.object({
  gomafiaId: z.string().min(1),
  date: z.date(),
  durationMinutes: z.number().int().positive().optional(),
  winnerTeam: z.enum(['BLACK', 'RED', 'DRAW']).optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
});
```

## State Transitions

### Game Status Flow

```
SCHEDULED → IN_PROGRESS → COMPLETED
    ↓           ↓
CANCELLED   CANCELLED
```

### Tournament Status Flow

```
SCHEDULED → IN_PROGRESS → COMPLETED
    ↓           ↓
CANCELLED   CANCELLED
```

### Player ELO Rating Updates

- ELO rating updates after each game completion
- Win: +25 points (adjustable based on opponent rating)
- Loss: -25 points (adjustable based on opponent rating)
- Minimum ELO: 0, Maximum ELO: 3000

## Data Relationships Summary

1. **User** → **Player** (1:many) - Users can have multiple player profiles
2. **User** → **Club** (1:many) - Users can create multiple clubs
3. **Player** → **Club** (many:1) - Players can belong to one club
4. **Player** → **GameParticipation** (1:many) - Players participate in multiple games
5. **Game** → **GameParticipation** (1:many) - Games have multiple participants
6. **Tournament** → **Game** (1:many) - Tournaments contain multiple games
7. **Player** → **PlayerRoleStats** (1:many) - Players have stats for each role
8. **Entity** → **Analytics** (polymorphic) - Any entity can have analytics

## Indexes and Performance

### Database Indexes

- `users.email` (unique index)
- `players.gomafia_id` (unique index)
- `games.gomafia_id` (unique index)
- `game_participations.player_id` (index)
- `game_participations.game_id` (index)
- `analytics.entity_type + entity_id` (composite index)
- `analytics.calculated_at` (index for time-based queries)

### Query Optimization

- Use database views for complex analytics queries
- Implement materialized views for frequently accessed aggregations
- Cache computed analytics in Redis
- Use database connection pooling
- Implement query result caching

## Data Migration Strategy

### Initial Data Import

1. Parse gomafia.pro data structure
2. Validate data against schemas
3. Transform and normalize data
4. Import in batches to avoid timeouts
5. Verify data integrity after import

### Ongoing Data Sync

1. Scheduled jobs to fetch new data
2. Incremental updates based on timestamps
3. Conflict resolution for data inconsistencies
4. Error handling and retry logic
5. Data validation before storage

This data model provides a solid foundation for the Sport Mafia Game Analytics platform, supporting all required features while maintaining data integrity and performance.
