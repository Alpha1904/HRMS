import { apiRequest } from '../api.js';
import { badgeClass, escapeHtml, formatDate, toast } from '../utils.js';
import { renderChecklistTab } from './checklists.js';
import { renderDocumentsTab } from './documents.js';
import { renderInterviewTab } from './interviews.js';
import { renderSurveyTab } from './surveys.js';
import { renderHandoverTab } from './handovers.js';
import { renderTimelineTab } from './timeline.js';

function canManageDepartures(role) {
  return role === 'HR_ADMIN' || role === 'SYSTEM_ADMIN' || role === 'MANAGER';
}

function canSeverance(role) {
  return role === 'HR_ADMIN' || role === 'SYSTEM_ADMIN';
}

function renderFilters(root, user, state) {
  const wrap = document.createElement('div');
  wrap.className = 'bg-white border border-slate-200 rounded-xl p-4';

  const isEmployee = user.role === 'EMPLOYEE';

  wrap.innerHTML = `
    <div class="flex flex-col gap-3">
      <div class="flex flex-wrap gap-2 items-end">
        <div>
          <label class="block text-xs font-medium text-slate-600">Status</label>
          <select id="fltStatus" class="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">All</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600">Type</label>
          <select id="fltType" class="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">All</option>
            <option value="RESIGNATION">RESIGNATION</option>
            <option value="DISMISSAL">DISMISSAL</option>
            <option value="RETIREMENT">RETIREMENT</option>
          </select>
        </div>
        <div class="${isEmployee ? 'hidden' : ''}">
          <label class="block text-xs font-medium text-slate-600">Employee Profile ID</label>
          <input id="fltProfileId" type="number" min="1" class="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm w-48" placeholder="e.g. 421" />
        </div>
        <button id="applyFilters" class="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-white text-sm hover:bg-slate-800">Apply</button>
        <button id="clearFilters" class="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">Clear</button>
      </div>
    </div>
  `;

  const status = wrap.querySelector('#fltStatus');
  const type = wrap.querySelector('#fltType');
  const profileId = wrap.querySelector('#fltProfileId');

  status.value = state.status || '';
  type.value = state.type || '';
  if (profileId) profileId.value = state.profileId || '';

  wrap.querySelector('#applyFilters').addEventListener('click', () => {
    state.status = status.value || '';
    state.type = type.value || '';
    if (profileId) state.profileId = profileId.value || '';
    state.page = 1;
    state.onChange();
  });

  wrap.querySelector('#clearFilters').addEventListener('click', () => {
    state.status = '';
    state.type = '';
    state.profileId = '';
    state.page = 1;
    state.onChange();
  });

  return wrap;
}

function renderCreateModal(user, onCreated) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black/40 hidden items-center justify-center p-4 z-50';

  overlay.innerHTML = `
    <div class="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-lg">
      <div class="p-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <div class="text-sm font-semibold text-slate-900">Create departure</div>
          <div class="text-xs text-slate-600">Uses Employee Profile ID.</div>
        </div>
        <button id="close" class="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Close</button>
      </div>
      <form id="form" class="p-4 space-y-3">
        <div>
          <label class="block text-xs font-medium text-slate-600">Profile ID</label>
          <input id="profileId" type="number" min="1" required class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="e.g. 421" />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600">Type</label>
          <select id="type" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="RESIGNATION">RESIGNATION</option>
            <option value="DISMISSAL">DISMISSAL</option>
            <option value="RETIREMENT">RETIREMENT</option>
          </select>
          <div class="text-xs text-slate-500 mt-1" id="typeHint"></div>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600">Reason</label>
          <input id="reason" type="text" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Optional" />
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-600">Notice date</label>
            <input id="noticeDate" type="date" required class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600">Last work date</label>
            <input id="lastWorkDate" type="date" required class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600">Required notice days</label>
          <input id="requiredNoticeDays" type="number" min="0" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Optional" />
        </div>
        <div class="flex items-center justify-end gap-2 pt-2">
          <button id="submit" type="submit" class="rounded-lg bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700">Create</button>
        </div>
        <div id="err" class="hidden text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3"></div>
      </form>
    </div>
  `;

  const close = () => overlay.classList.add('hidden');
  overlay.querySelector('#close').addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  const form = overlay.querySelector('#form');
  const err = overlay.querySelector('#err');
  const type = overlay.querySelector('#type');
  const hint = overlay.querySelector('#typeHint');

  const updateHint = () => {
    if (user.role === 'EMPLOYEE' && type.value !== 'RESIGNATION') {
      hint.textContent = 'Employees can only create RESIGNATION. Other types will be rejected.';
      hint.className = 'text-xs text-amber-700 mt-1';
    } else {
      hint.textContent = '';
      hint.className = 'text-xs text-slate-500 mt-1';
    }
  };
  type.addEventListener('change', updateHint);
  updateHint();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.classList.add('hidden');

    const payload = {
      profileId: Number(overlay.querySelector('#profileId').value),
      type: overlay.querySelector('#type').value,
      reason: overlay.querySelector('#reason').value.trim() || undefined,
      noticeDate: new Date(overlay.querySelector('#noticeDate').value).toISOString(),
      lastWorkDate: new Date(overlay.querySelector('#lastWorkDate').value).toISOString(),
      requiredNoticeDays: overlay.querySelector('#requiredNoticeDays').value ? Number(overlay.querySelector('#requiredNoticeDays').value) : undefined,
    };

    try {
      const created = await apiRequest('POST', '/departures', payload);
      toast('Departure created', 'success');
      close();
      onCreated(created);
    } catch (e2) {
      err.textContent = e2?.message || 'Failed to create';
      err.classList.remove('hidden');
    }
  });

  return {
    overlay,
    open: () => overlay.classList.remove('hidden'),
    close,
  };
}

export async function renderDeparturesList(root, user) {
  root.innerHTML = '';

  const state = {
    status: '',
    type: '',
    profileId: '',
    page: 1,
    limit: 20,
    onChange: () => load(),
  };

  const top = document.createElement('div');
  top.className = 'mb-4 flex items-start justify-between gap-3 flex-wrap';

  const left = document.createElement('div');
  left.innerHTML = `
    <h2 class="text-lg font-semibold text-slate-900">Departures</h2>
    <p class="text-sm text-slate-600">${user.role === 'EMPLOYEE' ? 'Your departures' : 'Company/team departures'}</p>
  `;

  const right = document.createElement('div');
  right.className = 'flex items-center gap-2';

  const createBtn = document.createElement('button');
  createBtn.className = `rounded-lg bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700 ${canManageDepartures(user.role) || user.role === 'EMPLOYEE' ? '' : 'hidden'}`;
  createBtn.textContent = 'Create departure';

  const modal = renderCreateModal(user, (created) => {
    window.location.hash = `#departure/${created.id}`;
  });

  right.appendChild(createBtn);
  top.appendChild(left);
  top.appendChild(right);

  root.appendChild(top);
  root.appendChild(renderFilters(root, user, state));
  root.appendChild(modal.overlay);

  const tableWrap = document.createElement('div');
  tableWrap.className = 'mt-4 bg-white border border-slate-200 rounded-xl overflow-hidden';
  tableWrap.innerHTML = `<div class="p-4 text-sm text-slate-600">Loading...</div>`;
  root.appendChild(tableWrap);

  createBtn.addEventListener('click', () => modal.open());

  async function load() {
    tableWrap.innerHTML = `<div class="p-4 text-sm text-slate-600">Loading...</div>`;

    const qs = new URLSearchParams();
    if (state.status) qs.set('status', state.status);
    if (state.type) qs.set('type', state.type);
    if (state.profileId) qs.set('profileId', state.profileId);
    qs.set('page', String(state.page));
    qs.set('limit', String(state.limit));

    const res = await apiRequest('GET', `/departures?${qs.toString()}`);
    const rows = res.data || [];
    const pag = res.pagination;

    const bodyRows = rows
      .map((d) => {
        const emp = d.employee;
        const status = d.status;
        return `
          <tr class="border-t border-slate-200">
            <td class="px-4 py-3 text-sm text-slate-900">${escapeHtml(emp?.fullName || `Profile ${emp?.id || ''}`)}</td>
            <td class="px-4 py-3 text-sm text-slate-700">${escapeHtml(d.type)}</td>
            <td class="px-4 py-3 text-sm">
              <span class="inline-flex items-center rounded-full border px-2 py-1 text-xs ${badgeClass(status)}">${escapeHtml(status)}</span>
            </td>
            <td class="px-4 py-3 text-sm text-slate-700">${formatDate(d.noticeDate)}</td>
            <td class="px-4 py-3 text-sm text-slate-700">${formatDate(d.lastWorkDate)}</td>
            <td class="px-4 py-3 text-sm text-slate-700">${d.severancePay ?? '-'}</td>
            <td class="px-4 py-3 text-sm"><a class="text-blue-700 hover:underline" href="#departure/${d.id}">View</a></td>
          </tr>
        `;
      })
      .join('');

    const pager = `
      <div class="p-4 flex items-center justify-between">
        <div class="text-sm text-slate-700">Page ${pag.page} of ${pag.totalPages} • ${pag.total} total</div>
        <div class="flex items-center gap-2">
          <button id="prev" class="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 ${pag.page <= 1 ? 'opacity-50 pointer-events-none' : ''}">Prev</button>
          <button id="next" class="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 ${pag.page >= pag.totalPages ? 'opacity-50 pointer-events-none' : ''}">Next</button>
        </div>
      </div>
    `;

    tableWrap.innerHTML = `
      ${pager}
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead class="bg-slate-50">
            <tr>
              <th class="text-left text-xs font-semibold text-slate-700 px-4 py-2">Employee</th>
              <th class="text-left text-xs font-semibold text-slate-700 px-4 py-2">Type</th>
              <th class="text-left text-xs font-semibold text-slate-700 px-4 py-2">Status</th>
              <th class="text-left text-xs font-semibold text-slate-700 px-4 py-2">Notice</th>
              <th class="text-left text-xs font-semibold text-slate-700 px-4 py-2">Last day</th>
              <th class="text-left text-xs font-semibold text-slate-700 px-4 py-2">Severance</th>
              <th class="text-left text-xs font-semibold text-slate-700 px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${bodyRows || `<tr class="border-t border-slate-200"><td class="px-4 py-6 text-sm text-slate-600" colspan="7">No departures found.</td></tr>`}
          </tbody>
        </table>
      </div>
    `;

    tableWrap.querySelector('#prev')?.addEventListener('click', () => {
      state.page = Math.max(1, state.page - 1);
      load();
    });
    tableWrap.querySelector('#next')?.addEventListener('click', () => {
      state.page = state.page + 1;
      load();
    });
  }

  await load();
}

function tabBtn(label, key) {
  const b = document.createElement('button');
  b.className = 'px-3 py-2 text-sm rounded-lg hover:bg-slate-50 text-slate-700';
  b.textContent = label;
  b.dataset.key = key;
  return b;
}

export async function renderDepartureDetail(root, id, user) {
  root.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'space-y-4';
  root.appendChild(wrapper);

  const departure = await apiRequest('GET', `/departures/${id}`);

  const header = document.createElement('div');
  header.className = 'bg-white border border-slate-200 rounded-xl p-4';

  header.innerHTML = `
    <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
      <div>
        <div class="text-sm text-slate-600">Departure #${departure.id}</div>
        <div class="text-lg font-semibold text-slate-900">${escapeHtml(departure.employee?.fullName || `Profile ${departure.employeeId}`)}</div>
        <div class="mt-2 flex flex-wrap gap-2 items-center">
          <span class="inline-flex items-center rounded-full border px-2 py-1 text-xs ${badgeClass(departure.status)}">${escapeHtml(departure.status)}</span>
          <span class="inline-flex items-center rounded-full border px-2 py-1 text-xs bg-slate-50 text-slate-700 border-slate-200">${escapeHtml(departure.type)}</span>
        </div>
      </div>
      <div class="flex flex-wrap gap-2 items-center">
        <a href="#departures" class="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Back</a>
      </div>
    </div>
  `;

  wrapper.appendChild(header);

  const actions = document.createElement('div');
  actions.className = 'bg-white border border-slate-200 rounded-xl p-4';

  const canManage = canManageDepartures(user.role);

  actions.innerHTML = `
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3 flex-1">
        <div>
          <div class="text-xs text-slate-600">Notice</div>
          <div class="text-sm font-medium text-slate-900">${formatDate(departure.noticeDate)}</div>
        </div>
        <div>
          <div class="text-xs text-slate-600">Last work date</div>
          <div class="text-sm font-medium text-slate-900">${formatDate(departure.lastWorkDate)}</div>
        </div>
        <div>
          <div class="text-xs text-slate-600">Actual notice days</div>
          <div class="text-sm font-medium text-slate-900">${departure.actualNoticeDays ?? '-'}</div>
        </div>
        <div>
          <div class="text-xs text-slate-600">Checklist completion</div>
          <div class="text-sm font-medium text-slate-900">${Math.round((departure.checklistCompletion || 0) * 100)}%</div>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <div class="${canManage ? '' : 'hidden'}">
          <label class="block text-xs font-medium text-slate-600">Change status</label>
          <div class="mt-1 flex items-center gap-2">
            <select id="statusSel" class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="APPROVED">APPROVED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
            <button id="statusBtn" class="rounded-lg bg-slate-900 px-4 py-2 text-white text-sm hover:bg-slate-800">Update</button>
          </div>
        </div>

        <div class="${canSeverance(user.role) ? '' : 'hidden'}">
          <label class="block text-xs font-medium text-slate-600">Severance pay</label>
          <div class="mt-1 flex items-center gap-2">
            <input id="sevPay" type="number" step="0.01" class="rounded-lg border border-slate-300 px-3 py-2 text-sm w-40" value="${departure.severancePay ?? ''}" placeholder="0.00" />
            <label class="inline-flex items-center gap-2 text-sm text-slate-700">
              <input id="sevApproved" type="checkbox" class="rounded border-slate-300" ${departure.severanceApproved ? 'checked' : ''} />
              Approve
            </label>
            <button id="sevBtn" class="rounded-lg bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700">Save</button>
          </div>
        </div>
      </div>
    </div>
    <div class="mt-3 text-sm text-slate-700">${escapeHtml(departure.notes || '')}</div>
  `;

  wrapper.appendChild(actions);

  if (canManage) {
    actions.querySelector('#statusBtn')?.addEventListener('click', async () => {
      const status = actions.querySelector('#statusSel').value;
      try {
        await apiRequest('PATCH', `/departures/${id}/status`, { status });
        toast('Status updated', 'success');
        await renderDepartureDetail(root, id, user);
      } catch (e) {
        toast(e?.message || 'Failed to update status', 'error');
      }
    });
  }

  if (canSeverance(user.role)) {
    actions.querySelector('#sevBtn')?.addEventListener('click', async () => {
      const sevPayVal = actions.querySelector('#sevPay').value;
      const sevApproved = actions.querySelector('#sevApproved').checked;
      try {
        await apiRequest('PATCH', `/departures/${id}/severance`, {
          severancePay: sevPayVal === '' ? null : Number(sevPayVal),
          severanceApproved: sevApproved,
        });
        toast('Severance saved', 'success');
        await renderDepartureDetail(root, id, user);
      } catch (e) {
        toast(e?.message || 'Failed to save severance', 'error');
      }
    });
  }

  const tabs = document.createElement('div');
  tabs.className = 'bg-white border border-slate-200 rounded-xl';

  const tabBar = document.createElement('div');
  tabBar.className = 'p-2 border-b border-slate-200 flex flex-wrap gap-1';

  const content = document.createElement('div');
  content.className = 'p-4';

  const tabDefs = [
    { key: 'overview', label: 'Overview' },
    { key: 'checklist', label: 'Checklist' },
    { key: 'documents', label: 'Documents' },
    { key: 'interview', label: 'Exit Interview' },
    { key: 'survey', label: 'Exit Survey' },
    { key: 'handover', label: 'Handover' },
    { key: 'timeline', label: 'Timeline' },
  ];

  tabDefs.forEach((t) => tabBar.appendChild(tabBtn(t.label, t.key)));
  tabs.appendChild(tabBar);
  tabs.appendChild(content);
  wrapper.appendChild(tabs);

  function activate(key) {
    for (const b of tabBar.querySelectorAll('button')) {
      const active = b.dataset.key === key;
      b.className = active
        ? 'px-3 py-2 text-sm rounded-lg bg-slate-900 text-white'
        : 'px-3 py-2 text-sm rounded-lg hover:bg-slate-50 text-slate-700';
    }
    content.innerHTML = '';

    if (key === 'overview') {
      const box = document.createElement('div');
      box.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';
      box.innerHTML = `
        <div class="rounded-xl border border-slate-200 p-4">
          <div class="text-xs text-slate-600">Reason</div>
          <div class="text-sm text-slate-900 mt-1">${escapeHtml(departure.reason || '-')}</div>
        </div>
        <div class="rounded-xl border border-slate-200 p-4">
          <div class="text-xs text-slate-600">Severance</div>
          <div class="text-sm text-slate-900 mt-1">${departure.severancePay ?? '-'} ${departure.severanceApproved ? '(approved)' : ''}</div>
        </div>
      `;
      content.appendChild(box);
      return;
    }

    if (key === 'checklist') return renderChecklistTab(content, id, user);
    if (key === 'documents') return renderDocumentsTab(content, id, user);
    if (key === 'interview') return renderInterviewTab(content, id, user, departure);
    if (key === 'survey') return renderSurveyTab(content, id, user, departure);
    if (key === 'handover') return renderHandoverTab(content, id, user, departure);
    if (key === 'timeline') return renderTimelineTab(content, id, user);
  }

  activate('overview');

  tabBar.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    activate(btn.dataset.key);
  });
}
