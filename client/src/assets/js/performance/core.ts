import { detectApiBase } from '../fetch.js';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

type ApiFetchOptions = {
  method?: HttpMethod;
  query?: Record<string, any>;
  body?: any;
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
  const hostId = 'perf-toast-host';
  let host = document.getElementById(hostId);
  if (!host) {
    host = document.createElement('div');
    host.id = hostId;
    host.className = 'fixed top-3 right-3 z-[9999] space-y-2';
    // Ensure it is always visible even if Tailwind classes are missing at runtime.
    (host.style as any).position = 'fixed';
    (host.style as any).top = '12px';
    (host.style as any).right = '12px';
    (host.style as any).zIndex = '9999';
    (host.style as any).display = 'flex';
    (host.style as any).flexDirection = 'column';
    (host.style as any).gap = '8px';
    // Force append to body immediately.
    if (document.body && host) {
  document.body.appendChild(host);
} else {
  // If body is not yet available, wait for it.
  const ensure = () => {
    if (document.body && host) {
      document.body.appendChild(host);
    } else {
      setTimeout(ensure, 10);
    }
  };
  ensure();
}
  }

  // Ensure host is non-null before using it below
  if (!host) return;

  const el = document.createElement('div');
  const base = 'px-4 py-3 rounded shadow text-sm border flex items-start gap-2 max-w-[360px]';
  const styles =
    variant === 'success'
      ? 'bg-green-50 border-green-200 text-green-800'
      : variant === 'error'
        ? 'bg-red-50 border-red-200 text-red-800'
        : 'bg-blue-50 border-blue-200 text-blue-800';

  el.className = `${base} ${styles}`;
  el.setAttribute('role', 'status');
  el.textContent = message;

  // Fallback visibility styles.
  (el.style as any).borderRadius = '8px';
  (el.style as any).boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
  (el.style as any).padding = '12px 14px';

  host.appendChild(el);

  // Always log as a fallback for debugging when toasts are not visible.
  const prefix = variant === 'error' ? '[perf:error]' : variant === 'success' ? '[perf:success]' : '[perf:info]';
  console.log(prefix, message);

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

// Helper: create a visible test button for debugging toast host
export function createToastTestButton() {
  const btn = document.createElement('button');
  btn.textContent = 'Test Toast';
  btn.style.position = 'fixed';
  btn.style.bottom = '12px';
  btn.style.right = '12px';
  btn.style.zIndex = '9999';
  btn.style.padding = '8px 12px';
  btn.style.borderRadius = '6px';
  btn.style.border = '1px solid #ccc';
  btn.style.background = '#fff';
  btn.style.cursor = 'pointer';
  btn.addEventListener('click', () => {
    showToast('Test toast from button', 'success');
  });
  if (document.body) document.body.appendChild(btn);
  else document.addEventListener('DOMContentLoaded', () => document.body.appendChild(btn), { once: true });
}

export async function apiFetch(path: string, options: ApiFetchOptions = {}) {
  const API_BASE = detectApiBase();
  const method = options.method ?? 'GET';
  const url = `${API_BASE}${path}${buildQuery(options.query)}`;

  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let body: any = undefined;
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
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
    window.location.href = 'login.html';
    return;
  }

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

export async function getCurrentUser() {
  const cachedRole = localStorage.getItem('currentUserRole');
  const cachedId = localStorage.getItem('currentUserId');
  if (cachedRole || cachedId) {
    return { id: cachedId ? Number(cachedId) : undefined, role: cachedRole ? String(cachedRole) : undefined };
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

export function getUrlParam(name: string) {
  return new URLSearchParams(window.location.search).get(name);
}

export function setUrlParam(name: string, value: string) {
  const url = new URL(window.location.href);
  if (!value) url.searchParams.delete(name);
  else url.searchParams.set(name, value);
  window.history.replaceState({}, '', url.toString());
}

export async function renderPerformanceNav(containerId: string) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const me = await getCurrentUser();
  const role = String(me.role ?? '').toUpperCase();

  const isAdmin = hasAnyRole(role, ['HR_ADMIN', 'SYSTEM_ADMIN']);

  const links: Array<{ href: string; label: string; show: boolean }> = [
    { href: 'performance-evaluations.html', label: 'Evaluations', show: true },
    { href: 'performance-rankings.html', label: 'Rankings', show: true },
    { href: 'performance-cycles.html', label: 'Cycles', show: isAdmin || role === 'MANAGER' },
    { href: 'performance-criteria.html', label: 'Criteria', show: isAdmin },
  ];

  const active = window.location.pathname.split('/').pop() || '';

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
        <span class="text-xs text-gray-500">Role: ${role || 'UNKNOWN'}</span>
        <button class="rounded text-sm font-medium border border-borderColor bg-white hover:bg-dark-transparent" id="backToDashboard">
									<a href="javascript:void(0)" class="active subdrop relative flex item-center w-full p-2 text-sm leading-normal font-medium text-gray-900 group hover:bg-dark-transparent transition-all duration-500 ease-in-out rounded-[5px]">
										<i class="ti ti-smart-home text-gray-500 group-hover:text-gray-900 group-active:text-gray-900"></i>
										<span class="ms-2"> Dashboard</span>
									</a>
				</button>
      </div>
    </div>
  `;
  const backToDashboard = document.getElementById('backToDashboard');
  if (backToDashboard) {
    const link = backToDashboard.querySelector('a');
    if (link) {
      link.addEventListener('click', (e) => {
        e.preventDefault();

        const roleFromStorage = () => {
          const direct =
            sessionStorage.getItem('currentUserRole') ||
            localStorage.getItem('currentUserRole') ||
            sessionStorage.getItem('role') ||
            localStorage.getItem('role');
          if (direct) return direct;

          const userStr = sessionStorage.getItem('user') || localStorage.getItem('user');
          if (userStr) {
            try {
              const u: any = JSON.parse(userStr);
              return u?.role || u?.user?.role;
            } catch (_) {
              return null;
            }
          }
          return null;
        };

        const role = String(roleFromStorage() || '').toUpperCase();
        let dest = 'dashboard.employee.html';
        switch (role) {
          case 'MANAGER':
            dest = 'dashboard.manager.html';
            break;
          case 'HR_ADMIN':
          case 'SYSTEM_ADMIN':
          case 'ADMIN':
          case 'RECRUITER':
            dest = 'dashboard.admin.html';
            break;
          case 'EMPLOYEE':
          default:
            dest = 'dashboard.employee.html';
            break;
        }

        window.location.href = dest;
      });
    }
  }
  const btn = document.getElementById('perf-logout');
  btn?.addEventListener('click', () => {
    sessionStorage.removeItem('accessToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('currentUserRole');
    window.location.href = 'login.html';
  });
}
