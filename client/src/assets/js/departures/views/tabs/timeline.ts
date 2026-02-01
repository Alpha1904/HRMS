import { apiRequest } from '../../api.js';
import { escapeHtml } from '../../ui.js';

export async function renderTimeline(root: HTMLElement, departureId: number): Promise<void> {
  root.innerHTML = '<div class="p-3 text-sm text-gray-500">Loading...</div>';

  const dep = await apiRequest('GET', `/departures/${departureId}`);
  const history = dep.history || [];

  const rows = history
    .map((h: any) => {
      return `
        <tr class="border-b border-borderColor">
          <td class="py-2 px-5 text-sm">${escapeHtml(h.eventType)}</td>
          <td class="py-2 px-5 text-sm"><pre class="text-xs whitespace-pre-wrap">${escapeHtml(JSON.stringify(h.details || {}, null, 2))}</pre></td>
          <td class="py-2 px-5 text-sm">${escapeHtml(h.performedBy?.email || '')}</td>
          <td class="py-2 px-5 text-sm">${escapeHtml(new Date(h.timestamp).toLocaleString())}</td>
        </tr>
      `;
    })
    .join('');

  root.innerHTML = `
    <div class="table-responsive">
      <table class="table table-nowrap">
        <thead>
          <tr>
            <th class="py-2 px-5">Event</th>
            <th class="py-2 px-5">Details</th>
            <th class="py-2 px-5">By</th>
            <th class="py-2 px-5">When</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td class="py-4 px-5 text-sm text-gray-500" colspan="4">No history</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}
