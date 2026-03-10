import { apiRequest } from '../../api.js';
import { escapeHtml, toast } from '../../ui.js';
import type { CurrentUser } from '../../auth.js';
import { fetchAllProfiles, renderProfileOptions } from '../../people.js';

function canUpsert(role: string): boolean {
  return role === 'MANAGER' || role === 'HR_ADMIN' || role === 'SYSTEM_ADMIN';
}

function tasksToMarkdown(tasks: any): string {
  const list = Array.isArray(tasks) ? tasks : [];
  const lines: string[] = [];
  list.forEach((t) => {
    if (t === null || t === undefined) return;
    if (typeof t === 'string' || typeof t === 'number' || typeof t === 'boolean') {
      const s = String(t).trim();
      if (s) lines.push(`- ${s}`);
      return;
    }
    if (typeof t === 'object') {
      const title = String((t as any).title ?? (t as any).task ?? (t as any).name ?? '').trim();
      const details = String((t as any).details ?? (t as any).description ?? '').trim();
      const done = (t as any).completed === true || (t as any).done === true;
      const status = done ? '[x] ' : '';
      if (title && details) lines.push(`- ${status}${title}: ${details}`);
      else if (title) lines.push(`- ${status}${title}`);
      else if (details) lines.push(`- ${status}${details}`);
      else lines.push(`- ${JSON.stringify(t)}`);
    }
  });
  return lines.join('\n');
}

function parseTasksMarkdown(input: string): any[] {
  const lines = String(input || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));

  const tasks: any[] = [];
  lines.forEach((line) => {
    let s = line;
    if (s.startsWith('- ')) s = s.slice(2).trim();
    if (s.startsWith('* ')) s = s.slice(2).trim();

    let completed = false;
    if (s.startsWith('[x]')) {
      completed = true;
      s = s.slice(3).trim();
    } else if (s.startsWith('[ ]')) {
      s = s.slice(3).trim();
    }

    if (!s) return;
    const idx = s.indexOf(':');
    if (idx > 0) {
      const title = s.slice(0, idx).trim();
      const details = s.slice(idx + 1).trim();
      tasks.push({ title, details, completed });
    } else {
      tasks.push({ title: s, completed });
    }
  });

  return tasks;
}

export async function renderHandover(root: HTMLElement, departureId: number, user: CurrentUser, dep: any): Promise<void> {
  const plan = dep.handoverPlan;

  let profiles: any[] = [];
  try {
    profiles = await fetchAllProfiles();
  } catch {
    profiles = [];
  }

  const assigneeProfileId = plan?.assigneeId === undefined || plan?.assigneeId === null ? undefined : Number(plan.assigneeId);
  const assigneeName = assigneeProfileId
    ? String(profiles.find((p: any) => Number(p?.id) === assigneeProfileId)?.fullName ?? '').trim()
    : '';

  const tasksMarkdown = tasksToMarkdown(plan?.tasks);
  const tasksEmpty = !tasksMarkdown.trim();

  root.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <div class="border border-borderColor rounded-[10px] p-3">
        <h6 class="mb-1">Current plan</h6>
        <div class="text-sm text-gray-700">
          <div><span class="text-gray-500">Assignee:</span> ${escapeHtml(assigneeName || (assigneeProfileId ? String(assigneeProfileId) : '-'))}</div>
          <div><span class="text-gray-500">Completed:</span> <span id="completedVal">${plan?.completed ? 'Yes' : 'No'}</span></div>
          <div class="mt-2"><span class="text-gray-500">Notes:</span> ${escapeHtml(plan?.notes || '')}</div>
          <div class="mt-2">
            <div class="text-xs text-gray-500">Tasks</div>
            <div class="mt-1 text-sm bg-gray-50 border border-borderColor rounded-[10px] p-3">
              ${tasksEmpty ? '<div class="text-gray-500">No tasks added.</div>' : `<pre class="whitespace-pre-wrap text-gray-800">${escapeHtml(tasksMarkdown)}</pre>`}
            </div>
          </div>
        </div>
      </div>

      <div class="border border-borderColor rounded-[10px] p-3">
        <h6 class="mb-1">Actions</h6>

        <div class="mt-2 ${canUpsert(user.role) ? '' : 'hidden'}">
          <div class="text-xs text-gray-500 mb-2">Create / update plan</div>
          <form id="upsert" class="space-y-2">
            <select id="assigneeId" required class="bg-white border-borderColor text-gray-900 text-sm rounded-input block w-full py-2 px-2.5 h-[38px]">
              <option value="">Loading...</option>
            </select>
            <input id="notes" class="bg-white border-borderColor text-gray-900 text-sm rounded-input block w-full py-2 px-2.5 h-[38px]" placeholder="Notes" value="${escapeHtml(plan?.notes || '')}" />
            <div>
              <div class="text-xs text-gray-500 mb-1">Tasks (write one task per line)</div>
              <textarea id="tasks" rows="7" class="bg-white border-borderColor text-gray-900 text-sm rounded-input block w-full py-2 px-2.5" placeholder="Example:\n- Prepare handover notes\n- Return laptop\n- Share passwords with manager">${escapeHtml(tasksMarkdown)}</textarea>
            </div>
            <button class="btn btn-primary w-full" type="submit">Save</button>
            <div id="upErr" class="hidden text-sm text-red-600"></div>
          </form>
        </div>

        <div class="mt-4">
          <button id="complete" class="btn btn-primary w-full" ${plan?.completed ? 'disabled' : ''}>${plan?.completed ? 'Completed' : 'Mark completed'}</button>
        </div>
      </div>
    </div>
  `;

  const complete = root.querySelector('#complete') as HTMLButtonElement;
  const completedVal = root.querySelector('#completedVal') as HTMLElement | null;
  complete.addEventListener('click', async () => {
    if (plan?.completed) return;
    try {
      await apiRequest('PATCH', `/departures/${departureId}/handover/complete`);
      toast('Handover completed', 'success');
      if (plan) (plan as any).completed = true;
      if (completedVal) completedVal.textContent = 'Yes';
      complete.textContent = 'Completed';
      complete.disabled = true;
    } catch (e: any) {
      toast(e?.message || 'Failed to complete handover', 'error');
    }
  });

  if (canUpsert(user.role)) {
    const form = root.querySelector('#upsert') as HTMLFormElement;
    const err = root.querySelector('#upErr') as HTMLElement;

    const assigneeSel = root.querySelector('#assigneeId') as HTMLSelectElement | null;
    if (assigneeSel) {
      assigneeSel.innerHTML = renderProfileOptions(profiles, {
        valueField: 'id',
        includeEmpty: { value: '', label: 'Select assignee' },
        selected: plan?.assigneeId ?? null,
        includeUnknownSelected: true,
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      err.classList.add('hidden');

      const tasks = parseTasksMarkdown((root.querySelector('#tasks') as HTMLTextAreaElement).value);

      const payload = {
        assigneeId: Number((root.querySelector('#assigneeId') as HTMLSelectElement).value),
        notes: (root.querySelector('#notes') as HTMLInputElement).value || undefined,
        tasks,
      };

      try {
        await apiRequest('POST', `/departures/${departureId}/handover`, payload);
        toast('Handover saved', 'success');
        window.location.hash = `#departure/${departureId}`;
      } catch (e2: any) {
        err.textContent = e2?.message || 'Failed to save';
        err.classList.remove('hidden');
      }
    });
  }
}
