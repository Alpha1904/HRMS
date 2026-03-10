import { apiRequest } from '../../api.js';
import { escapeHtml, formatDate, toast } from '../../ui.js';
import type { CurrentUser } from '../../auth.js';
import { fetchAllProfiles, renderProfileOptions } from '../../people.js';

function canSchedule(role: string): boolean {
  return role === 'MANAGER' || role === 'HR_ADMIN' || role === 'SYSTEM_ADMIN';
}

export async function renderInterview(root: HTMLElement, departureId: number, user: CurrentUser, dep: any): Promise<void> {
  const current = dep.exitInterview;

  let profiles: any[] = [];
  try {
    profiles = await fetchAllProfiles();
  } catch {
    profiles = [];
  }

  const interviewerId = current?.interviewerId === undefined || current?.interviewerId === null ? undefined : Number(current.interviewerId);
  const interviewerName = interviewerId
    ? String(profiles.find((p: any) => Number(p?.id) === interviewerId)?.fullName ?? '').trim()
    : '';

  root.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <div class="border border-borderColor rounded-[10px] p-3">
        <h6 class="mb-1">Current interview</h6>
        <div class="text-sm text-gray-700">
          <div><span class="text-gray-500">Interviewer:</span> ${escapeHtml(interviewerName || (interviewerId ? String(interviewerId) : '-'))}</div>
          <div><span class="text-gray-500">Scheduled:</span> ${formatDate(current?.scheduledDate) || '-'}</div>
          <div><span class="text-gray-500">Interview date:</span> ${formatDate(current?.interviewDate) || '-'}</div>
          <div class="mt-2"><span class="text-gray-500">Notes:</span> ${escapeHtml(current?.notes || '')}</div>
        </div>
      </div>

      <div class="border border-borderColor rounded-[10px] p-3">
        <h6 class="mb-1">Actions</h6>

        <div class="mt-2 ${canSchedule(user.role) ? '' : 'hidden'}">
          <div class="text-xs text-gray-500 mb-2">Schedule interview</div>
          <form id="sched" class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <select id="interviewerId" required class="bg-white border-borderColor text-gray-900 text-sm rounded-input block w-full py-2 px-2.5 h-[38px]">
              <option value="">Loading...</option>
            </select>
            <input id="scheduledDate" type="datetime-local" required class="bg-white border-borderColor text-gray-900 text-sm rounded-input block w-full py-2 px-2.5 h-[38px]" />
            <button class="btn btn-primary md:col-span-2" type="submit">Schedule</button>
            <div id="schedErr" class="md:col-span-2 hidden text-sm text-red-600"></div>
          </form>
        </div>

        <div class="mt-4">
          <div class="text-xs text-gray-500 mb-2">Conduct interview (interviewer only)</div>
          <form id="conduct" class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input id="interviewDate" type="datetime-local" required class="bg-white border-borderColor text-gray-900 text-sm rounded-input block w-full py-2 px-2.5 h-[38px]" />
            <input id="notes" class="md:col-span-2 bg-white border-borderColor text-gray-900 text-sm rounded-input block w-full py-2 px-2.5 h-[38px]" placeholder="Notes" />
            <button class="btn btn-primary md:col-span-2" type="submit">Save</button>
            <div id="conductErr" class="md:col-span-2 hidden text-sm text-red-600"></div>
          </form>
        </div>
      </div>
    </div>
  `;

  const sched = root.querySelector('#sched') as HTMLFormElement | null;
  const schedErr = root.querySelector('#schedErr') as HTMLElement | null;

  const interviewerSel = root.querySelector('#interviewerId') as HTMLSelectElement | null;
  if (interviewerSel) {
    interviewerSel.innerHTML = renderProfileOptions(profiles, {
      valueField: 'id',
      includeEmpty: { value: '', label: 'Select interviewer' },
      selected: current?.interviewerId ?? null,
      includeUnknownSelected: true,
    });
  }

  sched?.addEventListener('submit', async (e) => {
    e.preventDefault();
    schedErr?.classList.add('hidden');
    try {
      const payload = {
        interviewerId: Number((root.querySelector('#interviewerId') as HTMLSelectElement).value),
        scheduledDate: new Date((root.querySelector('#scheduledDate') as HTMLInputElement).value).toISOString(),
      };
      await apiRequest('POST', `/departures/${departureId}/interview/schedule`, payload);
      toast('Interview scheduled', 'success');
      window.location.hash = `#departure/${departureId}`;
    } catch (e2: any) {
      if (schedErr) {
        schedErr.textContent = e2?.message || 'Failed to schedule';
        schedErr.classList.remove('hidden');
      }
    }
  });

  const conduct = root.querySelector('#conduct') as HTMLFormElement;
  const conductErr = root.querySelector('#conductErr') as HTMLElement;

  conduct.addEventListener('submit', async (e) => {
    e.preventDefault();
    conductErr.classList.add('hidden');
    try {
      const payload = {
        interviewDate: new Date((root.querySelector('#interviewDate') as HTMLInputElement).value).toISOString(),
        notes: (root.querySelector('#notes') as HTMLInputElement).value || '',
      };
      await apiRequest('PATCH', `/departures/${departureId}/interview/conduct`, payload);
      toast('Interview saved', 'success');
      window.location.hash = `#departure/${departureId}`;
    } catch (e2: any) {
      conductErr.textContent = e2?.message || 'Failed to save';
      conductErr.classList.remove('hidden');
    }
  });
}
