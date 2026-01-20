import { apiFetch, getCurrentUser, hasAnyRole, renderPerformanceNav, setUrlParam, getUrlParam, showToast } from './core.js';

type RankingRow = any;

function getEl<T extends HTMLElement>(id: string) {
  return document.getElementById(id) as T | null;
}

async function loadRankings() {
  const tbody = getEl<HTMLTableSectionElement>('rankings-tbody');
  const empty = getEl<HTMLDivElement>('rankings-empty');
  if (!tbody || !empty) return;

  tbody.innerHTML = '';
  empty.classList.add('hidden');

  const cycleId = Number(getUrlParam('cycleId') || '');
  if (!cycleId || Number.isNaN(cycleId)) {
    empty.classList.remove('hidden');
    return;
  }

  const page = Number(getUrlParam('page') || '1');
  const limit = Number(getUrlParam('limit') || '20');
  const department = (getUrlParam('department') || '').trim();

  const res = await apiFetch(`/performance/cycles/${cycleId}/rankings`, {
    query: { page, limit, department: department || undefined },
  });

  const rows: RankingRow[] = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
  if (!rows.length) {
    empty.classList.remove('hidden');
    return;
  }

  rows.forEach((r) => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-borderColor';

    const scoreText = r.finalScore === null || r.finalScore === undefined ? '-' : Number(r.finalScore).toFixed(2);
    const rankText = r.rank === null || r.rank === undefined ? '-' : String(r.rank);

    tr.innerHTML = `
      <td class="py-2 px-4 text-sm">${rankText}</td>
      <td class="py-2 px-4 text-sm">${r.employee?.fullName ?? ''}</td>
      <td class="py-2 px-4 text-sm">${r.employee?.department ?? ''}</td>
      <td class="py-2 px-4 text-sm">${scoreText}</td>
    `;

    tbody.appendChild(tr);
  });
}

function wireFilters() {
  const apply = getEl<HTMLButtonElement>('rankings-apply');
  apply?.addEventListener('click', async () => {
    const cycleId = (getEl<HTMLInputElement>('rankings-cycleId')?.value || '').trim();
    const department = (getEl<HTMLInputElement>('rankings-dept')?.value || '').trim();
    setUrlParam('cycleId', cycleId);
    setUrlParam('department', department);
    setUrlParam('page', '1');
    await loadRankings();
  });

  const calc = getEl<HTMLButtonElement>('rankings-calc');
  calc?.addEventListener('click', async () => {
    const cycleId = Number(getUrlParam('cycleId') || (getEl<HTMLInputElement>('rankings-cycleId')?.value || '').trim());
    if (!cycleId || Number.isNaN(cycleId)) {
      showToast('Enter a cycleId', 'error');
      return;
    }
    try {
      await apiFetch(`/performance/cycles/${cycleId}/calculate-rankings`, { method: 'POST' });
      showToast('Rankings calculated', 'success');
      await loadRankings();
    } catch (err: any) {
      showToast(err?.message || 'Failed to calculate rankings', 'error');
    }
  });
}

async function wireAdminVisibility() {
  const me = await getCurrentUser();
  const isAdmin = hasAnyRole(me.role, ['HR_ADMIN', 'SYSTEM_ADMIN']);
  getEl<HTMLButtonElement>('rankings-calc')?.classList.toggle('hidden', !isAdmin);
}

function syncFromUrl() {
  const cycleId = getUrlParam('cycleId');
  const department = getUrlParam('department');
  if (cycleId) {
    const el = getEl<HTMLInputElement>('rankings-cycleId');
    if (el) el.value = cycleId;
  }
  if (department) {
    const el = getEl<HTMLInputElement>('rankings-dept');
    if (el) el.value = department;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await renderPerformanceNav('perf-nav');
  syncFromUrl();
  await wireAdminVisibility();
  wireFilters();
  await loadRankings();
});
