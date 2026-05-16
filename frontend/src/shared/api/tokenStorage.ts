const ACCESS_KEY = 'hrm.accessToken';
const REFRESH_KEY = 'hrm.refreshToken';

let accessTokenInMemory: string | null = sessionStorage.getItem(ACCESS_KEY);

export const tokenStorage = {
  getAccess(): string | null {
    return accessTokenInMemory;
  },
  setAccess(token: string | null) {
    accessTokenInMemory = token;
    if (token) sessionStorage.setItem(ACCESS_KEY, token);
    else sessionStorage.removeItem(ACCESS_KEY);
  },
  getRefresh(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  },
  setRefresh(token: string | null) {
    if (token) localStorage.setItem(REFRESH_KEY, token);
    else localStorage.removeItem(REFRESH_KEY);
  },
  clear() {
    this.setAccess(null);
    this.setRefresh(null);
  },
};
