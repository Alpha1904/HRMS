import { apiRequest } from '../api.js';
import { escapeHtml, formatDate, toast } from '../utils.js';

function canSchedule(role) {
  return role === 'MANAGER' || role === 'HR_ADMIN' || role === 'SYSTEM_ADMIN';
}

export async function renderInterviewTab(root, departureId, user, departure) {
  root.innerHTML = '';

  const current = departure.exitInterview;

  const box = document.createElement('div');
  box.className = 'grid grid-cols-1 lg:grid-cols-2 gap-4';

  const left = document.createElement('div');
  left.className = 'rounded-xl border border-slate-200 p-4';
  left.innerHTML = `
    <div class="text-sm font-semibold text-slate-900">Current interview</div>
    <div class="mt-3 text-sm text-slate-700">
      <div><span class="text-slate-500">InterviewerId:</span> ${escapeHtml(current?.interviewerId ?? '-')}</div>
      <div><span class="text-slate-500">Scheduled:</span> ${formatDate(current?.scheduledDate) || '-'}</div>
      <div><span class="text-slate-500">Interview date:</span> ${formatDate(current?.interviewDate) || '-'}</div>
      <div class="mt-2"><span class="text-slate-500">Notes:</span> ${escapeHtml(current?.notes || '')}</div>
    </div>
  `;

  const right = document.createElement('div');
  right.className = 'rounded-xl border border-slate-200 p-4';
  right.innerHTML = `
    <div class="text-sm font-semibold text-slate-900">Actions</div>

    <div class="mt-3 ${canSchedule(user.role) ? '' : 'hidden'}">
      <div class="text-xs text-slate-600 mb-2">Schedule interview</div>
      <form id="sched" class="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input id="interviewerId" type="number" min="1" required class="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Interviewer Profile ID" />
        <input id="scheduledDate" type="datetime-local" required class="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button class="md:col-span-2 rounded-lg bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700">Schedule</button>
        <div id="schedErr" class="md:col-span-2 hidden text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3"></div>
      </form>
    </div>

    <div class="mt-6">
      <div class="text-xs text-slate-600 mb-2">Conduct interview (interviewer only)</div>
      <form id="conduct" class="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input id="interviewDate" type="datetime-local" required class="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input id="notes" class="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2" placeholder="Notes" />
        <button class="md:col-span-2 rounded-lg bg-slate-900 px-4 py-2 text-white text-sm hover:bg-slate-800">Save</button>
        <div id="conductErr" class="md:col-span-2 hidden text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3"></div>
      </form>
    </div>
  `;

  box.appendChild(left);
  box.appendChild(right);
  root.appendChild(box);

  if (canSchedule(user.role)) {
    const sched = right.querySelector('#sched');
    const err = right.querySelector('#schedErr');

    sched.addEventListener('submit', async (e) => {
      e.preventDefault();
      err.classList.add('hidden');
      try {
        const payload = {
          interviewerId: Number(right.querySelector('#interviewerId').value),
          scheduledDate: new Date(right.querySelector('#scheduledDate').value).toISOString(),
        };
        await apiRequest('POST', `/departures/${departureId}/interview/schedule`, payload);
        toast('Interview scheduled', 'success');
        window.location.hash = `#departure/${departureId}`;
      } catch (e2) {
        err.textContent = e2?.message || 'Failed to schedule';
        err.classList.remove('hidden');
      }
    });
  }

  const conduct = right.querySelector('#conduct');
  const conductErr = right.querySelector('#conductErr');

  conduct.addEventListener('submit', async (e) => {
    e.preventDefault();
    conductErr.classList.add('hidden');

    try {
      const payload = {
        interviewDate: new Date(right.querySelector('#interviewDate').value).toISOString(),
        notes: right.querySelector('#notes').value || '',
      };
      await apiRequest('PATCH', `/departures/${departureId}/interview/conduct`, payload);
      toast('Interview saved', 'success');
      window.location.hash = `#departure/${departureId}`;
    } catch (e2) {
      conductErr.textContent = e2?.message || 'Failed to save';
      conductErr.classList.remove('hidden');
    }
  });
}
