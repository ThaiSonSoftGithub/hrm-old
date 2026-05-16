import { api } from '@/shared/api/httpClient';
import type { PagedResult } from '@/shared/api/types';
import type {
  CreateUserRequest, UpdateUserRequest, UserDto, UserListQuery,
} from './types';

export const userApi = {
  list: (q: UserListQuery) =>
    api<PagedResult<UserDto>>('/users', { query: { ...q } }),
  get: (id: string) => api<UserDto>(`/users/${id}`),
  create: (body: CreateUserRequest) =>
    api<{ id: string }>('/users', { method: 'POST', body }),
  update: (id: string, body: UpdateUserRequest) =>
    api<UserDto>(`/users/${id}`, { method: 'PUT', body }),
  remove: (id: string) =>
    api<void>(`/users/${id}`, { method: 'DELETE' }),
  resetPassword: (id: string, newPassword: string) =>
    api<{ message: string }>(`/users/${id}/reset-password`, { method: 'POST', body: { newPassword } }),
  lock: (id: string) => api<{ status: string }>(`/users/${id}/lock`, { method: 'POST' }),
  unlock: (id: string) => api<{ status: string }>(`/users/${id}/unlock`, { method: 'POST' }),
};
