export interface TestUser {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'user' | 'guest';
  permissions: string[];
}

export const testUsers: Record<string, TestUser> = {
  admin: {
    id: 'admin_123',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    permissions: [
      'read:players',
      'write:players',
      'admin:players',
      'read:analytics',
      'write:analytics',
      'admin:analytics',
      'admin:permissions',
      'admin:users',
    ],
  },
  user: {
    id: 'user_123',
    email: 'user@example.com',
    password: 'user123',
    role: 'user',
    permissions: ['read:players', 'read:analytics'],
  },
  guest: {
    id: 'guest_123',
    email: '',
    password: '',
    role: 'guest',
    permissions: [],
  },
};

export const getUserByRole = (role: 'admin' | 'user' | 'guest'): TestUser => {
  return testUsers[role];
};

export const getUsersWithPermission = (permission: string): TestUser[] => {
  return Object.values(testUsers).filter((user) =>
    user.permissions.includes(permission)
  );
};

export const getUsersWithoutPermission = (permission: string): TestUser[] => {
  return Object.values(testUsers).filter(
    (user) => !user.permissions.includes(permission)
  );
};
