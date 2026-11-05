import { apiRequest, clearAuthStorage, endpoints } from './api.js';

export type CurrentUser = {
  id: number;
  role: string;
  email: string;
};

export function requireAuth(): void {
  const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
  if (!token) {
    window.location.href = 'login.html';
  }
}

export async function getMe(): Promise<CurrentUser> {
  const me = await apiRequest('GET', endpoints.me);
  return {
    id: Number(me?.id ?? me?.user?.id),
    role: String(me?.role ?? me?.user?.role ?? 'EMPLOYEE').toUpperCase(),
    email: String(me?.email ?? me?.user?.email ?? ''),
  };
}

export function logout(): void {
  clearAuthStorage();
  window.location.href = 'login.html';
}
