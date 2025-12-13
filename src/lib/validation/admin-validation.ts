import { prisma } from '@/lib/db';
import { ValidationError } from '@/lib/errors';

/**
 * Validate that we're not removing the last admin
 * @param userId - The user ID whose role is being changed
 * @param newRole - The new role being assigned
 * @throws ValidationError if trying to change the last admin to non-admin
 */
export async function validateNotLastAdmin(
  userId: string,
  newRole: string
): Promise<void> {
  // Only check if changing to non-admin role
  if (newRole.toLowerCase() === 'admin') {
    return; // Allowing admin role assignment
  }

  // Check if user is currently an admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    throw new ValidationError('User not found');
  }

  // If user is not currently admin, no validation needed
  if (user.role !== 'admin') {
    return;
  }

  // Count total admin users
  const adminCount = await prisma.user.count({
    where: { role: 'admin' },
  });

  // If this is the last admin, prevent the change
  if (adminCount <= 1) {
    throw new ValidationError(
      'Cannot remove the last administrator. At least one admin must remain.',
      'role'
    );
  }
}
