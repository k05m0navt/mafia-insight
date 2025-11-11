import type {
  CreateAdminUserRequest,
  CreateAdminUserResponse,
} from '../contracts';
import { ApplicationValidationError, ApplicationError } from '../errors';
import { AdminUserManagementPort } from '../ports';

const MIN_PASSWORD_LENGTH = 12;

export class CreateAdminUserUseCase {
  constructor(private readonly adminPort: AdminUserManagementPort) {}

  async execute(
    request: CreateAdminUserRequest
  ): Promise<CreateAdminUserResponse> {
    this.validate(request);

    const response = await this.adminPort.createAdminUser({
      email: request.email.trim(),
      name: request.name.trim(),
      password: request.password,
    });

    if (!response.user) {
      throw new ApplicationError('Admin user creation failed unexpectedly');
    }

    return response;
  }

  private validate(request: CreateAdminUserRequest): void {
    const email = request.email?.trim();
    const name = request.name?.trim();

    if (!email) {
      throw new ApplicationValidationError('email is required');
    }

    if (!email.includes('@')) {
      throw new ApplicationValidationError('email must be valid');
    }

    if (!name || name.length < 2) {
      throw new ApplicationValidationError(
        'name must be at least 2 characters'
      );
    }

    if (!request.password || request.password.length < MIN_PASSWORD_LENGTH) {
      throw new ApplicationValidationError(
        `password must be at least ${MIN_PASSWORD_LENGTH} characters`
      );
    }
  }
}
