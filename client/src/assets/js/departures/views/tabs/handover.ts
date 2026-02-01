import { apiRequest } from '../../api.js';
import { escapeHtml, toast } from '../../ui.js';
import type { CurrentUser } from '../../auth.js';

function canUpsert(role: string): boolean {
  return role === 'MANAGER' || role === 'HR_ADMIN' || role === 'SYSTEM_ADMIN';
}

export async function renderHandover(root: HTMLElement, departureId: number, user: CurrentUser, dep: any): Promise<void> {
  const plan = dep.handoverPlan;

  root.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <div class="border border-borderColor rounded-[10px] p-3">
        <h6 class="mb-1">Current plan</h6>
        <div class="text-sm text-gray-700">
          <div><span class="text-gray-500">Assignee (ProfileId):</span> ${escapeHtml(plan?.assigneeId ?? '-')}</div>
          <div><span class="text-gray-500">Completed:</span> ${plan?.completed ? 'Yes' : 'No'}</div>
          <div class="mt-2"><span class="text-gray-500">Notes:</span> ${escapeHtml(plan?.notes || '')}</div>
          <div class="mt-2">
            <div class="text-xs text-gray-500">Tasks (JSON)</div>
            <pre class="mt-1 text-xs bg-gray-50 border border-borderColor rounded-[10px] p-3 overflow-x-auto">${escapeHtml(JSON.stringify(plan?.tasks || [], null, 2))}</pre>
          </div>
        </div>
      </div>

      <div class="border border-borderColor rounded-[10px] p-3">
        <h6 class="mb-1">Actions</h6>

        <div class="mt-2 ${canUpsert(user.role) ? '' : 'hidden'}">
          <div class="text-xs text-gray-500 mb-2">Create / update plan</div>
          <form id="upsert" class="space-y-2">
            <input id="assigneeId" type="number" min="1" required class="bg-white border-borderColor text-gray-900 text-sm rounded-input block w-full py-2 px-2.5 h-[38px]" placeholder="Assignee Profile ID" value="${plan?.assigneeId ?? ''}" />
            <input id="notes" class="bg-white border-borderColor text-gray-900 text-sm rounded-input block w-full py-2 px-2.5 h-[38px]" placeholder="Notes" value="${escapeHtml(plan?.notes || '')}" />
            <textarea id="tasks" rows="6" class="bg-white border-borderColor text-gray-900 text-sm rounded-input block w-full py-2 px-2.5 font-mono">${escapeHtml(JSON.stringify(plan?.tasks || [], null, 2))}</textarea>
            <button class="btn btn-primary w-full" type="submit">Save</button>
            <div id="upErr" class="hidden text-sm text-red-600"></div>
          </form>
        </div>

        <div class="mt-4">
          <button id="complete" class="btn btn-primary w-full">Mark completed</button>
          <div class="text-xs text-gray-500 mt-1">Allowed for assignee (by userId) or HR.</div>
        </div>
      </div>
    </div>
  `;

  const complete = root.querySelector('#complete') as HTMLButtonElement;
  complete.addEventListener('click', async () => {
    try {
      await apiRequest('PATCH', `/departures/${departureId}/handover/complete`);
      toast('Handover completed', 'success');
      window.location.hash = `#departure/${departureId}`;
    } catch (e: any) {
      toast(e?.message || 'Failed to complete handover', 'error');
    }
  });

  if (canUpsert(user.role)) {
    const form = root.querySelector('#upsert') as HTMLFormElement;
    const err = root.querySelector('#upErr') as HTMLElement;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      err.classList.add('hidden');

      let tasks: any;
      try {
        tasks = JSON.parse((root.querySelector('#tasks') as HTMLTextAreaElement).value || '[]');
      } catch {
        err.textContent = 'Tasks must be valid JSON';
        err.classList.remove('hidden');
        return;
      }

      const payload = {
        assigneeId: Number((root.querySelector('#assigneeId') as HTMLInputElement).value),
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
