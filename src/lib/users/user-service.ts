import { db } from '@/lib/db';
import type { UserRole } from '@/types/navigation';
import { randomBytes } from 'crypto';

/**
 * User creation input
 */
export interface CreateUserInput {
  email: string;
  name: string;
  role: UserRole;
  invitedBy: string;
}

/**
 * User invitation input
 */
export interface CreateInvitationInput {
  email: string;
  role: UserRole;
  invitedBy: string;
}

/**
 * User update input
 */
export interface UpdateUserInput {
  name?: string;
  role?: UserRole;
  avatar?: string;
}

/**
 * User search filters
 */
export interface UserFilters {
  search?: string;
  role?: UserRole;
  page?: number;
  limit?: number;
}

/**
 * User Service
 * Handles user management operations
 */
export class UserService {
  /**
   * Create a new user
   */
  async createUser(input: CreateUserInput) {
    // Validate email is not already taken
    const existingUser = await db.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Validate inviter has permission to create users
    const inviter = await db.user.findUnique({
      where: { id: input.invitedBy },
    });

    if (!inviter) {
      throw new Error('Inviter not found');
    }

    if (inviter.role !== 'ADMIN') {
      throw new Error('Only admins can create users');
    }

    // Create user
    const user = await db.user.create({
      data: {
        email: input.email,
        name: input.name,
        role: input.role,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return user;
  }

  /**
   * Create user invitation
   */
  async createInvitation(input: CreateInvitationInput) {
    // Validate email is not already in use
    const existingUser = await db.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Validate inviter
    const inviter = await db.user.findUnique({
      where: { id: input.invitedBy },
    });

    if (!inviter || inviter.role !== 'ADMIN') {
      throw new Error('Only admins can create invitations');
    }

    // Generate invitation token
    const token = this.generateInvitationToken();

    // Create invitation (7-day expiration)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = {
      email: input.email,
      role: input.role,
      token,
      expiresAt,
      invitedBy: input.invitedBy,
      createdAt: new Date(),
    };

    // TODO: Store invitation in database when UserInvitation model is available
    // For now, return the invitation data
    return invitation;
  }

  /**
   * Update user information
   */
  async updateUser(userId: string, input: UpdateUserInput) {
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        ...input,
        updatedAt: new Date(),
      },
    });

    return updatedUser;
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: string, newRole: UserRole, updatedBy: string) {
    // Validate updater has permission
    const updater = await db.user.findUnique({
      where: { id: updatedBy },
    });

    if (!updater || updater.role !== 'ADMIN') {
      throw new Error('Only admins can update user roles');
    }

    const user = await db.user.update({
      where: { id: userId },
      data: {
        role: newRole,
        updatedAt: new Date(),
      },
    });

    return user;
  }

  /**
   * Search and filter users
   */
  async searchUsers(filters: UserFilters = {}) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.role) {
      where.role = filters.role;
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string, deletedBy: string) {
    // Validate deleter has permission
    const deleter = await db.user.findUnique({
      where: { id: deletedBy },
    });

    if (!deleter || deleter.role !== 'ADMIN') {
      throw new Error('Only admins can delete users');
    }

    await db.user.delete({
      where: { id: userId },
    });
  }

  /**
   * Generate secure invitation token
   */
  private generateInvitationToken(): string {
    return randomBytes(32).toString('hex');
  }
}

export const userService = new UserService();
