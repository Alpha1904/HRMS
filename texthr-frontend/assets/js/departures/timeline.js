import { apiRequest } from '../api.js';
import { escapeHtml, formatDate } from '../utils.js';

export async function renderTimelineTab(root, departureId) {
  root.innerHTML = '';

  const dep = await apiRequest('GET', `/departures/${departureId}`);
  const history = dep.history || [];

  const wrap = document.createElement('div');
  wrap.className = 'rounded-xl border border-slate-200 overflow-hidden bg-white';

  const rows = history
    .map((h) => {
      return `
        <tr class="border-t border-slate-200">
          <td class="px-4 py-3 text-sm text-slate-900">${escapeHtml(h.eventType)}</td>
          <td class="px-4 py-3 text-sm text-slate-700"><pre class="text-xs whitespace-pre-wrap">${escapeHtml(JSON.stringify(h.details || {}, null, 2))}</pre></td>
          <td class="px-4 py-3 text-sm text-slate-700">${escapeHtml(h.performedBy?.email || '')}</td>
          <td class="px-4 py-3 text-sm text-slate-700">${escapeHtml(new Date(h.timestamp).toLocaleString())}</td>
        </tr>
      `;
    })
    .join('');

  wrap.innerHTML = `
    <div class="p-4">
      <div class="text-sm font-semibold text-slate-900">Timeline</div>
      <div class="text-sm text-slate-600 mt-1">Audit events for this departure.</div>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full">
        <thead class="bg-slate-50">
          <tr>
            <th class="text-left text-xs font-semibold text-slate-700 px-4 py-2">Event</th>
            <th class="text-left text-xs font-semibold text-slate-700 px-4 py-2">Details</th>
            <th class="text-left text-xs font-semibold text-slate-700 px-4 py-2">By</th>
            <th class="text-left text-xs font-semibold text-slate-700 px-4 py-2">When</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr class="border-t border-slate-200"><td class="px-4 py-6 text-sm text-slate-600" colspan="4">No history.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;

  root.appendChild(wrap);
}
