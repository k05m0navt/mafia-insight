import { UserRole } from '@/types/navigation';

/**
 * User interface
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User creation input interface
 */
export interface CreateUserInput {
  email: string;
  name: string;
  role: UserRole;
  password?: string;
  avatar?: string;
}

/**
 * User update input interface
 */
export interface UpdateUserInput {
  name?: string;
  role?: UserRole;
  avatar?: string;
  isActive?: boolean;
}

/**
 * User invitation interface
 */
export interface UserInvitation {
  id: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  token: string;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
}

/**
 * User invitation creation input interface
 */
export interface CreateInvitationInput {
  email: string;
  role: UserRole;
}

/**
 * User list query parameters interface
 */
export interface UserListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  sortBy?: 'name' | 'email' | 'role' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * User list response interface
 */
export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * User role update input interface
 */
export interface UpdateUserRoleInput {
  userId: string;
  role: UserRole;
}

/**
 * User activation/deactivation input interface
 */
export interface UpdateUserStatusInput {
  userId: string;
  isActive: boolean;
}

/**
 * User statistics interface
 */
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByRole: Record<UserRole, number>;
}

/**
 * User search result interface
 */
export interface UserSearchResult {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
}

/**
 * User profile update input interface
 */
export interface UpdateProfileInput {
  name?: string;
  avatar?: string;
  themePreference?: string;
}

/**
 * User password change input interface
 */
export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

/**
 * User invitation acceptance input interface
 */
export interface AcceptInvitationInput {
  token: string;
  password: string;
  name: string;
}
