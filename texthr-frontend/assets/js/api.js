export const API_BASE = localStorage.getItem('apiBase') || 'http://localhost:3000/api';

export function getToken() {
  return localStorage.getItem('token');
}

export function setToken(token) {
  if (token) localStorage.setItem('token', token);
}

export function clearToken() {
  localStorage.removeItem('token');
}

async function readError(res) {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await res.json();
    } catch {
      return { message: res.statusText };
    }
  }
  const text = await res.text().catch(() => '');
  return { message: text || res.statusText };
}

export async function apiRequest(method, path, body = null, options = {}) {
  const {
    isFormData = false,
    headers: extraHeaders = {},
    raw = false,
  } = options;

  const token = getToken();
  const headers = { ...extraHeaders };

  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const fetchOptions = {
    method,
    headers,
    credentials: 'include',
  };

  if (body !== null && body !== undefined) {
    fetchOptions.body = isFormData ? body : JSON.stringify(body);
  }

  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(url, fetchOptions);

  if (res.status === 401) {
    clearToken();
    if (!window.location.pathname.endsWith('/login.html')) {
      window.location.replace('./login.html');
    }
    throw { status: 401, message: 'Unauthorized' };
  }

  if (!res.ok) {
    const errBody = await readError(res);
    const msg = errBody?.message || errBody?.error || res.statusText;
    throw { status: res.status, ...errBody, message: msg };
  }

  if (raw) return res;
  if (res.status === 204) return null;

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return null;
  return await res.json();
}
