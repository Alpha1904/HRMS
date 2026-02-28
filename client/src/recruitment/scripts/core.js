(function () {
  const NS = (window.HRMSRecruitment = window.HRMSRecruitment || {});

  function normalizeBase(b) {
    return String(b || '').replace(/\/$/, '');
  }

  function detectApiBase() {
    if (window.__API_BASE__) return normalizeBase(window.__API_BASE__);

    const loc = window.location;
    if (loc && loc.protocol === 'file:') {
      return 'http://localhost:3000/api';
    }
    if (loc && (loc.hostname === '127.0.0.1' || loc.hostname === 'localhost')) {
      // Common static dev servers use 5500/5501.
      
        return 'http://localhost:3000/api';
      
    }

    return 'https://hrms-n8o4.onrender.com/api/';
  }

  const API_BASE = detectApiBase();
  const API_ORIGIN = (() => {
    try {
      return new URL(API_BASE).origin;
    } catch {
      return window.location.origin;
    }
  })();

  const TOKEN_STORAGE_KEY = 'accessToken';

  function getToken() {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY) || '';
  }

  function setToken(token) {
    const t = String(token || '').trim();
    if (!t) {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(TOKEN_STORAGE_KEY, t);
  }

  function buildQuery(query) {
    if (!query) return '';
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return;
      params.append(k, String(v));
    });
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }

  function redirectToLogin() {
    try {
      const u = new URL(window.location.href);
      const next = encodeURIComponent(u.pathname + u.search + u.hash);
      window.location.href = `/client/src/login.html?next=${next}`;
    } catch {
      window.location.href = '/client/src/login.html';
    }
  }

  async function request(method, path, options) {
    const opts = options || {};
    const auth = opts.auth !== false;

    const url = `${API_BASE}${path}${buildQuery(opts.query)}`;

    const headers = new Headers();
    if (auth) {
      const token = getToken();
      if (token) headers.set('Authorization', `Bearer ${token}`);
    }

    let body;
    if (opts.formData) {
      body = opts.formData;
    } else if (opts.body !== undefined) {
      headers.set('Content-Type', 'application/json');
      body = JSON.stringify(opts.body);
    }

    const resp = await fetch(url, {
      method,
      headers,
      body,
      credentials: 'include',
    });

    if (!resp.ok) {
      let msg = `HTTP ${resp.status}`;
      try {
        const data = await resp.json();
        msg = data.message || msg;
      } catch {
        try {
          const t = await resp.text();
          if (t) msg = t;
        } catch {
          // ignore
        }
      }

      if (resp.status === 401) {
        setToken('');
        redirectToLogin();
      }
      const err = new Error(msg);
      err.status = resp.status;
      throw err;
    }

    // Some endpoints may return empty body.
    const text = await resp.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  function resolveUploadUrl(uploadUrl) {
    if (!uploadUrl) return '';
    const u = String(uploadUrl);
    if (u.startsWith('http://') || u.startsWith('https://')) return u;

    // Backend serves static files under /public. The DB sometimes stores /uploads/... (legacy).
    if (u.startsWith('/public/')) return `${API_ORIGIN}${u}`;
    if (u.startsWith('/uploads/docs/')) return `${API_ORIGIN}/public${u}`;
    if (u.startsWith('/uploads/')) {
      // Documents module stores files under /public/uploads/docs but saves uploadUrl as /uploads/<file>.
      const rest = u.slice('/uploads/'.length);
      return `${API_ORIGIN}/public/uploads/docs/${rest}`;
    }
    if (u.startsWith('/')) return `${API_ORIGIN}${u}`;

    return `${API_ORIGIN}/${u}`;
  }

  NS.core = {
    API_BASE,
    API_ORIGIN,
    getToken,
    setToken,
    request,
    resolveUploadUrl,
  };
})();
