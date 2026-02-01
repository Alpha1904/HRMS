import { apiRequest } from '../../api.js';
import { escapeHtml, toast } from '../../ui.js';
import type { CurrentUser } from '../../auth.js';

export async function renderSurvey(root: HTMLElement, departureId: number, user: CurrentUser, dep: any): Promise<void> {
  const survey = dep.exitSurvey;

  const responsesHtml = survey
    ? Object.entries(survey.responses || {})
        .map(([k, v]) => {
          return `<div class="border border-borderColor rounded-[10px] p-3"><div class="text-xs text-gray-500">${escapeHtml(k)}</div><div class="text-sm mt-1">${escapeHtml(v)}</div></div>`;
        })
        .join('')
    : '<div class="text-sm text-gray-500">No survey submitted.</div>';

  root.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <div class="border border-borderColor rounded-[10px] p-3">
        <h6 class="mb-1">Survey responses</h6>
        <div class="mt-2 space-y-2">${responsesHtml}</div>
      </div>

      <div class="border border-borderColor rounded-[10px] p-3">
        <h6 class="mb-1">Submit survey</h6>
        ${user.role === 'EMPLOYEE' ? `
          <p class="text-sm text-gray-500">Simple JSON responses payload</p>
          <form id="form" class="mt-2 space-y-2">
            <input id="q1" class="bg-white border-borderColor text-gray-900 text-sm rounded-input block w-full py-2 px-2.5 h-[38px]" placeholder="Q1" />
            <input id="q2" class="bg-white border-borderColor text-gray-900 text-sm rounded-input block w-full py-2 px-2.5 h-[38px]" placeholder="Q2" />
            <input id="q3" class="bg-white border-borderColor text-gray-900 text-sm rounded-input block w-full py-2 px-2.5 h-[38px]" placeholder="Q3" />
            <button class="btn btn-primary w-full" type="submit">Submit</button>
            <div id="err" class="hidden text-sm text-red-600"></div>
          </form>
        ` : `<p class="text-sm text-gray-500">Only employees can submit.</p>`}
      </div>
    </div>
  `;

  if (user.role !== 'EMPLOYEE') return;

  const form = root.querySelector('#form') as HTMLFormElement;
  const err = root.querySelector('#err') as HTMLElement;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.classList.add('hidden');

    try {
      const payload = {
        responses: {
          q1: (root.querySelector('#q1') as HTMLInputElement).value || '',
          q2: (root.querySelector('#q2') as HTMLInputElement).value || '',
          q3: (root.querySelector('#q3') as HTMLInputElement).value || '',
        },
      };
      await apiRequest('POST', `/departures/${departureId}/survey`, payload);
      toast('Survey submitted', 'success');
      window.location.hash = `#departure/${departureId}`;
    } catch (e2: any) {
      err.textContent = e2?.message || 'Failed to submit';
      err.classList.remove('hidden');
    }
  });
}
