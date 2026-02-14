import { detectApiBase } from '../fetch.js';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

type ApiFetchOptions = {
  method?: HttpMethod;
  query?: Record<string, any>;
  body?: any;
  raw?: boolean;
};

export type CurrentUser = {
  id?: number;
  role?: string;
  email?: string;
};

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return (
    sessionStorage.getItem('accessToken') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('hrms.jwt') ||
    ''
  );
}

function buildQuery(query?: Record<string, any>) {
  if (!query) return '';
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    if (Array.isArray(v)) {
      v.forEach((x) => params.append(k, String(x)));
      return;
    }
    params.append(k, String(v));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function showToast(message: string, variant: 'success' | 'error' | 'info' = 'info') {
  const hostId = 'payment-toast-host';
  let host = document.getElementById(hostId);
  if (!host) {
    host = document.createElement('div');
    host.id = hostId;
    host.className = 'fixed top-3 right-3 z-[9999] space-y-2';
    document.body.appendChild(host);
  }

  const el = document.createElement('div');
  const base = 'px-4 py-3 rounded shadow text-sm border flex items-start gap-2 max-w-[420px]';
  const styles =
    variant === 'success'
      ? 'bg-green-50 border-green-200 text-green-800'
      : variant === 'error'
        ? 'bg-red-50 border-red-200 text-red-800'
        : 'bg-blue-50 border-blue-200 text-blue-800';

  el.className = `${base} ${styles}`;
  el.setAttribute('role', 'status');
  el.textContent = message;

  host.appendChild(el);

  const t = window.setTimeout(() => {
    el.remove();
    if (host && host.childElementCount === 0) host.remove();
  }, 3500);

  el.addEventListener('click', () => {
    window.clearTimeout(t);
    el.remove();
    if (host && host.childElementCount === 0) host.remove();
  });
}

export async function apiFetch(path: string, options: ApiFetchOptions = {}) {
  const API_BASE = detectApiBase();
  const method = options.method ?? 'GET';
  const url = `${API_BASE}${path}${buildQuery(options.query)}`;

  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let body: any = undefined;
  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  } else if (options.body instanceof FormData) {
    body = options.body;
  }

  const resp = await fetch(url, {
    method,
    headers,
    body,
    credentials: 'include',
  });

  if (resp.status === 401) {
    sessionStorage.removeItem('accessToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('currentUserRole');
    window.location.href = 'login.html';
    return;
  }

  if (options.raw) return resp;

  const text = await resp.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!resp.ok) {
    const msg = data && typeof data === 'object' && (data as any).message ? String((data as any).message) : `HTTP ${resp.status}`;
    const err: any = new Error(msg);
    err.status = resp.status;
    err.data = data;
    throw err;
  }

  return data;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const cachedRole = localStorage.getItem('currentUserRole');
  const cachedId = localStorage.getItem('currentUserId');
  if (cachedRole || cachedId) {
    return {
      id: cachedId ? Number(cachedId) : undefined,
      role: cachedRole ? String(cachedRole) : undefined,
    };
  }

  const me = await apiFetch('/auth/me');
  const id = (me as any)?.id ?? (me as any)?.user?.id;
  const role = String((me as any)?.role ?? (me as any)?.user?.role ?? '').toUpperCase();
  if (id) localStorage.setItem('currentUserId', String(id));
  if (role) localStorage.setItem('currentUserRole', role);
  return { id, role };
}

export function hasAnyRole(userRole: string | undefined, allowed: string[]) {
  const r = String(userRole ?? '').toUpperCase();
  return allowed.map((x) => x.toUpperCase()).includes(r);
}

export function monthInputValueToIsoDate(monthValue: string): string {
  const [y, m] = String(monthValue || '').split('-');
  if (!y || !m) return '';
  return `${y}-${m}-01`;
}

export function fmtMoney(value: any): string {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return String(value ?? '');
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(num);
}

export function fmtMonthLabel(value: any): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    if (typeof value === 'string' && value.length >= 7) return value.slice(0, 7);
    return String(value);
  }
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export async function getProfileIdForCurrentUser(userId: number): Promise<number> {
  const profile = await apiFetch(`/profiles/user/${userId}`);
  const pid = Number((profile as any)?.id);
  if (!pid) throw new Error('Profile not found for current user');
  return pid;
}

export async function searchProfiles(term: string): Promise<any[]> {
  const res = await apiFetch('/profiles', {
    query: {
      search: term,
      page: 1,
      limit: 10,
      sortBy: 'fullName',
      sortOrder: 'asc',
    },
  });
  return Array.isArray((res as any)?.data) ? (res as any).data : [];
}

export async function renderPaymentNav(containerId: string) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const me = await getCurrentUser();
  const role = String(me.role ?? '').toUpperCase();
  const isAdmin = hasAnyRole(role, ['HR_ADMIN', 'SYSTEM_ADMIN']);

  const links: Array<{ href: string; label: string; show: boolean }> = [
    { href: 'payslip.html', label: 'Payslips', show: true },
    { href: 'payment-compensation.html', label: 'Compensation', show: isAdmin },
    { href: 'payment-adjustments.html', label: 'Adjustments', show: isAdmin },
  ];

  const active = window.location.pathname.split('/').pop() || '';
  const back = role === 'EMPLOYEE' ? 'dashboard.employee.html' : role === 'MANAGER' ? 'dashboard.manager.html' : 'dashboard.admin.html';

  el.innerHTML = `
    <div class="w-full bg-white border border-borderColor rounded p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-wrap gap-2">
        ${links
          .filter((l) => l.show)
          .map((l) => {
            const isActiveLink = l.href === active;
            const base = 'px-3 py-2 rounded text-sm font-medium border';
            const style = isActiveLink
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-gray-700 border-borderColor hover:bg-dark-transparent';
            return `<a class="${base} ${style}" href="${l.href}">${l.label}</a>`;
          })
          .join('')}
      </div>
      <div class="flex items-center gap-2">
        <a href="${back}" class="px-3 py-2 rounded text-sm font-medium border border-borderColor bg-white hover:bg-dark-transparent">Back</a>
        <button id="payment-logout" type="button" class="px-3 py-2 rounded text-sm font-medium border border-borderColor bg-white hover:bg-dark-transparent">Logout</button>
      </div>
    </div>
  `;

  const btn = document.getElementById('payment-logout');
  btn?.addEventListener('click', () => {
    sessionStorage.removeItem('accessToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('currentUserRole');
    window.location.href = 'login.html';
  });
}
