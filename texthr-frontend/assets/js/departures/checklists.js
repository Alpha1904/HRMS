import { apiRequest } from '../api.js';
import { badgeClass, escapeHtml, formatDate, toast } from '../utils.js';

function canAdd(role) {
  return role === 'MANAGER' || role === 'HR_ADMIN' || role === 'SYSTEM_ADMIN';
}

export async function renderChecklistTab(root, departureId, user) {
  root.innerHTML = '';

  const top = document.createElement('div');
  top.className = 'flex flex-col md:flex-row md:items-end md:justify-between gap-3';
  top.innerHTML = `
    <div>
      <div class="text-sm font-semibold text-slate-900">Checklist</div>
      <div class="text-sm text-slate-600">Tasks for this departure.</div>
    </div>
  `;

  const addBox = document.createElement('div');
  addBox.className = canAdd(user.role) ? 'w-full md:w-[520px]' : 'hidden';
  addBox.innerHTML = `
    <form id="addForm" class="grid grid-cols-1 md:grid-cols-2 gap-2">
      <input id="taskName" required class="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Task name" />
      <input id="assigneeId" type="number" min="1" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Assignee User ID (optional)" />
      <input id="dueDate" type="date" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      <button class="rounded-lg bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700">Add</button>
      <input id="description" class="md:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Description (optional)" />
      <div id="err" class="md:col-span-2 hidden text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3"></div>
    </form>
  `;

  top.appendChild(addBox);
  root.appendChild(top);

  const listWrap = document.createElement('div');
  listWrap.className = 'mt-4 rounded-xl border border-slate-200 overflow-hidden';
  listWrap.innerHTML = `<div class="p-4 text-sm text-slate-600">Loading...</div>`;
  root.appendChild(listWrap);

  const load = async () => {
    const items = await apiRequest('GET', `/departures/${departureId}/checklist`);

    const rows = items
      .map((it) => {
        const status = it.status;
        return `
          <tr class="border-t border-slate-200">
            <td class="px-4 py-3 text-sm text-slate-900">${escapeHtml(it.taskName)}</td>
            <td class="px-4 py-3 text-sm text-slate-700">${escapeHtml(it.description || '')}</td>
            <td class="px-4 py-3 text-sm text-slate-700">${it.assigneeId ?? '-'}</td>
            <td class="px-4 py-3 text-sm text-slate-700">${formatDate(it.dueDate) || '-'}</td>
            <td class="px-4 py-3 text-sm">
              <span class="inline-flex items-center rounded-full border px-2 py-1 text-xs ${badgeClass(status)}">${escapeHtml(status)}</span>
            </td>
            <td class="px-4 py-3 text-sm">
              <select data-item-id="${it.id}" class="statusSel rounded-lg border border-slate-300 px-2 py-1 text-sm">
                <option value="NOT_STARTED" ${status === 'NOT_STARTED' ? 'selected' : ''}>NOT_STARTED</option>
                <option value="IN_PROGRESS" ${status === 'IN_PROGRESS' ? 'selected' : ''}>IN_PROGRESS</option>
                <option value="COMPLETED" ${status === 'COMPLETED' ? 'selected' : ''}>COMPLETED</option>
                <option value="BLOCKED" ${status === 'BLOCKED' ? 'selected' : ''}>BLOCKED</option>
              </select>
              <button data-item-id="${it.id}" class="ml-2 updBtn rounded-lg border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50">Save</button>
            </td>
          </tr>
        `;
      })
      .join('');

    listWrap.innerHTML = `
      <div class="overflow-x-auto bg-white">
        <table class="min-w-full">
          <thead class="bg-slate-50">
            <tr>
              <th class="text-left text-xs font-semibold text-slate-700 px-4 py-2">Task</th>
              <th class="text-left text-xs font-semibold text-slate-700 px-4 py-2">Description</th>
              <th class="text-left text-xs font-semibold text-slate-700 px-4 py-2">Assignee (UserId)</th>
              <th class="text-left text-xs font-semibold text-slate-700 px-4 py-2">Due</th>
              <th class="text-left text-xs font-semibold text-slate-700 px-4 py-2">Status</th>
              <th class="text-left text-xs font-semibold text-slate-700 px-4 py-2">Update</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr class="border-t border-slate-200"><td class="px-4 py-6 text-sm text-slate-600" colspan="6">No checklist items.</td></tr>`}
          </tbody>
        </table>
      </div>
    `;

    listWrap.querySelectorAll('.updBtn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const itemId = Number(btn.getAttribute('data-item-id'));
        const sel = listWrap.querySelector(`.statusSel[data-item-id="${itemId}"]`);
        const status = sel.value;
        try {
          await apiRequest('PATCH', `/checklist/${itemId}`, { status });
          toast('Checklist item updated', 'success');
          await load();
        } catch (e) {
          toast(e?.message || 'Failed to update item', 'error');
        }
      });
    });
  };

  if (canAdd(user.role)) {
    const form = addBox.querySelector('#addForm');
    const err = addBox.querySelector('#err');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      err.classList.add('hidden');

      const payload = {
        taskName: addBox.querySelector('#taskName').value.trim(),
        description: addBox.querySelector('#description').value.trim() || undefined,
        assigneeId: addBox.querySelector('#assigneeId').value ? Number(addBox.querySelector('#assigneeId').value) : undefined,
        dueDate: addBox.querySelector('#dueDate').value ? new Date(addBox.querySelector('#dueDate').value).toISOString() : undefined,
      };

      try {
        await apiRequest('POST', `/departures/${departureId}/checklist`, payload);
        toast('Checklist item added', 'success');
        form.reset();
        await load();
      } catch (e2) {
        err.textContent = e2?.message || 'Failed to add item';
        err.classList.remove('hidden');
      }
    });
  }

  await load();
}
