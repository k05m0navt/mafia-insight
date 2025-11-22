import type {
  CreateAdminUserRequest,
  CreateAdminUserResponse,
} from '@/application/contracts';
import { CreateAdminUserUseCase } from '@/application/use-cases';
import { AdminServiceAdapter } from '../gateways/admin-service.adapter';

export class AdminController {
  private readonly createAdminUseCase: CreateAdminUserUseCase;

  constructor(private readonly adapter = new AdminServiceAdapter()) {
    this.createAdminUseCase = new CreateAdminUserUseCase(this.adapter);
  }

  createAdminUser(
    request: CreateAdminUserRequest
  ): Promise<CreateAdminUserResponse> {
    return this.createAdminUseCase.execute(request);
  }
}
