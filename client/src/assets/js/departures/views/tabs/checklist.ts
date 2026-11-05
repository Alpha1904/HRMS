import { apiRequest } from '../../api.js';
import { badgeClass, escapeHtml, formatDate, toast } from '../../ui.js';
import type { CurrentUser } from '../../auth.js';
import { fetchAllProfiles, renderProfileOptions } from '../../people.js';

function canAdd(role: string): boolean {
  return role === 'MANAGER' || role === 'HR_ADMIN' || role === 'SYSTEM_ADMIN';
}

export async function renderChecklist(root: HTMLElement, departureId: number, user: CurrentUser): Promise<void> {
  root.innerHTML = '<div class="p-3 text-sm text-gray-500">Loading...</div>';

  const items = await apiRequest('GET', `/departures/${departureId}/checklist`);

  root.innerHTML = `
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
      <div>
        <h6 class="mb-1">Checklist</h6>
        <p class="text-sm text-gray-500 mb-0">Tasks for this departure</p>
      </div>
      <div class="${canAdd(user.role) ? '' : 'hidden'}" style="min-width: 520px">
        <form id="addForm" class="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input id="taskName" required class="bg-white border-borderColor text-gray-900 text-sm rounded-input block w-full py-2 px-2.5 h-[38px]" placeholder="Task name" />
          <select id="assigneeId" class="hidden bg-white border-borderColor text-gray-900 text-sm rounded-input block w-full py-2 px-2.5 h-[38px]">
            <option value="">Loading...</option>
          </select>
          <input id="dueDate" type="date" class="bg-white border-borderColor text-gray-900 text-sm rounded-input block w-full py-2 px-2.5 h-[38px]" />
          <button class="btn btn-primary" type="submit">Add</button>
          <input id="description" class="md:col-span-2 bg-white border-borderColor text-gray-900 text-sm rounded-input block w-full py-2 px-2.5 h-[38px]" placeholder="Description (optional)" />
          <div id="err" class="md:col-span-2 hidden text-sm text-red-600"></div>
        </form>
      </div>
    </div>

    <div class="table-responsive mt-3">
      <table class="table table-nowrap">
        <thead>
          <tr>
            <th class="py-2 px-5">Task</th>
            <th class="py-2 px-5">Assignee By</th>
            <th class="py-2 px-5">Due</th>
            <th class="py-2 px-5">Status</th>
            <th class="py-2 px-5">Update</th>
          </tr>
        </thead>
        <tbody id="rows"></tbody>
      </table>
    </div>
  `;

  const rows = root.querySelector('#rows') as HTMLElement;

  let profiles: any[] = [];
  try {
    profiles = await fetchAllProfiles();
  } catch {
    profiles = [];
  }

  const assigneeNameById = new Map<number, string>();
  profiles.forEach((p: any) => {
    const id = Number(p?.userId ?? p?.id);
    const fullName = String(p?.fullName ?? '').trim();
    if (id && fullName) assigneeNameById.set(id, fullName);
  });

  const renderRows = (list: any[]) => {
    rows.innerHTML = (list || [])
      .map((it) => {
        const status = it.status;
        const assigneeId = it.assigneeId === undefined || it.assigneeId === null ? undefined : Number(it.assigneeId);
        const assigneeName = assigneeId ? assigneeNameById.get(assigneeId) : undefined;
        return `
          <tr class="border-b border-borderColor">
            <td class="py-2 px-5">
              <div class="font-medium text-gray-900">${escapeHtml(it.taskName)}</div>
              <div class="text-xs text-gray-500">${escapeHtml(it.description || '')}</div>
            </td>
            <td class="py-2 px-5 text-sm">${escapeHtml(assigneeName || (assigneeId ? String(assigneeId) : '-'))}</td>
            <td class="py-2 px-5 text-sm">${formatDate(it.dueDate) || '-'}</td>
            <td class="py-2 px-5 text-sm">
              <span class="inline-flex items-center rounded-full border px-2 py-1 text-xs ${badgeClass(status)}">${escapeHtml(status)}</span>
            </td>
            <td class="py-2 px-5 text-sm">
              <select class="bg-white border-borderColor text-gray-900 text-sm rounded-input py-2 px-2.5 h-[38px] statusSel" data-id="${it.id}">
                <option value="NOT_STARTED" ${status === 'NOT_STARTED' ? 'selected' : ''}>NOT_STARTED</option>
                <option value="IN_PROGRESS" ${status === 'IN_PROGRESS' ? 'selected' : ''}>IN_PROGRESS</option>
                <option value="COMPLETED" ${status === 'COMPLETED' ? 'selected' : ''}>COMPLETED</option>
                <option value="BLOCKED" ${status === 'BLOCKED' ? 'selected' : ''}>BLOCKED</option>
              </select>
              <button class="btn btn-white ms-2 saveBtn" data-id="${it.id}">Save</button>
            </td>
          </tr>
        `;
      })
      .join('');

    rows.querySelectorAll('.saveBtn').forEach((b) => {
      b.addEventListener('click', async () => {
        const id = Number((b as HTMLElement).getAttribute('data-id'));
        const sel = rows.querySelector(`.statusSel[data-id="${id}"]`) as HTMLSelectElement;
        try {
          await apiRequest('PATCH', `/checklist/${id}`, { status: sel.value });
          toast('Checklist updated', 'success');
        } catch (e: any) {
          toast(e?.message || 'Failed to update checklist', 'error');
        }
      });
    });
  };

  renderRows(items);

  if (canAdd(user.role)) {
    const form = root.querySelector('#addForm') as HTMLFormElement;
    const err = root.querySelector('#err') as HTMLElement;

    const assigneeSel = root.querySelector('#assigneeId') as HTMLSelectElement | null;
    if (assigneeSel) {
      const sessionUserIdRaw = sessionStorage.getItem('currentUserId') || localStorage.getItem('currentUserId');
      const sessionUserId = sessionUserIdRaw ? Number(sessionUserIdRaw) : NaN;
      const effectiveAssigneeId = Number.isFinite(sessionUserId) ? sessionUserId : Number(user.id);

      assigneeSel.innerHTML = renderProfileOptions(profiles, {
        valueField: 'userId',
        includeEmpty: { value: '', label: 'Unassigned' },
        selected: effectiveAssigneeId,
        includeUnknownSelected: true,
      });
      assigneeSel.value = String(effectiveAssigneeId);
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      err.classList.add('hidden');

      const sessionUserIdRaw = sessionStorage.getItem('userId');
      const sessionUserId = sessionUserIdRaw ? Number(sessionUserIdRaw) : NaN;
      const effectiveAssigneeId = Number.isFinite(sessionUserId) ? sessionUserId : Number(user.id);

      const payload: any = {
        taskName: (root.querySelector('#taskName') as HTMLInputElement).value.trim(),
        description: (root.querySelector('#description') as HTMLInputElement).value.trim() || undefined,
        assigneeId: effectiveAssigneeId,
        dueDate: (root.querySelector('#dueDate') as HTMLInputElement).value
          ? new Date((root.querySelector('#dueDate') as HTMLInputElement).value).toISOString()
          : undefined,
      };

      try {
        await apiRequest('POST', `/departures/${departureId}/checklist`, payload);
        toast('Checklist item added', 'success');
        window.location.hash = `#departure/${departureId}`;
      } catch (e2: any) {
        err.textContent = e2?.message || 'Failed to add checklist item';
        err.classList.remove('hidden');
      }
    });
  }
}
