import { apiFetch, getCurrentUser, hasAnyRole, renderPerformanceNav, setUrlParam, getUrlParam, showToast } from './core.js';

type EvalRow = {
  id: number;
  status: string;
  finalScore?: number | null;
  rank?: number | null;
  employee?: { id: number; fullName: string; department?: string | null };
  cycle?: { id: number; name: string; period: string };
};

type CycleRow = {
  id: number;
  name: string;
  period: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

function getEl<T extends HTMLElement>(id: string) {
  return document.getElementById(id) as T | null;
}

function badgeStatus(s: string) {
  const v = String(s || '').toUpperCase();
  const base = 'inline-flex items-center text-[10px] font-medium px-2 py-1 rounded border';
  if (v === 'COMPLETED') return `<span class="${base} bg-green-100 text-green-800 border-green-200">COMPLETED</span>`;
  if (v === 'IN_PROGRESS') return `<span class="${base} bg-blue-100 text-blue-800 border-blue-200">IN_PROGRESS</span>`;
  return `<span class="${base} bg-gray-100 text-gray-700 border-gray-200">${v || 'UNKNOWN'}</span>`;
}

function fmtDate(d: string) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString();
}

function cycleLabel(c: CycleRow) {
  const range = c.startDate && c.endDate ? ` (${fmtDate(c.startDate)} - ${fmtDate(c.endDate)})` : '';
  const active = c.isActive ? ' [Active]' : '';
  return `${c.name}${range}${active}`;
}

async function loadCyclesIntoFilter() {
  const sel = getEl<HTMLSelectElement>('filter-cycleId');
  if (!sel) return;

  // Preserve current selection from URL or current select value.
  const selected = getUrlParam('cycleId') ?? sel.value;

  try {
    const res = await apiFetch('/performance/cycles', { query: { page: 1, limit: 200 } });
    const cycles: CycleRow[] = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];

    sel.innerHTML = '';
    sel.appendChild(new Option('All cycles', ''));

    // Active cycles first, then by startDate desc (already sorted; stable partition for active).
    const active = cycles.filter((c) => c.isActive);
    const inactive = cycles.filter((c) => !c.isActive);
    [...active, ...inactive].forEach((c) => {
      sel.appendChild(new Option(cycleLabel(c), String(c.id)));
    });

    if (selected !== null && selected !== undefined) {
      sel.value = String(selected);
    }
  } catch {
    // Keep a minimal fallback if cycles cannot be loaded.
    sel.innerHTML = '';
    sel.appendChild(new Option('All cycles', ''));
    sel.appendChild(new Option('Failed to load cycles', ''));
  }
}

async function loadEvaluations() {
  const tbody = getEl<HTMLTableSectionElement>('evals-tbody');
  const empty = getEl<HTMLDivElement>('evals-empty');
  const pageEl = getEl<HTMLSpanElement>('evals-page');
  const totalEl = getEl<HTMLSpanElement>('evals-total');
  if (!tbody || !empty || !pageEl || !totalEl) return;

  tbody.innerHTML = '';
  empty.classList.add('hidden');

  const page = Number(getUrlParam('page') || '1');
  const limit = Number(getUrlParam('limit') || '20');

  const query: any = { page, limit };

  const cycleId = getUrlParam('cycleId');
  const status = getUrlParam('status');
  const department = getUrlParam('department');
  const employeeId = getUrlParam('employeeId');
  const sortBy = getUrlParam('sortBy');
  const sortOrder = getUrlParam('sortOrder');

  if (cycleId) query.cycleId = cycleId;
  if (status) query.status = status;
  if (department) query.department = department;
  if (employeeId) query.employeeId = employeeId;
  if (sortBy) query.sortBy = sortBy;
  if (sortOrder) query.sortOrder = sortOrder;

  const res = await apiFetch('/performance/evaluations', { query });
  const rows: EvalRow[] = Array.isArray(res?.data) ? res.data : [];

  const total = res?.pagination?.total ?? rows.length;
  const totalPages = res?.pagination?.totalPages ?? 1;

  pageEl.textContent = `${page} / ${totalPages}`;
  totalEl.textContent = String(total);

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
      <td class="py-2 px-4 text-sm">#${r.id}</td>
      <td class="py-2 px-4 text-sm">${r.employee?.fullName ?? ''}</td>
      <td class="py-2 px-4 text-sm">${r.employee?.department ?? ''}</td>
      <td class="py-2 px-4 text-sm">${r.cycle?.name ?? ''}</td>
      <td class="py-2 px-4">${badgeStatus(r.status)}</td>
      <td class="py-2 px-4 text-sm">${scoreText}</td>
      <td class="py-2 px-4 text-sm">${rankText}</td>
      <td class="py-2 px-4">
        <a class="px-2 py-1 text-xs border rounded bg-white hover:bg-dark-transparent" href="performance-evaluation.html?id=${r.id}">View</a>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

function syncFiltersFromUrl() {
  const set = (id: string, param: string) => {
    const el = getEl<HTMLInputElement | HTMLSelectElement>(id);
    if (!el) return;
    const v = getUrlParam(param);
    if (v !== null) el.value = v;
  };

  set('filter-cycleId', 'cycleId');
  set('filter-status', 'status');
  set('filter-department', 'department');
  set('filter-employeeId', 'employeeId');
  set('filter-sortBy', 'sortBy');
  set('filter-sortOrder', 'sortOrder');
}

function wireFilters() {
  const applyBtn = getEl<HTMLButtonElement>('filter-apply');
  applyBtn?.addEventListener('click', async () => {
    const cycleId = (getEl<HTMLSelectElement>('filter-cycleId')?.value || '').trim();
    const status = (getEl<HTMLSelectElement>('filter-status')?.value || '').trim();
    const department = (getEl<HTMLInputElement>('filter-department')?.value || '').trim();
    const employeeId = (getEl<HTMLInputElement>('filter-employeeId')?.value || '').trim();
    const sortBy = (getEl<HTMLSelectElement>('filter-sortBy')?.value || '').trim();
    const sortOrder = (getEl<HTMLSelectElement>('filter-sortOrder')?.value || '').trim();

    setUrlParam('page', '1');
    setUrlParam('cycleId', cycleId);
    setUrlParam('status', status);
    setUrlParam('department', department);
    setUrlParam('employeeId', employeeId);
    setUrlParam('sortBy', sortBy);
    setUrlParam('sortOrder', sortOrder);

    await loadEvaluations();
  });

  getEl<HTMLButtonElement>('filter-reset')?.addEventListener('click', async () => {
    ['cycleId', 'status', 'department', 'employeeId', 'sortBy', 'sortOrder', 'page'].forEach((k) => setUrlParam(k, ''));
    syncFiltersFromUrl();
    await loadEvaluations();
  });
}

function wirePager() {
  getEl<HTMLButtonElement>('page-prev')?.addEventListener('click', async () => {
    const page = Math.max(1, Number(getUrlParam('page') || '1') - 1);
    setUrlParam('page', String(page));
    await loadEvaluations();
  });
  getEl<HTMLButtonElement>('page-next')?.addEventListener('click', async () => {
    const page = Number(getUrlParam('page') || '1') + 1;
    setUrlParam('page', String(page));
    await loadEvaluations();
  });
}

async function wireInitializeButton() {
  const me = await getCurrentUser();
  const isAdmin = hasAnyRole(me.role, ['HR_ADMIN', 'SYSTEM_ADMIN']);

  const btn = getEl<HTMLButtonElement>('init-evals');
  if (!btn) return;
  if (!isAdmin) {
    btn.classList.add('hidden');
    return;
  }

  btn.addEventListener('click', async () => {
    const cycleId = (getEl<HTMLSelectElement>('filter-cycleId')?.value || '').trim();
    if (!cycleId) {
      showToast('Select a cycle to initialize evaluations', 'error');
      return;
    }
    try {
      await apiFetch(`/performance/cycles/${Number(cycleId)}/initialize-evaluations`, { method: 'POST' });
      showToast('Evaluations initialized for cycle', 'success');
      await loadEvaluations();
    } catch (err: any) {
      showToast(err?.message || 'Failed to initialize evaluations', 'error');
    }
  });
}

function startPolling() {
  const intervalMs = 15000;
  window.setInterval(() => {
    loadEvaluations().catch(() => undefined);
  }, intervalMs);
}

document.addEventListener('DOMContentLoaded', async () => {
  await renderPerformanceNav('perf-nav');
  await loadCyclesIntoFilter();
  syncFiltersFromUrl();
  wireFilters();
  wirePager();
  await wireInitializeButton();

  await loadEvaluations();
  startPolling();
});
