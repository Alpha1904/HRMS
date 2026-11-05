import { apiFetch, getCurrentUser, hasAnyRole, renderPerformanceNav, setUrlParam, getUrlParam, showToast } from './core.js';

type RankingRow = any;

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

function dedupeCycles(cycles: CycleRow[]): CycleRow[] {
  const map = new Map<number, CycleRow>();
  cycles.forEach((c) => {
    if (!c || !c.id) return;
    if (!map.has(c.id)) map.set(c.id, c);
  });
  return Array.from(map.values());
}

async function loadCyclesIntoFilter() {
  const sel = getEl<HTMLSelectElement>('rankings-cycleId');
  if (!sel) return;

  const selected = getUrlParam('cycleId') ?? sel.value;

  const setOptions = (cycles: CycleRow[]) => {
    sel.innerHTML = '';
    sel.appendChild(new Option('Select a cycle', '', true, false));
    sel.options[0].disabled = true;

    const active = cycles.filter((c) => c.isActive);
    const inactive = cycles.filter((c) => !c.isActive);
    [...active, ...inactive].forEach((c) => {
      sel.appendChild(new Option(cycleLabel(c), String(c.id)));
    });

    if (selected) {
      sel.value = String(selected);
    }
  };

  try {
    const res = await apiFetch('/performance/cycles', { query: { page: 1, limit: 200 } });
    const cycles: CycleRow[] = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    setOptions(dedupeCycles(cycles));
    return;
  } catch (e: any) {
    // If user doesn't have permission to list cycles (e.g., EMPLOYEE), infer available cycles from accessible evaluations.
    if (e?.status !== 403) {
      sel.innerHTML = '';
      sel.appendChild(new Option('Select a cycle', '', true, false));
      sel.options[0].disabled = true;
      sel.appendChild(new Option('Failed to load cycles', '', false, false));
      sel.options[1].disabled = true;
      return;
    }
  }

  try {
    const evalRes = await apiFetch('/performance/evaluations', { query: { page: 1, limit: 200 } });
    const evalRows: any[] = Array.isArray(evalRes?.data) ? evalRes.data : [];
    const inferred: CycleRow[] = evalRows
      .map((r) => r?.cycle)
      .filter(Boolean)
      .map((c: any) => ({
        id: Number(c.id),
        name: String(c.name ?? ''),
        period: String(c.period ?? ''),
        startDate: String(c.startDate ?? ''),
        endDate: String(c.endDate ?? ''),
        isActive: Boolean(c.isActive ?? false),
      }));

    setOptions(dedupeCycles(inferred));
  } catch {
    sel.innerHTML = '';
    sel.appendChild(new Option('Select a cycle', '', true, false));
    sel.options[0].disabled = true;
    sel.appendChild(new Option('No cycles available', '', false, false));
    sel.options[1].disabled = true;
  }
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
    const cycleId = (getEl<HTMLSelectElement>('rankings-cycleId')?.value || '').trim();
    const department = (getEl<HTMLInputElement>('rankings-dept')?.value || '').trim();
    setUrlParam('cycleId', cycleId);
    setUrlParam('department', department);
    setUrlParam('page', '1');
    await loadRankings();
  });

  const calc = getEl<HTMLButtonElement>('rankings-calc');
  calc?.addEventListener('click', async () => {
    const cycleId = Number(getUrlParam('cycleId') || (getEl<HTMLSelectElement>('rankings-cycleId')?.value || '').trim());
    if (!cycleId || Number.isNaN(cycleId)) {
      showToast('Select a cycle', 'error');
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
    const el = getEl<HTMLSelectElement>('rankings-cycleId');
    if (el) el.value = cycleId;
  }
  if (department) {
    const el = getEl<HTMLInputElement>('rankings-dept');
    if (el) el.value = department;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await renderPerformanceNav('perf-nav');
  await loadCyclesIntoFilter();
  syncFromUrl();
  await wireAdminVisibility();
  wireFilters();
  await loadRankings();
});
