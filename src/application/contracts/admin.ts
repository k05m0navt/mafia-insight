export type CreateAdminUserRequest = {
  email: string;
  name: string;
  password: string;
};

export type AdminUserSummary = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
};

export type CreateAdminUserResponse = {
  user: AdminUserSummary;
  message: string;
};
