import { apiRequest } from '../api.js';
import { escapeHtml, toast } from '../utils.js';

export async function renderSurveyTab(root, departureId, user, departure) {
  root.innerHTML = '';

  const survey = departure.exitSurvey;

  const wrap = document.createElement('div');
  wrap.className = 'grid grid-cols-1 lg:grid-cols-2 gap-4';

  const left = document.createElement('div');
  left.className = 'rounded-xl border border-slate-200 p-4';
  left.innerHTML = `
    <div class="text-sm font-semibold text-slate-900">Survey responses</div>
    <div class="mt-3 text-sm text-slate-700" id="responses"></div>
  `;

  const resEl = left.querySelector('#responses');
  if (!survey) {
    resEl.innerHTML = `<div class="text-slate-600">No survey submitted.</div>`;
  } else {
    const entries = Object.entries(survey.responses || {});
    resEl.innerHTML = entries.length
      ? `<div class="space-y-2">${entries
          .map(([k, v]) => `<div class="rounded-lg border border-slate-200 p-3"><div class="text-xs text-slate-500">${escapeHtml(k)}</div><div class="text-sm text-slate-900 mt-1">${escapeHtml(v)}</div></div>`)
          .join('')}</div>`
      : `<div class="text-slate-600">No responses data.</div>`;
  }

  const right = document.createElement('div');
  right.className = 'rounded-xl border border-slate-200 p-4';

  if (user.role !== 'EMPLOYEE') {
    right.innerHTML = `
      <div class="text-sm font-semibold text-slate-900">Submit survey</div>
      <div class="mt-2 text-sm text-slate-600">Only employees can submit the exit survey.</div>
    `;
  } else {
    right.innerHTML = `
      <div class="text-sm font-semibold text-slate-900">Submit survey</div>
      <div class="mt-2 text-sm text-slate-600">Simple JSON-based responses payload.</div>
      <form id="form" class="mt-3 space-y-2">
        <input id="q1" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Q1: What did you like most?" />
        <input id="q2" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Q2: Rating (1-5)" />
        <input id="q3" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Q3: Suggestions" />
        <button class="w-full rounded-lg bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700">Submit</button>
        <div id="err" class="hidden text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3"></div>
      </form>
    `;

    const form = right.querySelector('#form');
    const err = right.querySelector('#err');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      err.classList.add('hidden');
      try {
        const payload = {
          responses: {
            q1: right.querySelector('#q1').value || '',
            q2: right.querySelector('#q2').value || '',
            q3: right.querySelector('#q3').value || '',
          },
        };
        await apiRequest('POST', `/departures/${departureId}/survey`, payload);
        toast('Survey submitted', 'success');
        window.location.hash = `#departure/${departureId}`;
      } catch (e2) {
        err.textContent = e2?.message || 'Failed to submit';
        err.classList.remove('hidden');
      }
    });
  }

  wrap.appendChild(left);
  wrap.appendChild(right);
  root.appendChild(wrap);
}
