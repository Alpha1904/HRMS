import { apiRequest, clearToken, setToken } from './api.js';

export async function login({ email, password }) {
  const res = await apiRequest('POST', '/auth/login', { email, password });
  const accessToken = res?.accessToken;
  if (!accessToken) {
    throw { message: 'Login succeeded but no accessToken returned' };
  }
  setToken(accessToken);
  localStorage.setItem('user', JSON.stringify(res?.user || null));
  return res;
}

export async function getMe() {
  return await apiRequest('GET', '/auth/me');
}

export function logout() {
  clearToken();
  localStorage.removeItem('user');
  window.location.replace('./login.html');
}
