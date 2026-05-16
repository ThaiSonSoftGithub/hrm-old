import { api } from '@/shared/api/httpClient';
import type { PagedResult } from '@/shared/api/types';
import type {
  AuthListQuery,
  AuthRefDto,
  FunctionGroupDto,
  PermissionDto,
  PermissionTreeNode,
  RoleGroupDto,
  RoleGroupUserDto,
  ScreenDto,
} from './types';

const BASE = '/authorization';

export const functionGroupApi = {
  list: (q: AuthListQuery) => api<PagedResult<FunctionGroupDto>>(`${BASE}/function-groups`, { query: { ...q } }),
  options: () => api<AuthRefDto[]>(`${BASE}/function-groups/options`),
  create: (body: { code: string; name: string; note: string | null; isActive: boolean }) =>
    api<FunctionGroupDto>(`${BASE}/function-groups`, { method: 'POST', body }),
  update: (id: string, body: { name: string; note: string | null; isActive: boolean }) =>
    api<FunctionGroupDto>(`${BASE}/function-groups/${id}`, { method: 'PUT', body }),
  remove: (id: string) => api<void>(`${BASE}/function-groups/${id}`, { method: 'DELETE' }),
  membershipScreens: (id: string) => api<ScreenDto[]>(`${BASE}/function-groups/${id}/screens`),
  addScreens: (id: string, screenIds: string[]) =>
    api<void>(`${BASE}/function-groups/${id}/screens`, { method: 'POST', body: { screenIds } }),
  removeScreens: (id: string, screenIds: string[]) =>
    api<void>(`${BASE}/function-groups/${id}/screens`, { method: 'DELETE', body: { screenIds } }),
};

export const screenApi = {
  list: (q: AuthListQuery & { functionGroupId?: string }) =>
    api<PagedResult<ScreenDto>>(`${BASE}/screens`, { query: { ...q } }),
  options: (functionGroupId?: string) =>
    api<AuthRefDto[]>(`${BASE}/screens/options`, { query: { functionGroupId } }),
  create: (body: { code: string; name: string; note: string | null; functionGroupId: string; isActive: boolean }) =>
    api<ScreenDto>(`${BASE}/screens`, { method: 'POST', body }),
  update: (id: string, body: { name: string; note: string | null; functionGroupId: string; isActive: boolean }) =>
    api<ScreenDto>(`${BASE}/screens/${id}`, { method: 'PUT', body }),
  remove: (id: string) => api<void>(`${BASE}/screens/${id}`, { method: 'DELETE' }),
};

export const permissionApi = {
  list: (q: AuthListQuery & { functionGroupId?: string; screenId?: string }) =>
    api<PagedResult<PermissionDto>>(`${BASE}/permissions`, { query: { ...q } }),
  create: (body: { code: string; note: string | null; functionGroupId: string; screenId: string }) =>
    api<PermissionDto>(`${BASE}/permissions`, { method: 'POST', body }),
  update: (id: string, body: { code: string; note: string | null; functionGroupId: string; screenId: string }) =>
    api<PermissionDto>(`${BASE}/permissions/${id}`, { method: 'PUT', body }),
  remove: (id: string) => api<void>(`${BASE}/permissions/${id}`, { method: 'DELETE' }),
};

export const roleGroupApi = {
  list: (q: AuthListQuery) => api<PagedResult<RoleGroupDto>>(`${BASE}/role-groups`, { query: { ...q } }),
  create: (body: { code: string; name: string; note: string | null; isActive: boolean }) =>
    api<RoleGroupDto>(`${BASE}/role-groups`, { method: 'POST', body }),
  update: (id: string, body: { name: string; note: string | null; isActive: boolean }) =>
    api<RoleGroupDto>(`${BASE}/role-groups/${id}`, { method: 'PUT', body }),
  remove: (id: string) => api<void>(`${BASE}/role-groups/${id}`, { method: 'DELETE' }),
  permissionTree: (id: string) => api<PermissionTreeNode[]>(`${BASE}/role-groups/${id}/permissions/tree`),
  savePermissions: (id: string, permissionIds: string[]) =>
    api<void>(`${BASE}/role-groups/${id}/permissions`, { method: 'PUT', body: { permissionIds } }),
  users: (id: string) => api<RoleGroupUserDto[]>(`${BASE}/role-groups/${id}/users`),
  addUsers: (id: string, userIds: string[]) =>
    api<void>(`${BASE}/role-groups/${id}/users`, { method: 'POST', body: { userIds } }),
  removeUsers: (id: string, userIds: string[]) =>
    api<void>(`${BASE}/role-groups/${id}/users`, { method: 'DELETE', body: { userIds } }),
};

export const userDirectoryApi = {
  list: (q: AuthListQuery) =>
    api<PagedResult<RoleGroupUserDto>>(`${BASE}/users`, { query: { ...q } }),
};
