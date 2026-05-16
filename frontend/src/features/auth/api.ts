import { api } from '@/shared/api/httpClient';

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export const authApi = {
  login: (username: string, password: string) =>
    api<LoginResponse>('/auth/login', { method: 'POST', body: { username, password }, skipAuth: true }),
  refresh: (refreshToken: string) =>
    api<LoginResponse>('/auth/refresh', { method: 'POST', body: { refreshToken }, skipAuth: true }),
  logout: (refreshToken: string) =>
    api<void>('/auth/logout', { method: 'POST', body: { refreshToken } }),
  me: () => api<AuthUser>('/auth/me'),
};
