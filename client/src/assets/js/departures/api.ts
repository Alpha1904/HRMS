import { detectApiBase } from '../fetch.js';

const API_BASE_URL = detectApiBase();

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
}

export function clearAuthStorage(): void {
  try {
    sessionStorage.removeItem('accessToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUserRole');
    localStorage.removeItem('currentUserId');
  } catch {
    // ignore
  }
}

async function readError(res: Response): Promise<any> {
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    return await res.json().catch(() => ({}));
  }
  const t = await res.text().catch(() => '');
  return { message: t || res.statusText };
}

export async function apiRequest(
  method: string,
  path: string,
  body?: any,
  opts: { isFormData?: boolean; raw?: boolean } = {},
): Promise<any> {
  const token = getAccessToken();

  const headers: Record<string, string> = {};
  if (!opts.isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;

  const res = await fetch(url, {
    method,
    headers,
    credentials: 'include',
    body: body === undefined ? undefined : opts.isFormData ? body : JSON.stringify(body),
  });

  if (res.status === 401) {
    clearAuthStorage();
    window.location.href = 'login.html';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const errBody = await readError(res);
    throw new Error(errBody?.message || errBody?.error || res.statusText);
  }

  if (opts.raw) return res;

  if (res.status === 204) return null;
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return null;
  return await res.json();
}

export const endpoints = {
  me: '/auth/me',
  departures: '/departures',
};
