import type {
  GetPlayerProfileRequest,
  PlayerProfileResponse,
} from '../contracts';
import { ApplicationValidationError } from '../errors';
import { PlayerProfilePort } from '../ports';

const MIN_YEAR = 1900;
const MAX_YEAR = 3000;

export class GetPlayerProfileUseCase {
  constructor(private readonly playerProfilePort: PlayerProfilePort) {}

  async execute(
    request: GetPlayerProfileRequest
  ): Promise<PlayerProfileResponse> {
    const playerId = request.playerId?.trim();

    if (!playerId) {
      throw new ApplicationValidationError('playerId is required');
    }

    let year: number | undefined = request.year;

    if (typeof year === 'number') {
      if (
        Number.isNaN(year) ||
        !Number.isFinite(year) ||
        year < MIN_YEAR ||
        year > MAX_YEAR
      ) {
        throw new ApplicationValidationError(
          `year must be between ${MIN_YEAR} and ${MAX_YEAR}`
        );
      }
      year = Math.trunc(year);
    }

    return this.playerProfilePort.getPlayerProfile({
      playerId,
      year,
    });
  }
}
