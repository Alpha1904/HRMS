import {
  apiFetch,
  fmtMoney,
  renderPaymentNav,
  searchProfiles,
  showToast,
} from './core.js';

function el<T extends Element = Element>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing element: ${id}`);
  return node as unknown as T;
}

function setHidden(id: string, hidden: boolean) {
  const node = document.getElementById(id);
  if (!node) return;
  if (hidden) node.classList.add('hidden');
  else node.classList.remove('hidden');
}

function openModal() {
  const m = el<HTMLDivElement>('modal');
  m.classList.remove('hidden');
  m.classList.add('flex');
}

function closeModal() {
  const m = el<HTMLDivElement>('modal');
  m.classList.add('hidden');
  m.classList.remove('flex');
}

async function loadComponents(profileId: number) {
  const rows = await apiFetch(`/payment/compensation/${profileId}`);
  return Array.isArray(rows) ? rows : [];
}

async function updateComponent(id: number, payload: any) {
  return await apiFetch(`/payment/compensation/${id}`, { method: 'PATCH', body: payload });
}

async function deactivateComponent(id: number) {
  return await apiFetch(`/payment/compensation/${id}`, { method: 'DELETE' });
}

function setModalMode(mode: 'create' | 'edit') {
  const title = document.getElementById('modal-title');
  if (title) {
    title.textContent = mode === 'edit' ? 'Edit compensation component' : 'Add compensation component';
  }

  const btn = document.getElementById('btn-submit');
  if (btn) {
    btn.textContent = mode === 'edit' ? 'Update' : 'Create';
  }
}

function resetFormForCreate(profileId?: string) {
  el<HTMLInputElement>('f-id').value = '';
  if (profileId !== undefined) {
    el<HTMLInputElement>('f-profileId').value = profileId;
  }
  setModalMode('create');
}

function fillFormForEdit(row: any) {
  el<HTMLInputElement>('f-id').value = String(row.id ?? '');
  el<HTMLInputElement>('f-profileId').value = String(row.profileId ?? '');
  el<HTMLSelectElement>('f-type').value = String(row.type ?? 'BASE_SALARY');
  el<HTMLInputElement>('f-amount').value = row.amount !== undefined && row.amount !== null ? String(row.amount) : '';
  el<HTMLSelectElement>('f-frequency').value = String(row.frequency ?? 'MONTHLY');
  el<HTMLInputElement>('f-description').value = row.description ? String(row.description) : '';
  el<HTMLInputElement>('f-start').value = row.startDate ? String(row.startDate).slice(0, 10) : '';
  el<HTMLInputElement>('f-end').value = row.endDate ? String(row.endDate).slice(0, 10) : '';
  el<HTMLInputElement>('f-active').checked = Boolean(row.active);
  setModalMode('edit');
}

function renderRows(rows: any[]) {
  const tbody = el<HTMLTableSectionElement>('tbody');
  tbody.innerHTML = '';

  if (!rows.length) {
    setHidden('empty', false);
    return;
  }

  setHidden('empty', true);

  rows.forEach((r) => {
    const tr = document.createElement('tr');
    tr.className = 'border-t border-borderColor';

    tr.innerHTML = `
      <td class="px-4 py-3 text-sm text-gray-700">${String(r.id ?? '')}</td>
      <td class="px-4 py-3 text-sm text-gray-800">${String(r.type ?? '')}</td>
      <td class="px-4 py-3 text-sm text-gray-800">${fmtMoney(r.amount)}</td>
      <td class="px-4 py-3 text-sm text-gray-700">${String(r.frequency ?? '')}</td>
      <td class="px-4 py-3 text-sm text-gray-700">${r.startDate ? String(r.startDate).slice(0, 10) : ''}</td>
      <td class="px-4 py-3 text-sm text-gray-700">${r.endDate ? String(r.endDate).slice(0, 10) : ''}</td>
      <td class="px-4 py-3 text-sm text-gray-700">${r.active ? 'Yes' : 'No'}</td>
      <td class="px-4 py-3 text-sm text-gray-700">
        <div class="flex items-center gap-2">
          <button type="button" class="btn-edit px-3 py-2 rounded text-xs font-medium border border-borderColor bg-white hover:bg-dark-transparent" data-id="${String(r.id ?? '')}">Edit</button>
          <button type="button" class="btn-deactivate px-3 py-2 rounded text-xs font-medium border border-borderColor bg-white hover:bg-dark-transparent" data-id="${String(r.id ?? '')}" ${r.active ? '' : 'disabled'}>${r.active ? 'Deactivate' : 'Inactive'}</button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });

  tbody.querySelectorAll<HTMLButtonElement>('.btn-edit').forEach((b) => {
    b.addEventListener('click', () => {
      const id = Number(b.dataset.id);
      const row = rows.find((x) => Number(x?.id) === id);
      if (!row) return;
      fillFormForEdit(row);
      openModal();
    });
  });

  tbody.querySelectorAll<HTMLButtonElement>('.btn-deactivate').forEach((b) => {
    b.addEventListener('click', async () => {
      const id = Number(b.dataset.id);
      if (!id) return;
      if (!window.confirm('Deactivate this component?')) return;

      try {
        await deactivateComponent(id);
        showToast('Component deactivated', 'success');

        const pid = Number(el<HTMLInputElement>('profileId').value.trim());
        if (pid) {
          const next = await loadComponents(pid);
          renderRows(next);
        }
      } catch (e: any) {
        showToast(e?.message || 'Failed to deactivate component', 'error');
      }
    });
  });
}

async function fillProfileSelect(term: string) {
  const select = el<HTMLSelectElement>('profileSelect');
  select.innerHTML = '<option value="">Select a profile</option>';

  const profiles = await searchProfiles(term);
  profiles.forEach((p: any) => {
    const opt = document.createElement('option');
    opt.value = String(p.id);
    const email = p?.user?.email ? ` • ${p.user.email}` : '';
    opt.textContent = `${p.id} - ${p.fullName || 'Unknown'}${email}`;
    select.appendChild(opt);
  });
}

async function createComponent(payload: any) {
  return await apiFetch('/payment/compensation', { method: 'POST', body: payload });
}

function todayIso() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

async function init() {
  await renderPaymentNav('payment-nav');

  const btnProfileSearch = el<HTMLButtonElement>('btn-profile-search');
  const btnLoad = el<HTMLButtonElement>('btn-load');
  const btnOpen = el<HTMLButtonElement>('btn-open-create');
  const btnClose = el<HTMLButtonElement>('btn-close');

  const profileSearch = el<HTMLInputElement>('profileSearch');
  const profileSelect = el<HTMLSelectElement>('profileSelect');
  const profileIdInput = el<HTMLInputElement>('profileId');

  btnProfileSearch.addEventListener('click', async () => {
    try {
      await fillProfileSelect(profileSearch.value.trim());
    } catch (e: any) {
      showToast(e?.message || 'Failed to search profiles', 'error');
    }
  });

  profileSelect.addEventListener('change', () => {
    if (profileSelect.value) profileIdInput.value = profileSelect.value;
  });

  btnLoad.addEventListener('click', async () => {
    try {
      const pid = Number(profileIdInput.value.trim());
      if (!pid) throw new Error('Please enter a valid Profile ID');

      const rows = await loadComponents(pid);
      renderRows(rows);
    } catch (e: any) {
      showToast(e?.message || 'Failed to load components', 'error');
      renderRows([]);
    }
  });

  btnOpen.addEventListener('click', () => {
    const pid = profileIdInput.value.trim();
    resetFormForCreate(pid);
    el<HTMLInputElement>('f-start').value = todayIso();
    openModal();
  });

  btnClose.addEventListener('click', closeModal);

  el<HTMLDivElement>('modal').addEventListener('click', (ev) => {
    if (ev.target === el<HTMLDivElement>('modal')) closeModal();
  });

  const form = el<HTMLFormElement>('form');
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();

    try {
      const idRaw = el<HTMLInputElement>('f-id').value.trim();
      const isEdit = Boolean(idRaw);
      const id = isEdit ? Number(idRaw) : undefined;

      const profileId = Number(el<HTMLInputElement>('f-profileId').value.trim());
      if (!profileId) throw new Error('Profile ID is required');

      const type = el<HTMLSelectElement>('f-type').value;
      const amount = Number(el<HTMLInputElement>('f-amount').value);
      if (!Number.isFinite(amount) || amount <= 0) throw new Error('Amount must be greater than 0');

      const frequency = el<HTMLSelectElement>('f-frequency').value;
      const description = el<HTMLInputElement>('f-description').value.trim();
      const startDate = el<HTMLInputElement>('f-start').value;
      const endDate = el<HTMLInputElement>('f-end').value;
      const active = el<HTMLInputElement>('f-active').checked;

      if (!isEdit) {
        const payload: any = {
          profileId,
          type,
          amount,
          frequency,
          description: description || undefined,
          startDate,
          endDate: endDate || undefined,
          active,
        };

        await createComponent(payload);
        showToast('Component created', 'success');
      } else {
        if (!id || !Number.isFinite(id)) throw new Error('Invalid component id');

        const payload: any = {
          type,
          amount,
          frequency,
          description: description ? description : null,
          startDate,
          endDate: endDate ? endDate : null,
          active,
        };

        await updateComponent(id, payload);
        showToast('Component updated', 'success');
      }
      closeModal();

      profileIdInput.value = String(profileId);
      const rows = await loadComponents(profileId);
      renderRows(rows);
    } catch (e: any) {
      showToast(e?.message || 'Failed to save component', 'error');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  init().catch((e) => showToast(e?.message || 'Failed to initialize page', 'error'));
});
