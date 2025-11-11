import { DomainValidationError } from '../errors';

export type PlayerParticipationProps = {
  id: string;
  date: Date;
  role: string;
  team: string;
  isWinner: boolean;
  performanceScore: number;
  gameStatus: string;
  winnerTeam: string | null;
};

export type PlayerProps = {
  id: string;
  name: string;
  totalGames: number;
  wins: number;
  losses: number;
  eloRating: number;
  region?: string | null;
  roleStats?: Record<string, unknown>;
  participations?: PlayerParticipationProps[];
};

export class Player {
  private readonly participations: PlayerParticipationProps[];

  constructor(private readonly props: PlayerProps) {
    this.validate();
    this.participations = [...(props.participations ?? [])]
      .map((participation) => ({
        ...participation,
        date: new Date(participation.date),
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get totalGames(): number {
    return this.props.totalGames;
  }

  get wins(): number {
    return this.props.wins;
  }

  get losses(): number {
    return this.props.losses;
  }

  get eloRating(): number {
    return this.props.eloRating;
  }

  get region(): string | null | undefined {
    return this.props.region;
  }

  get winRate(): number {
    if (this.totalGames === 0) {
      return 0;
    }

    return Math.round((this.wins / this.totalGames) * 10000) / 100;
  }

  get recentParticipations(): PlayerParticipationProps[] {
    return this.participations.slice(0, 10);
  }

  toPrimitives(): PlayerProps {
    return {
      ...this.props,
      participations: this.participations.map((participation) => ({
        ...participation,
        date: new Date(participation.date),
      })),
    };
  }

  private validate(): void {
    if (this.props.eloRating < 0) {
      throw new DomainValidationError('Elo rating cannot be negative.');
    }

    if (this.props.totalGames < 0) {
      throw new DomainValidationError('Total games cannot be negative.');
    }

    if (this.props.totalGames < this.props.wins + this.props.losses) {
      throw new DomainValidationError(
        'Total games cannot be less than wins plus losses.'
      );
    }

    if (
      this.props.participations?.some((p) => Number.isNaN(p.date.valueOf()))
    ) {
      throw new DomainValidationError('Participation dates must be valid.');
    }
  }
}
