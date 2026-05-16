export interface UserRoleGroupRefDto {
  id: string;
  code: string;
  name: string;
}

export interface UserDto {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  status: 'Active' | 'Locked';
  roleGroups: UserRoleGroupRefDto[];
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  displayName: string;
  email: string | null;
  roleGroupIds: string[];
}

export interface UpdateUserRequest {
  displayName: string;
  email: string | null;
  roleGroupIds: string[];
}

export interface UserListQuery {
  keyword?: string;
  status?: 'Active' | 'Locked';
  page?: number;
  pageSize?: number;
}
