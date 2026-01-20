import { apiFetch, getCurrentUser, hasAnyRole, renderPerformanceNav, showToast } from './core.js';

type Criteria = {
  id: number;
  name: string;
  description?: string | null;
  weight: number;
  isActive: boolean;
  tenantId?: string | null;
};

function getEl<T extends HTMLElement>(id: string) {
  return document.getElementById(id) as T | null;
}

function openModal(open: boolean) {
  const modal = getEl<HTMLDivElement>('criteria-modal');
  if (!modal) return;
  if (open) modal.classList.remove('hidden');
  else modal.classList.add('hidden');
}

function setForm(row?: Partial<Criteria>) {
  (getEl<HTMLInputElement>('crit-id')!).value = row?.id ? String(row.id) : '';
  (getEl<HTMLInputElement>('crit-name')!).value = row?.name ?? '';
  (getEl<HTMLInputElement>('crit-desc')!).value = row?.description ? String(row.description) : '';
  (getEl<HTMLInputElement>('crit-weight')!).value = row?.weight !== undefined ? String(row.weight) : '';
  (getEl<HTMLInputElement>('crit-tenant')!).value = row?.tenantId ? String(row.tenantId) : '';
}

async function loadCriteria() {
  const tbody = getEl<HTMLTableSectionElement>('criteria-tbody');
  const totalEl = getEl<HTMLSpanElement>('criteria-total');
  const empty = getEl<HTMLDivElement>('criteria-empty');
  if (!tbody || !totalEl || !empty) return;

  tbody.innerHTML = '';
  empty.classList.add('hidden');

  const me = await getCurrentUser();
  const isAdmin = hasAnyRole(me.role, ['HR_ADMIN', 'SYSTEM_ADMIN']);

  const res = await apiFetch('/performance/criteria');
  const rows: Criteria[] = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];

  const activeTotal = rows.filter((c) => c.isActive).reduce((sum, c) => sum + Number(c.weight || 0), 0);
  totalEl.textContent = activeTotal.toFixed(2);
  if (Math.abs(activeTotal - 1) > 0.001) {
    totalEl.className = 'text-red-600 font-semibold';
  } else {
    totalEl.className = 'text-green-700 font-semibold';
  }

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

    const actions = isAdmin
      ? `
        <div class="flex items-center gap-2">
          <button class="crit-edit px-2 py-1 text-xs border rounded bg-white hover:bg-dark-transparent" data-id="${c.id}">Edit</button>
          <button class="crit-toggle px-2 py-1 text-xs border rounded bg-white hover:bg-dark-transparent" data-id="${c.id}">Toggle</button>
          <button class="crit-delete px-2 py-1 text-xs border rounded bg-white hover:bg-dark-transparent" data-id="${c.id}">Delete</button>
        </div>
      `
      : '';

    tr.innerHTML = `
      <td class="py-2 px-4 text-sm">${c.name}</td>
      <td class="py-2 px-4 text-sm text-gray-600">${c.description ?? ''}</td>
      <td class="py-2 px-4 text-sm">${Number(c.weight).toFixed(2)}</td>
      <td class="py-2 px-4">${activeBadge}</td>
      <td class="py-2 px-4">${actions}</td>
    `;

    tbody.appendChild(tr);
  });

  tbody.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;

    const editBtn = target.closest<HTMLButtonElement>('.crit-edit');
    if (editBtn) {
      const id = Number(editBtn.dataset.id);
      const row = rows.find((x) => x.id === id);
      if (row) {
        setForm(row);
        openModal(true);
      }
      return;
    }

    const toggleBtn = target.closest<HTMLButtonElement>('.crit-toggle');
    if (toggleBtn) {
      const id = Number(toggleBtn.dataset.id);
      try {
        await apiFetch(`/performance/criteria/${id}/toggle-status`, { method: 'POST' });
        showToast('Criteria status updated', 'success');
        await loadCriteria();
      } catch (err: any) {
        showToast(err?.message || 'Failed to toggle criteria', 'error');
      }
      return;
    }

    const delBtn = target.closest<HTMLButtonElement>('.crit-delete');
    if (delBtn) {
      const id = Number(delBtn.dataset.id);
      const ok = window.confirm('Delete criteria?');
      if (!ok) return;
      try {
        await apiFetch(`/performance/criteria/${id}`, { method: 'DELETE' });
        showToast('Criteria deleted', 'success');
        await loadCriteria();
      } catch (err: any) {
        showToast(err?.message || 'Failed to delete criteria', 'error');
      }
    }
  }, { once: true });
}

async function submitForm() {
  const id = (getEl<HTMLInputElement>('crit-id')!).value.trim();
  const name = (getEl<HTMLInputElement>('crit-name')!).value.trim();
  const description = (getEl<HTMLInputElement>('crit-desc')!).value.trim();
  const weightRaw = (getEl<HTMLInputElement>('crit-weight')!).value.trim();
  const tenantId = (getEl<HTMLInputElement>('crit-tenant')!).value.trim();

  const weight = Number(weightRaw);
  if (!name || Number.isNaN(weight)) {
    showToast('Name and valid weight are required', 'error');
    return;
  }
  if (weight < 0 || weight > 1) {
    showToast('Weight must be between 0 and 1', 'error');
    return;
  }

  const payload: any = { name, weight };
  if (description) payload.description = description;
  if (tenantId) payload.tenantId = tenantId;

  try {
    if (id) {
      await apiFetch(`/performance/criteria/${Number(id)}`, { method: 'PATCH', body: payload });
      showToast('Criteria updated', 'success');
    } else {
      await apiFetch('/performance/criteria', { method: 'POST', body: payload });
      showToast('Criteria created', 'success');
    }
    openModal(false);
    setForm(undefined);
    await loadCriteria();
  } catch (err: any) {
    showToast(err?.message || 'Failed to save criteria', 'error');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await renderPerformanceNav('perf-nav');

  const me = await getCurrentUser();
  const isAdmin = hasAnyRole(me.role, ['HR_ADMIN', 'SYSTEM_ADMIN']);
  const createBtn = getEl<HTMLButtonElement>('crit-create');
  if (createBtn) {
    if (!isAdmin) createBtn.classList.add('hidden');
    createBtn.addEventListener('click', () => {
      setForm(undefined);
      openModal(true);
    });
  }

  getEl<HTMLButtonElement>('crit-modal-close')?.addEventListener('click', () => openModal(false));
  getEl<HTMLButtonElement>('crit-modal-cancel')?.addEventListener('click', () => openModal(false));
  getEl<HTMLButtonElement>('crit-save')?.addEventListener('click', submitForm);

  await loadCriteria();
});
