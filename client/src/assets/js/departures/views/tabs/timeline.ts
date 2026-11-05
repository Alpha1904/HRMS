import { apiRequest } from '../../api.js';
import { escapeHtml } from '../../ui.js';
import { fetchAllProfiles } from '../../people.js';

function formatDetailsMarkdown(details: any, profilesById: Map<number, string>): string {
  if (details === null || details === undefined) return '';

  if (typeof details !== 'object') {
    const s = String(details).trim();
    return s ? `- ${s}` : '';
  }

  if (Array.isArray(details)) {
    const lines = details
      .map((v) => String(v ?? '').trim())
      .filter(Boolean)
      .map((v) => `- ${v}`);
    return lines.join('\n');
  }

  const obj = details as Record<string, any>;
  const keys = Object.keys(obj);
  if (!keys.length) return '';

  const labelMap: Record<string, string> = {
    assigneeId: 'Assignee',
    interviewerId: 'Interviewer',
  };

  const lines: string[] = [];
  keys.forEach((k) => {
    const v = obj[k];
    if (v === undefined) return;

    const label = labelMap[k] || k;
    if (v === null) {
      lines.push(`- ${label}: -`);
      return;
    }

    if ((k === 'assigneeId' || k === 'interviewerId') && (typeof v === 'string' || typeof v === 'number')) {
      const id = Number(v);
      const name = Number.isFinite(id) ? profilesById.get(id) : undefined;
      if (name) {
        lines.push(`- ${label}: ${name}`);
      } else {
        lines.push(`- ${label}: ${String(v).trim() || '-'}`);
      }
      return;
    }

    if (Array.isArray(v)) {
      const items = v
        .map((x) => String(x ?? '').trim())
        .filter(Boolean)
        .slice(0, 8);
      if (!items.length) {
        lines.push(`- ${label}: (empty)`);
      } else {
        lines.push(`- ${label}: ${items.join(', ')}${v.length > items.length ? ' …' : ''}`);
      }
      return;
    }

    if (typeof v === 'object') {
      const short = JSON.stringify(v);
      lines.push(`- ${label}: ${short && short.length > 200 ? `${short.slice(0, 200)}…` : short}`);
      return;
    }

    const s = String(v).trim();
    if (!s) return;
    lines.push(`- ${label}: ${s}`);
  });

  return lines.join('\n');
}

export async function renderTimeline(root: HTMLElement, departureId: number): Promise<void> {
  root.innerHTML = '<div class="p-3 text-sm text-gray-500">Loading...</div>';

  const dep = await apiRequest('GET', `/departures/${departureId}`);
  const history = dep.history || [];

  let profiles: any[] = [];
  try {
    profiles = await fetchAllProfiles();
  } catch {
    profiles = [];
  }

  const profilesById = new Map<number, string>();
  profiles.forEach((p: any) => {
    const id = Number(p?.id);
    const fullName = String(p?.fullName ?? '').trim();
    if (id && fullName) profilesById.set(id, fullName);
  });

  const rows = history
    .map((h: any) => {
      const detailsMd = formatDetailsMarkdown(h.details || {}, profilesById);
      const detailsEmpty = !detailsMd.trim();
      return `
        <tr class="border-b border-borderColor">
          <td class="py-2 px-5 text-sm">${escapeHtml(h.eventType)}</td>
          <td class="py-2 px-5 text-sm">
            ${detailsEmpty ? '<span class="text-gray-500">-</span>' : `<pre class="text-xs whitespace-pre-wrap">${escapeHtml(detailsMd)}</pre>`}
          </td>
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
