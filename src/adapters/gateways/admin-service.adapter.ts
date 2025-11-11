import {
  createAdmin,
  type CreateAdminData,
} from '@/services/auth/adminService';
import type {
  CreateAdminUserRequest,
  CreateAdminUserResponse,
} from '@/application/contracts';
import { AdminUserManagementPort } from '@/application/ports';

export class AdminServiceAdapter implements AdminUserManagementPort {
  async createAdminUser(
    request: CreateAdminUserRequest
  ): Promise<CreateAdminUserResponse> {
    const payload: CreateAdminData = {
      email: request.email,
      name: request.name,
      password: request.password,
    };

    const user = await createAdmin(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
      message: 'Admin user created successfully',
    };
  }
}
