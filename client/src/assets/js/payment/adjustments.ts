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

async function loadAdjustments(profileId: number) {
  const rows = await apiFetch(`/payment/adjustment/${profileId}`);
  return Array.isArray(rows) ? rows : [];
}

async function updateAdjustment(id: number, payload: any) {
  return await apiFetch(`/payment/adjustment/${id}`, { method: 'PATCH', body: payload });
}

async function loadComponents(profileId: number) {
  const rows = await apiFetch(`/payment/compensation/${profileId}`);
  return Array.isArray(rows) ? rows : [];
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
      <td class="px-4 py-3 text-sm text-gray-800">${String(r.adjustmentType ?? '')}</td>
      <td class="px-4 py-3 text-sm text-gray-800">${fmtMoney(r.amount)}</td>
      <td class="px-4 py-3 text-sm text-gray-700">${r.percentage !== null && r.percentage !== undefined ? String(r.percentage) : ''}</td>
      <td class="px-4 py-3 text-sm text-gray-700">${String(r.reason ?? '')}</td>
      <td class="px-4 py-3 text-sm text-gray-700">${r.effectiveDate ? String(r.effectiveDate).slice(0, 10) : ''}</td>
      <td class="px-4 py-3 text-sm text-gray-700">
        <button type="button" class="btn-edit px-3 py-2 rounded text-xs font-medium border border-borderColor bg-white hover:bg-dark-transparent" data-id="${String(r.id ?? '')}">Edit</button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  tbody.querySelectorAll<HTMLButtonElement>('.btn-edit').forEach((b) => {
    b.addEventListener('click', async () => {
      const id = Number(b.dataset.id);
      const row = rows.find((x) => Number(x?.id) === id);
      if (!row) return;

      el<HTMLInputElement>('f-id').value = String(row.id ?? '');
      el<HTMLInputElement>('f-profileId').value = String(row.profileId ?? '');
      el<HTMLSelectElement>('f-componentId').value = row.componentId ? String(row.componentId) : '';
      el<HTMLInputElement>('f-type').value = String(row.adjustmentType ?? '');
      el<HTMLInputElement>('f-amount').value = row.amount !== undefined && row.amount !== null ? String(row.amount) : '';
      el<HTMLInputElement>('f-percentage').value = row.percentage !== undefined && row.percentage !== null ? String(row.percentage) : '';
      el<HTMLInputElement>('f-reason').value = row.reason ? String(row.reason) : '';
      el<HTMLInputElement>('f-date').value = row.effectiveDate ? String(row.effectiveDate).slice(0, 10) : '';

      const title = document.getElementById('modal-title');
      if (title) title.textContent = 'Edit adjustment';
      const btn = document.getElementById('btn-submit');
      if (btn) btn.textContent = 'Update';

      const pid = Number(el<HTMLInputElement>('f-profileId').value.trim());
      if (pid) {
        await refreshComponentSelect(pid);
        // refreshComponentSelect resets options; re-select the component
        el<HTMLSelectElement>('f-componentId').value = row.componentId ? String(row.componentId) : '';
      }

      openModal();
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

async function createAdjustment(payload: any) {
  return await apiFetch('/payment/adjustment', { method: 'POST', body: payload });
}

function todayIso() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

async function refreshComponentSelect(profileId: number) {
  const select = el<HTMLSelectElement>('f-componentId');
  select.innerHTML = '<option value="">None</option>';

  const comps = await loadComponents(profileId);
  comps.forEach((c: any) => {
    const opt = document.createElement('option');
    opt.value = String(c.id);
    opt.textContent = `${c.id} - ${c.type} (${fmtMoney(c.amount)})`;
    select.appendChild(opt);
  });
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

      const rows = await loadAdjustments(pid);
      renderRows(rows);
    } catch (e: any) {
      showToast(e?.message || 'Failed to load adjustments', 'error');
      renderRows([]);
    }
  });

  btnOpen.addEventListener('click', async () => {
    try {
      const pid = Number(profileIdInput.value.trim());
      if (!pid) throw new Error('Please enter a valid Profile ID first');

      el<HTMLInputElement>('f-id').value = '';
      el<HTMLInputElement>('f-profileId').value = String(pid);
      el<HTMLInputElement>('f-date').value = todayIso();
      await refreshComponentSelect(pid);

      const title = document.getElementById('modal-title');
      if (title) title.textContent = 'Add adjustment';
      const btn = document.getElementById('btn-submit');
      if (btn) btn.textContent = 'Create';

      openModal();
    } catch (e: any) {
      showToast(e?.message || 'Failed to open form', 'error');
    }
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

      const componentIdVal = el<HTMLSelectElement>('f-componentId').value;
      const adjustmentType = el<HTMLInputElement>('f-type').value.trim();
      if (!adjustmentType) throw new Error('Adjustment type is required');

      const amount = Number(el<HTMLInputElement>('f-amount').value);
      if (!Number.isFinite(amount)) throw new Error('Amount is required');

      const percentageRaw = el<HTMLInputElement>('f-percentage').value.trim();
      const percentage = percentageRaw ? Number(percentageRaw) : undefined;
      if (percentageRaw && !Number.isFinite(percentage)) throw new Error('Percentage must be a number');

      const reason = el<HTMLInputElement>('f-reason').value.trim();
      if (!reason) throw new Error('Reason is required');

      const effectiveDate = el<HTMLInputElement>('f-date').value;
      if (!effectiveDate) throw new Error('Effective date is required');

      if (!isEdit) {
        const payload: any = {
          profileId,
          adjustmentType,
          amount,
          percentage,
          reason,
          effectiveDate,
        };

        if (componentIdVal) payload.componentId = Number(componentIdVal);

        await createAdjustment(payload);
        showToast('Adjustment created', 'success');
      } else {
        if (!id || !Number.isFinite(id)) throw new Error('Invalid adjustment id');

        const payload: any = {
          componentId: componentIdVal ? Number(componentIdVal) : null,
          adjustmentType,
          amount,
          percentage: percentageRaw ? percentage : null,
          reason: reason ? reason : null,
          effectiveDate,
        };

        await updateAdjustment(id, payload);
        showToast('Adjustment updated', 'success');
      }
      closeModal();

      profileIdInput.value = String(profileId);
      const rows = await loadAdjustments(profileId);
      renderRows(rows);
    } catch (e: any) {
      showToast(e?.message || 'Failed to save adjustment', 'error');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  init().catch((e) => showToast(e?.message || 'Failed to initialize page', 'error'));
});
