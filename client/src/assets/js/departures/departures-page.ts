import { requireAuth, getMe, logout, type CurrentUser } from './auth.js';
import { toast } from './ui.js';
import { renderDeparturesPage } from './views/departures-view.js';

function ensureHash() {
  if (!window.location.hash) {
    window.location.hash = '#departures';
  }
}

async function init(): Promise<void> {
  requireAuth();

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  const back = document.getElementById('backDashboard') as HTMLAnchorElement | null;
  if (back) {
    const role = (localStorage.getItem('currentUserRole') || '').toUpperCase();
    if (role === 'EMPLOYEE') back.href = 'dashboard.employee.html';
    else if (role === 'MANAGER') back.href = 'dashboard.manager.html';
    else back.href = 'dashboard.admin.html';
  }

  let user: CurrentUser;
  try {
    user = await getMe();
  } catch (e: any) {
    toast(e?.message || 'Failed to load session', 'error');
    logout();
    return;
  }

  const emailEl = document.getElementById('currentUserEmail');
  const roleEl = document.getElementById('currentUserRole');
  if (emailEl) emailEl.textContent = user.email || 'Unknown user';
  if (roleEl) roleEl.textContent = user.role || '—';

  ensureHash();
  const root = document.getElementById('departuresApp');
  if (!root) {
    toast('Departures container not found', 'error');
    return;
  }

  const render = async () => {
    await renderDeparturesPage(root, user);
  };

  window.addEventListener('hashchange', render);
  await render();
}

document.addEventListener('DOMContentLoaded', () => {
  init().catch((e) => {
    toast(e?.message || 'Failed to initialize', 'error');
  });
});
