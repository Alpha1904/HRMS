import { apiRequest } from '../api.js';
import { badgeClass, escapeHtml, formatDate, toast } from '../ui.js';
import type { CurrentUser } from '../auth.js';
import { renderDepartureDetail } from './departure-detail.js';
import { fetchAllProfiles, renderProfileOptions } from '../people.js';

function canCreate(role: string): boolean {
  return role === 'EMPLOYEE' || role === 'MANAGER' || role === 'HR_ADMIN' || role === 'SYSTEM_ADMIN';
}

function canManage(role: string): boolean {
  return role === 'MANAGER' || role === 'HR_ADMIN' || role === 'SYSTEM_ADMIN';
}

function canSeverance(role: string): boolean {
  return role === 'HR_ADMIN' || role === 'SYSTEM_ADMIN';
}

type DeparturesListResponse = {
  data: any[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

async function fetchCount(filters: { status?: string; type?: string; profileId?: string }): Promise<number> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.type) params.set('type', filters.type);
  if (filters.profileId) params.set('profileId', filters.profileId);
  params.set('page', '1');
  params.set('limit', '1');

  const res = (await apiRequest('GET', `/departures?${params.toString()}`)) as DeparturesListResponse;
  return Number(res?.pagination?.total ?? 0);
}

function chip(label: string, value: string, key: string): string {
  return `
    <button type="button" class="inline-flex items-center gap-2 rounded-full border border-borderColor bg-white px-3 py-1 text-xs font-medium text-gray-800 hover:bg-slate-50" data-chip="${escapeHtml(
      key,
    )}">
      <span class="text-gray-500">${escapeHtml(label)}:</span>
      <span>${escapeHtml(value)}</span>
      <span class="text-gray-400">×</span>
    </button>
  `;
}

function renderChips(root: HTMLElement, state: any) {
  const el = root.querySelector('#chips') as HTMLElement | null;
  if (!el) return;

  const chips: string[] = [];
  if (state.status) chips.push(chip('Status', state.status, 'status'));
  if (state.type) chips.push(chip('Type', state.type, 'type'));
  if (state.profileId) chips.push(chip('Profile', state.profileId, 'profileId'));
  if (state.search) chips.push(chip('Search', state.search, 'search'));

  el.innerHTML = chips.length
    ? chips.join('')
    : `<span class="text-xs text-gray-500">No filters applied.</span>`;
}

async function renderStats(root: HTMLElement, state: any): Promise<void> {
  const stats = root.querySelector('#stats') as HTMLElement | null;
  if (!stats) return;

  stats.innerHTML = `
    <div class="border border-borderColor rounded-[14px] bg-white p-4">
      <div class="text-xs text-gray-500">Total</div>
      <div class="mt-1 text-2xl font-semibold text-gray-900">…</div>
    </div>
    <div class="border border-borderColor rounded-[14px] bg-white p-4">
      <div class="text-xs text-gray-500">Pending</div>
      <div class="mt-1 text-2xl font-semibold text-gray-900">…</div>
    </div>
    <div class="border border-borderColor rounded-[14px] bg-white p-4">
      <div class="text-xs text-gray-500">In Progress</div>
      <div class="mt-1 text-2xl font-semibold text-gray-900">…</div>
    </div>
    <div class="border border-borderColor rounded-[14px] bg-white p-4">
      <div class="text-xs text-gray-500">Completed</div>
      <div class="mt-1 text-2xl font-semibold text-gray-900">…</div>
    </div>
  `;

  try {
    const base = {
      type: state.type || undefined,
      profileId: state.profileId || undefined,
    };

    const [total, pending, inProgress, completed] = await Promise.all([
      fetchCount(base),
      fetchCount({ ...base, status: 'PENDING' }),
      fetchCount({ ...base, status: 'IN_PROGRESS' }),
      fetchCount({ ...base, status: 'COMPLETED' }),
    ]);

    stats.innerHTML = `
      <div class="border border-borderColor rounded-[14px] bg-white p-4">
        <div class="flex items-center justify-between">
          <div class="text-xs text-gray-500">Total</div>
          <span class="inline-flex items-center rounded-full border px-2 py-1 text-xs bg-gray-50 text-gray-700 border-borderColor">All</span>
        </div>
        <div class="mt-1 text-2xl font-semibold text-gray-900">${total}</div>
      </div>
      <div class="border border-borderColor rounded-[14px] bg-white p-4">
        <div class="flex items-center justify-between">
          <div class="text-xs text-gray-500">Pending</div>
          <span class="inline-flex items-center rounded-full border px-2 py-1 text-xs bg-amber-50 text-amber-800 border-amber-200">PENDING</span>
        </div>
        <div class="mt-1 text-2xl font-semibold text-gray-900">${pending}</div>
      </div>
      <div class="border border-borderColor rounded-[14px] bg-white p-4">
        <div class="flex items-center justify-between">
          <div class="text-xs text-gray-500">In Progress</div>
          <span class="inline-flex items-center rounded-full border px-2 py-1 text-xs bg-violet-50 text-violet-800 border-violet-200">IN_PROGRESS</span>
        </div>
        <div class="mt-1 text-2xl font-semibold text-gray-900">${inProgress}</div>
      </div>
      <div class="border border-borderColor rounded-[14px] bg-white p-4">
        <div class="flex items-center justify-between">
          <div class="text-xs text-gray-500">Completed</div>
          <span class="inline-flex items-center rounded-full border px-2 py-1 text-xs bg-emerald-50 text-emerald-800 border-emerald-200">COMPLETED</span>
        </div>
        <div class="mt-1 text-2xl font-semibold text-gray-900">${completed}</div>
      </div>
    `;
  } catch {
    stats.innerHTML = `
      <div class="border border-borderColor rounded-[14px] bg-white p-4">
        <div class="text-xs text-gray-500">Total</div>
        <div class="mt-1 text-2xl font-semibold text-gray-900">-</div>
      </div>
      <div class="border border-borderColor rounded-[14px] bg-white p-4">
        <div class="text-xs text-gray-500">Pending</div>
        <div class="mt-1 text-2xl font-semibold text-gray-900">-</div>
      </div>
      <div class="border border-borderColor rounded-[14px] bg-white p-4">
        <div class="text-xs text-gray-500">In Progress</div>
        <div class="mt-1 text-2xl font-semibold text-gray-900">-</div>
      </div>
      <div class="border border-borderColor rounded-[14px] bg-white p-4">
        <div class="text-xs text-gray-500">Completed</div>
        <div class="mt-1 text-2xl font-semibold text-gray-900">-</div>
      </div>
    `;
  }
}

function ensureDefaultRoute() {
  if (!window.location.hash) window.location.hash = '#departures';
}

function parseHash(): { route: 'departures' | 'detail'; id?: number } {
  const h = window.location.hash || '#departures';
  if (h.startsWith('#departure/')) {
    const id = Number(h.split('/')[1]);
    return { route: 'detail', id };
  }
  return { route: 'departures' };
}

function renderShell(root: HTMLElement, user: CurrentUser) {
  root.innerHTML = `
    <div class="grid grid-cols-1 gap-4">
      <div class="card">
        <div class="card-body p-5">
          <div class="flex gap-3 md:flex-row md:items-center md:justify-between">
            <div class="flex items-start gap-3">
              <div class="size-60 rounded-[10px] bg-primary/10 text-primary text-3xl flex items-center justify-center">
                <i class="ti ti-briefcase"></i>
              </div>
              <div>
                <h5 class="mb-1 text-3xl font-semibold">Departures</h5>
                <p class="text-sm text-gray-500 mb-0">Search, filter, and manage departure cases in one place.</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button id="createBtn" class="btn btn-primary">Create departure</button>
            </div>
          </div>

          <div class="mt-4 border border-borderColor rounded-[14px] p-3 md:p-4 bg-slate-50/60 ${user.role === 'EMPLOYEE' ? 'hidden' : ''}">
            <div class="grid grid-cols-5 md:grid-cols-5 gap-3">
              <div>
                <label class="block mb-1 text-sm font-medium text-title">Status</label>
                <select id="fltStatus" class="bg-white border-borderColor text-gray-900 text-sm rounded-input block w-full py-2 px-2.5 h-[38px]">
                  <option value="">All</option>
                  <option value="PENDING">PENDING</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
              <div>
                <label class="block mb-1 text-sm font-medium text-title">Type</label>
                <select id="fltType" class="bg-white border-borderColor text-gray-900 text-sm rounded-input block w-full py-2 px-2.5 h-[38px]">
                  <option value="">All</option>
                  <option value="RESIGNATION">RESIGNATION</option>
                  <option value="DISMISSAL">DISMISSAL</option>
                  <option value="RETIREMENT">RETIREMENT</option>
                </select>
              </div>
              <div>
                <label class="block mb-1 text-sm font-medium text-title">Employee</label>
                <select id="fltProfileId" class="bg-white border-borderColor text-gray-900 text-sm rounded-input block w-full py-2 px-2.5 h-[38px]">
                  <option value="">Loading...</option>
                </select>
              </div>
              <div>
                <label class="block mb-1 text-sm font-medium text-title">Search</label>
                <input id="fltSearch" class="bg-white border-borderColor text-gray-900 text-sm rounded-input block w-full py-2 px-2.5 h-[38px]" placeholder="Employee name (current page)" />
              </div>
              <div class="flex items-end gap-2">
                <button id="applyBtn" class="btn btn-primary flex-1">Apply</button>
                <button id="clearBtn" class="btn btn-white">Clear</button>
              </div>
            </div>

            <div class="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div id="chips" class="flex flex-wrap gap-2"></div>
              <div class="text-xs text-gray-500">Search filters only the currently loaded page.</div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-3" id="stats"></div>

      <div id="tableWrap"></div>
    </div>

    <div id="createModal" class="fixed inset-0 bg-black/40 hidden items-center justify-center p-4 z-50">
      <div class="w-full max-w-xl bg-white rounded-[10px] shadow-lg">
        <div class="p-4 border-b border-borderColor flex items-center justify-between">
          <div>
            <h6 class="mb-0">Create departure</h6>
            <p class="text-xs text-gray-500 mb-0">Uses Employee Profile ID</p>
          </div>
          <button id="closeModal" class="btn btn-white">Close</button>
        </div>
        <form id="createForm" class="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          ${
            user.role === 'EMPLOYEE'
              ? `<input id="cProfileId" type="hidden" />`
              : `
          <div>
            <label class="block mb-1 text-sm font-medium text-title">Employee</label>
            <select id="cProfileId" required class="bg-white border-borderColor text-gray-900 text-sm rounded-input block w-full py-2 px-2.5 h-[38px]">
              <option value="">Loading...</option>
            </select>
          </div>
          `
          }
          <div>
            <label class="block mb-1 text-sm font-medium text-title">Type</label>
            <select id="cType" class="bg-white border-borderColor text-gray-900 text-sm rounded-input block w-full py-2 px-2.5 h-[38px]">
              <option value="RESIGNATION">RESIGNATION</option>
              <option value="DISMISSAL">DISMISSAL</option>
              <option value="RETIREMENT">RETIREMENT</option>
            </select>
          </div>
          <div class="md:col-span-2">
            <label class="block mb-1 text-sm font-medium text-title">Reason</label>
            <input id="cReason" class="bg-white border-borderColor text-gray-900 text-sm rounded-input block w-full py-2 px-2.5 h-[38px]" />
          </div>
          <div>
            <label class="block mb-1 text-sm font-medium text-title">Notice date</label>
            <input id="cNotice" type="date" required class="bg-white border-borderColor text-gray-900 text-sm rounded-input block w-full py-2 px-2.5 h-[38px]" />
          </div>
          <div>
            <label class="block mb-1 text-sm font-medium text-title">Last work date</label>
            <input id="cLast" type="date" required class="bg-white border-borderColor text-gray-900 text-sm rounded-input block w-full py-2 px-2.5 h-[38px]" />
          </div>
          <div class="md:col-span-2">
            <label class="block mb-1 text-sm font-medium text-title">Required notice days</label>
            <input id="cReq" type="number" min="0" class="bg-white border-borderColor text-gray-900 text-sm rounded-input block w-full py-2 px-2.5 h-[38px]" />
          </div>
          <div class="md:col-span-2 flex items-center justify-end gap-2">
            <button class="btn btn-primary" type="submit">Create</button>
          </div>
          <div id="cErr" class="md:col-span-2 hidden text-sm text-red-600"></div>
        </form>
      </div>
    </div>
  `;
}

async function loadTable(root: HTMLElement, user: CurrentUser, state: any) {
  const wrap = root.querySelector('#tableWrap') as HTMLElement;
  wrap.innerHTML = '<div class="p-3 text-sm text-gray-500">Loading...</div>';

  const params = new URLSearchParams();
  if (state.status) params.set('status', state.status);
  if (state.type) params.set('type', state.type);
  if (state.profileId) params.set('profileId', state.profileId);
  params.set('page', String(state.page));
  params.set('limit', String(state.limit));

  const res = (await apiRequest('GET', `/departures?${params.toString()}`)) as DeparturesListResponse;

  const list = (res.data || []).filter((d) => {
    if (!state.search) return true;
    const q = String(state.search).toLowerCase();
    const name = String(d.employee?.fullName || '').toLowerCase();
    const id = String(d.id ?? '');
    return name.includes(q) || id === q;
  });

  const rows = list
    .map((d) => {
      return `
        <tr class="border-b border-borderColor hover:bg-slate-50/60 transition-colors">
          <td class="py-3 px-5">
            <div class="font-medium text-gray-900">${escapeHtml(d.employee?.fullName || `Profile ${d.employeeId}`)}</div>
            <div class="text-xs text-gray-500">${escapeHtml(d.employee?.department || '')}</div>
          </td>
          <td class="py-3 px-5 text-sm">${escapeHtml(d.type)}</td>
          <td class="py-3 px-5 text-sm">
            <span class="inline-flex items-center rounded-full border px-2 py-1 text-xs ${badgeClass(d.status)}">${escapeHtml(d.status)}</span>
          </td>
          <td class="py-3 px-5 text-sm">${formatDate(d.noticeDate)}</td>
          <td class="py-3 px-5 text-sm">${formatDate(d.lastWorkDate)}</td>
          <td class="py-3 px-5 text-sm">${d.severancePay ?? '-'}</td>
          <td class="py-3 px-5 text-sm">
            <a class="text-primary font-medium" href="#departure/${d.id}">View</a>
          </td>
        </tr>
      `;
    })
    .join('');

  wrap.innerHTML = `
    <div class="card">
      <div class="card-body">
        <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-3">
          <div class="text-sm text-gray-500">Showing page ${res.pagination.page} of ${res.pagination.totalPages} • ${res.pagination.total} total</div>
          <div class="flex items-center gap-2 justify-end">
            <button id="prev" class="btn btn-white ${res.pagination.page <= 1 ? 'opacity-50 pointer-events-none' : ''}">Prev</button>
            <button id="next" class="btn btn-white ${res.pagination.page >= res.pagination.totalPages ? 'opacity-50 pointer-events-none' : ''}">Next</button>
          </div>
        </div>
        ${state.search ? `<div class="mb-3 text-xs text-gray-500">Search results on this page: ${list.length} item(s)</div>` : ''}
        <div class="border border-borderColor rounded-[14px] overflow-hidden">
          <div class="table-responsive">
            <table class="table table-nowrap">
              <thead class="bg-slate-50">
                <tr>
                  <th class="py-3 px-5">Employee</th>
                  <th class="py-3 px-5">Type</th>
                  <th class="py-3 px-5">Status</th>
                  <th class="py-3 px-5">Notice</th>
                  <th class="py-3 px-5">Last day</th>
                  <th class="py-3 px-5">Severance</th>
                  <th class="py-3 px-5">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${rows || `<tr><td class="py-6 px-5 text-sm text-gray-500" colspan="7">No departures found</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

  (wrap.querySelector('#prev') as HTMLButtonElement | null)?.addEventListener('click', () => {
    state.page = Math.max(1, state.page - 1);
    state.render();
  });
  (wrap.querySelector('#next') as HTMLButtonElement | null)?.addEventListener('click', () => {
    state.page = state.page + 1;
    state.render();
  });
}

export async function renderDeparturesPage(root: HTMLElement, user: CurrentUser): Promise<void> {
  ensureDefaultRoute();

  const parsed = parseHash();
  if (parsed.route === 'detail' && parsed.id) {
    await renderDepartureDetail(root, parsed.id, user, { canManage, canSeverance });
    return;
  }

  renderShell(root, user);

  let profiles: any[] = [];
  if (user.role !== 'EMPLOYEE') {
    try {
      profiles = await fetchAllProfiles();
    } catch {
      profiles = [];
    }
  }

  let employeeProfileId: number | null = null;
  let employeeProfileErr: string | null = null;
  if (user.role === 'EMPLOYEE') {
    try {
      const myProfile: any = await apiRequest('GET', `/profiles/user/${user.id}`);
      employeeProfileId = myProfile?.id ? Number(myProfile.id) : null;
    } catch {
      employeeProfileId = null;
      employeeProfileErr = 'Failed to load your employee profile';
    }
  }

  const state: any = {
    status: '',
    type: '',
    profileId: '',
    search: '',
    page: 1,
    limit: 20,
    render: async () => {
      renderChips(root, state);
      await Promise.all([renderStats(root, state), loadTable(root, user, state)]);
    },
  };

  const fltProfileSel = root.querySelector('#fltProfileId') as HTMLSelectElement | null;
  if (fltProfileSel) {
    fltProfileSel.innerHTML = renderProfileOptions(profiles, {
      valueField: 'id',
      includeEmpty: { value: '', label: 'All' },
      selected: state.profileId,
    });
  }

  const cProfileEl = root.querySelector('#cProfileId') as HTMLElement | null;
  if (cProfileEl && cProfileEl.tagName === 'SELECT') {
    (cProfileEl as HTMLSelectElement).innerHTML = renderProfileOptions(profiles, {
      valueField: 'id',
      includeEmpty: { value: '', label: 'Select employee' },
      selected: null,
    });
  }

  if (user.role === 'EMPLOYEE') {
    const cProfileHidden = root.querySelector('#cProfileId') as HTMLInputElement | null;
    if (cProfileHidden && employeeProfileId) cProfileHidden.value = String(employeeProfileId);

    const typeSel = root.querySelector('#cType') as HTMLSelectElement | null;
    if (typeSel) {
      typeSel.value = 'RESIGNATION';
      typeSel.disabled = true;
    }
  }

  const createBtn = root.querySelector('#createBtn') as HTMLButtonElement;
  if (!canCreate(user.role)) createBtn.classList.add('hidden');

  const modal = root.querySelector('#createModal') as HTMLElement;
  const openModal = () => {
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    if (user.role === 'EMPLOYEE') {
      const cErr = root.querySelector('#cErr') as HTMLElement | null;
      const submitBtn = root.querySelector('#createForm button[type="submit"]') as HTMLButtonElement | null;
      if (!employeeProfileId) {
        if (cErr) {
          cErr.textContent = employeeProfileErr || 'Employee profile not found for this account';
          cErr.classList.remove('hidden');
        }
        if (submitBtn) submitBtn.disabled = true;
      } else {
        if (submitBtn) submitBtn.disabled = false;
      }
    }
  };
  const closeModal = () => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  };

  createBtn.addEventListener('click', openModal);
  (root.querySelector('#closeModal') as HTMLButtonElement).addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  (root.querySelector('#applyBtn') as HTMLButtonElement).addEventListener('click', async () => {
    state.status = (root.querySelector('#fltStatus') as HTMLSelectElement).value;
    state.type = (root.querySelector('#fltType') as HTMLSelectElement).value;
    state.profileId = (root.querySelector('#fltProfileId') as HTMLSelectElement).value;
    state.search = (root.querySelector('#fltSearch') as HTMLInputElement).value.trim();
    state.page = 1;
    await state.render();
  });

  (root.querySelector('#fltSearch') as HTMLInputElement).addEventListener('keydown', async (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    state.search = (root.querySelector('#fltSearch') as HTMLInputElement).value.trim();
    state.page = 1;
    await state.render();
  });

  (root.querySelector('#clearBtn') as HTMLButtonElement).addEventListener('click', async () => {
    (root.querySelector('#fltStatus') as HTMLSelectElement).value = '';
    (root.querySelector('#fltType') as HTMLSelectElement).value = '';
    (root.querySelector('#fltProfileId') as HTMLSelectElement).value = '';
    (root.querySelector('#fltSearch') as HTMLInputElement).value = '';
    state.status = '';
    state.type = '';
    state.profileId = '';
    state.search = '';
    state.page = 1;
    await state.render();
  });

  const chipsEl = root.querySelector('#chips') as HTMLElement | null;
  chipsEl?.addEventListener('click', async (e) => {
    const btn = (e.target as HTMLElement).closest('button[data-chip]') as HTMLButtonElement | null;
    if (!btn) return;
    const key = btn.getAttribute('data-chip');
    if (key === 'status') {
      (root.querySelector('#fltStatus') as HTMLSelectElement).value = '';
      state.status = '';
    }
    if (key === 'type') {
      (root.querySelector('#fltType') as HTMLSelectElement).value = '';
      state.type = '';
    }
    if (key === 'profileId') {
      (root.querySelector('#fltProfileId') as HTMLSelectElement).value = '';
      state.profileId = '';
    }
    if (key === 'search') {
      (root.querySelector('#fltSearch') as HTMLInputElement).value = '';
      state.search = '';
    }
    state.page = 1;
    await state.render();
  });

  const createForm = root.querySelector('#createForm') as HTMLFormElement;
  const cErr = root.querySelector('#cErr') as HTMLElement;

  createForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    cErr.classList.add('hidden');

    let profileId: number | null = null;
    if (user.role === 'EMPLOYEE') {
      profileId = employeeProfileId;
    } else {
      profileId = Number((root.querySelector('#cProfileId') as HTMLSelectElement).value);
    }

    if (!profileId || Number.isNaN(profileId)) {
      cErr.textContent = 'Employee profile is required';
      cErr.classList.remove('hidden');
      return;
    }

    const payload: any = {
      profileId,
      type: (root.querySelector('#cType') as HTMLSelectElement).value,
      reason: (root.querySelector('#cReason') as HTMLInputElement).value || undefined,
      noticeDate: new Date((root.querySelector('#cNotice') as HTMLInputElement).value).toISOString(),
      lastWorkDate: new Date((root.querySelector('#cLast') as HTMLInputElement).value).toISOString(),
      requiredNoticeDays: (root.querySelector('#cReq') as HTMLInputElement).value
        ? Number((root.querySelector('#cReq') as HTMLInputElement).value)
        : undefined,
    };

    try {
      const created = await apiRequest('POST', '/departures', payload);
      toast('Departure created', 'success');
      closeModal();
      window.location.hash = `#departure/${created.id}`;
    } catch (err: any) {
      cErr.textContent = err?.message || 'Failed to create departure';
      cErr.classList.remove('hidden');
    }
  });

  await state.render();
}
