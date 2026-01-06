(function () {
  const NS = (window.HRMSRecruitment = window.HRMSRecruitment || {});
  const { getToken, setToken } = NS.core;
  const { toast, setLoading, qs, wireModalClose } = NS.ui;
  const { authMe } = NS.api;

  async function checkAuth() {
    const token = getToken();
    const tokenInput = document.getElementById('token-input');
    if (tokenInput) tokenInput.value = token;

    if (!token) {
      toast('Paste a JWT token to continue.', 'warn', 5000);
      return null;
    }

    try {
      setLoading(true, 'Checking authentication…');
      const me = await authMe();
      if (me && me.role && me.role !== 'RECRUITER' && me.role !== 'HR_ADMIN') {
        toast('Your account is authenticated but does not have recruiter access.', 'error', 6000);
      }
      return me;
    } catch (e) {
      toast(e.message || 'Auth check failed. Please verify your token.', 'error', 6000);
      return null;
    } finally {
      setLoading(false);
    }
  }

  function wireTokenUi() {
    const saveBtn = document.getElementById('token-save-btn');
    const clearBtn = document.getElementById('token-clear-btn');
    const checkBtn = document.getElementById('token-check-btn');
    const tokenInput = document.getElementById('token-input');

    if (saveBtn && tokenInput) {
      saveBtn.addEventListener('click', () => {
        setToken(tokenInput.value);
        toast('Token saved.', 'success');
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        setToken('');
        if (tokenInput) tokenInput.value = '';
        toast('Token cleared.', 'success');
      });
    }

    if (checkBtn) {
      checkBtn.addEventListener('click', async () => {
        await checkAuth();
      });
    }
  }

  function wireLogout() {
    const btn = document.getElementById('logout-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      setToken('');
      toast('Logged out (token cleared).', 'success');
      setTimeout(() => window.location.reload(), 300);
    });
  }

  function setActiveNav() {
    const current = (document.body.getAttribute('data-page') || '').trim();
    if (!current) return;
    document.querySelectorAll('[data-nav]').forEach((a) => {
      const key = a.getAttribute('data-nav');
      const active = key === current;
      a.classList.toggle('bg-slate-100', active);
      a.classList.toggle('dark:bg-slate-800', active);
      a.classList.toggle('text-slate-900', active);
      a.classList.toggle('dark:text-slate-100', active);
    });
  }

  function init() {
    wireModalClose();
    wireTokenUi();
    wireLogout();
    setActiveNav();

    // Allow deep-linking a token for quick testing.
    const tokenFromUrl = new URLSearchParams(window.location.search).get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      const tokenInput = document.getElementById('token-input');
      if (tokenInput) tokenInput.value = tokenFromUrl;
    }

    // Attempt auth check on load.
    checkAuth().then((me) => {
      const el = qs('#me-badge');
      if (!el) return;
      if (!me) {
        el.textContent = 'Not authenticated';
        el.className = 'text-xs px-2 py-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200';
        return;
      }
      el.textContent = `${me.email || 'User'} • ${me.role || ''}`;
      el.className = 'text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200';
    });
  }

  NS.app = {
    init,
    checkAuth,
  };

  document.addEventListener('DOMContentLoaded', init);
})();
