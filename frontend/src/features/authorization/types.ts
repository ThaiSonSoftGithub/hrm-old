export interface AuthRefDto {
  id: string;
  code: string;
  name: string;
}

export interface FunctionGroupDto {
  id: string;
  code: string;
  name: string;
  note: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface ScreenDto {
  id: string;
  code: string;
  name: string;
  note: string | null;
  functionGroupId: string;
  functionGroup: AuthRefDto | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface PermissionDto {
  id: string;
  code: string;
  note: string | null;
  functionGroupId: string;
  functionGroup: AuthRefDto | null;
  screenId: string;
  screen: AuthRefDto | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface RoleGroupDto {
  id: string;
  code: string;
  name: string;
  note: string | null;
  isActive: boolean;
  userCount: number;
  permissionCount: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface RoleGroupUserDto {
  userId: string;
  username: string;
  displayName: string;
  email: string | null;
  status: string;
}

export interface PermissionTreeLeaf {
  permissionId: string;
  code: string;
  note: string | null;
  selected: boolean;
}

export interface PermissionTreeScreen {
  screenId: string;
  screenCode: string;
  screenName: string;
  permissions: PermissionTreeLeaf[];
}

export interface PermissionTreeNode {
  functionGroupId: string;
  functionGroupCode: string;
  functionGroupName: string;
  screens: PermissionTreeScreen[];
}

export interface AuthListQuery {
  keyword?: string;
  isActive?: boolean;
  page: number;
  pageSize: number;
}
