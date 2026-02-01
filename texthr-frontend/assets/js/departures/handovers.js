import { apiRequest } from '../api.js';
import { escapeHtml, toast } from '../utils.js';

function canUpsert(role) {
  return role === 'MANAGER' || role === 'HR_ADMIN' || role === 'SYSTEM_ADMIN';
}

export async function renderHandoverTab(root, departureId, user, departure) {
  root.innerHTML = '';

  const plan = departure.handoverPlan;

  const wrap = document.createElement('div');
  wrap.className = 'grid grid-cols-1 lg:grid-cols-2 gap-4';

  const left = document.createElement('div');
  left.className = 'rounded-xl border border-slate-200 p-4';
  left.innerHTML = `
    <div class="text-sm font-semibold text-slate-900">Current plan</div>
    <div class="mt-3 text-sm text-slate-700">
      <div><span class="text-slate-500">Assignee (ProfileId):</span> ${escapeHtml(plan?.assigneeId ?? '-')}</div>
      <div><span class="text-slate-500">Completed:</span> ${plan?.completed ? 'Yes' : 'No'}</div>
      <div class="mt-2"><span class="text-slate-500">Notes:</span> ${escapeHtml(plan?.notes || '')}</div>
      <div class="mt-3">
        <div class="text-xs text-slate-600">Tasks (JSON)</div>
        <pre class="mt-1 text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-x-auto">${escapeHtml(JSON.stringify(plan?.tasks || [], null, 2))}</pre>
      </div>
    </div>
  `;

  const right = document.createElement('div');
  right.className = 'rounded-xl border border-slate-200 p-4';

  right.innerHTML = `
    <div class="text-sm font-semibold text-slate-900">Actions</div>

    <div class="mt-3 ${canUpsert(user.role) ? '' : 'hidden'}">
      <div class="text-xs text-slate-600 mb-2">Create / update plan</div>
      <form id="upsert" class="space-y-2">
        <input id="assigneeId" type="number" min="1" required class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Assignee Profile ID" value="${plan?.assigneeId ?? ''}" />
        <input id="notes" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Notes" value="${escapeHtml(plan?.notes || '')}" />
        <textarea id="tasks" rows="6" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono" placeholder='[{"task":"Walkthrough","status":"pending"}]'>${escapeHtml(JSON.stringify(plan?.tasks || [], null, 2))}</textarea>
        <button class="w-full rounded-lg bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700">Save plan</button>
        <div id="upErr" class="hidden text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3"></div>
      </form>
    </div>

    <div class="mt-6">
      <button id="complete" class="w-full rounded-lg bg-slate-900 px-4 py-2 text-white text-sm hover:bg-slate-800">Mark completed</button>
      <div class="text-xs text-slate-600 mt-2">Allowed for assignee (by userId) or HR.</div>
    </div>
  `;

  wrap.appendChild(left);
  wrap.appendChild(right);
  root.appendChild(wrap);

  if (canUpsert(user.role)) {
    const form = right.querySelector('#upsert');
    const err = right.querySelector('#upErr');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      err.classList.add('hidden');

      let tasks;
      try {
        tasks = JSON.parse(right.querySelector('#tasks').value || '[]');
      } catch {
        err.textContent = 'Tasks must be valid JSON';
        err.classList.remove('hidden');
        return;
      }

      const payload = {
        assigneeId: Number(right.querySelector('#assigneeId').value),
        notes: right.querySelector('#notes').value || undefined,
        tasks,
      };

      try {
        await apiRequest('POST', `/departures/${departureId}/handover`, payload);
        toast('Handover saved', 'success');
        window.location.hash = `#departure/${departureId}`;
      } catch (e2) {
        err.textContent = e2?.message || 'Failed to save';
        err.classList.remove('hidden');
      }
    });
  }

  right.querySelector('#complete').addEventListener('click', async () => {
    try {
      await apiRequest('PATCH', `/departures/${departureId}/handover/complete`);
      toast('Handover completed', 'success');
      window.location.hash = `#departure/${departureId}`;
    } catch (e) {
      toast(e?.message || 'Failed to complete handover', 'error');
    }
  });
}
