import { apiFetch, getCurrentUser, hasAnyRole, renderPerformanceNav, showToast } from './core.js';

type Cycle = {
  id: number;
  name: string;
  period: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  tenantId?: string | null;
};

function fmtDate(d: string) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString();
}

function getEl<T extends HTMLElement>(id: string) {
  return document.getElementById(id) as T | null;
}

function openModal(open: boolean) {
  const modal = getEl<HTMLDivElement>('cycle-modal');
  if (!modal) return;
  if (open) modal.classList.remove('hidden');
  else modal.classList.add('hidden');
}

function setForm(cycle?: Partial<Cycle>) {
  (getEl<HTMLInputElement>('cycle-id')!).value = cycle?.id ? String(cycle.id) : '';
  (getEl<HTMLInputElement>('cycle-name')!).value = cycle?.name ?? '';
  (getEl<HTMLSelectElement>('cycle-period')!).value = cycle?.period ?? 'QUARTERLY';
  (getEl<HTMLInputElement>('cycle-start')!).value = cycle?.startDate ? String(cycle.startDate).slice(0, 10) : '';
  (getEl<HTMLInputElement>('cycle-end')!).value = cycle?.endDate ? String(cycle.endDate).slice(0, 10) : '';
  (getEl<HTMLInputElement>('cycle-tenant')!).value = cycle?.tenantId ? String(cycle.tenantId) : '';
}

async function loadCycles() {
  const tbody = getEl<HTMLTableSectionElement>('cycles-tbody');
  const empty = getEl<HTMLDivElement>('cycles-empty');
  if (!tbody || !empty) return;

  tbody.innerHTML = '';
  empty.classList.add('hidden');

  const me = await getCurrentUser();
  const isAdmin = hasAnyRole(me.role, ['HR_ADMIN', 'SYSTEM_ADMIN']);

  const res = await apiFetch('/performance/cycles', { query: { page: 1, limit: 50 } });
  const rows: Cycle[] = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];

  if (!rows.length) {
    empty.classList.remove('hidden');
    return;
  }

  rows.forEach((c) => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-borderColor';

    const activeBadge = c.isActive
      ? '<span class="inline-flex items-center text-[10px] font-medium px-2 py-1 rounded bg-green-100 text-green-800 border border-green-200">Active</span>'
      : '<span class="inline-flex items-center text-[10px] font-medium px-2 py-1 rounded bg-gray-100 text-gray-700 border border-gray-200">Inactive</span>';

    const adminActions = isAdmin
      ? `
        <div class="flex items-center gap-2">
          <button class="cycle-edit px-2 py-1 text-xs border rounded bg-white hover:bg-dark-transparent" data-id="${c.id}">Edit</button>
          <button class="cycle-toggle px-2 py-1 text-xs border rounded bg-white hover:bg-dark-transparent" data-id="${c.id}" data-active="${c.isActive ? '1' : '0'}">${c.isActive ? 'Deactivate' : 'Activate'}</button>
        </div>
      `
      : '';

    tr.innerHTML = `
      <td class="py-2 px-4 text-sm">${c.name}</td>
      <td class="py-2 px-4 text-sm">${c.period}</td>
      <td class="py-2 px-4 text-sm">${fmtDate(c.startDate)}</td>
      <td class="py-2 px-4 text-sm">${fmtDate(c.endDate)}</td>
      <td class="py-2 px-4">${activeBadge}</td>
      <td class="py-2 px-4">${adminActions}</td>
    `;

    tbody.appendChild(tr);
  });

  tbody.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;

    const editBtn = target.closest<HTMLButtonElement>('.cycle-edit');
    if (editBtn) {
      const id = Number(editBtn.dataset.id);
      const cycle = rows.find((x) => x.id === id);
      if (cycle) {
        setForm(cycle);
        openModal(true);
      }
      return;
    }

    const toggleBtn = target.closest<HTMLButtonElement>('.cycle-toggle');
    if (toggleBtn) {
      const id = Number(toggleBtn.dataset.id);
      const active = toggleBtn.dataset.active === '1';
      try {
        if (active) {
          await apiFetch(`/performance/cycles/${id}/deactivate`, { method: 'POST' });
          showToast('Cycle deactivated', 'success');
        } else {
          await apiFetch(`/performance/cycles/${id}/activate`, { method: 'POST' });
          showToast('Cycle activated', 'success');
        }
        await loadCycles();
      } catch (err: any) {
        showToast(err?.message || 'Failed to update cycle', 'error');
      }
    }
  }, { once: true });
}

async function submitForm() {
  const id = (getEl<HTMLInputElement>('cycle-id')!).value.trim();
  const name = (getEl<HTMLInputElement>('cycle-name')!).value.trim();
  const period = (getEl<HTMLSelectElement>('cycle-period')!).value;
  const startDate = (getEl<HTMLInputElement>('cycle-start')!).value;
  const endDate = (getEl<HTMLInputElement>('cycle-end')!).value;
  const tenantIdRaw = (getEl<HTMLInputElement>('cycle-tenant')!).value.trim();

  if (!name || !startDate || !endDate) {
    showToast('Name, start date, and end date are required', 'error');
    return;
  }

  const payload: any = { name, period, startDate, endDate };
  if (tenantIdRaw) payload.tenantId = tenantIdRaw;

  try {
    if (id) {
      await apiFetch(`/performance/cycles/${Number(id)}`, { method: 'PATCH', body: payload });
      showToast('Cycle updated', 'success');
    } else {
      await apiFetch('/performance/cycles', { method: 'POST', body: payload });
      showToast('Cycle created', 'success');
    }
    openModal(false);
    setForm(undefined);
    await loadCycles();
  } catch (err: any) {
    showToast(err?.message || 'Failed to save cycle', 'error');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await renderPerformanceNav('perf-nav');

  const me = await getCurrentUser();
  const isAdmin = hasAnyRole(me.role, ['HR_ADMIN', 'SYSTEM_ADMIN']);
  const createBtn = getEl<HTMLButtonElement>('cycle-create');
  if (createBtn) {
    if (!isAdmin) createBtn.classList.add('hidden');
    createBtn.addEventListener('click', () => {
      setForm(undefined);
      openModal(true);
    });
  }

  getEl<HTMLButtonElement>('cycle-modal-close')?.addEventListener('click', () => openModal(false));
  getEl<HTMLButtonElement>('cycle-modal-cancel')?.addEventListener('click', () => openModal(false));
  getEl<HTMLButtonElement>('cycle-save')?.addEventListener('click', submitForm);

  await loadCycles();
});
