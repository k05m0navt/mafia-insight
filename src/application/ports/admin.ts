import type {
  CreateAdminUserRequest,
  CreateAdminUserResponse,
} from '../contracts';

export interface AdminUserManagementPort {
  createAdminUser(
    request: CreateAdminUserRequest
  ): Promise<CreateAdminUserResponse>;
}
