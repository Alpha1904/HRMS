import { apiRequest } from '../api.js';
import { badgeClass, escapeHtml, formatDate, toast } from '../utils.js';

export async function renderMyTasks(root, user) {
  root.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'mb-4 flex items-center justify-between';
  header.innerHTML = `<div><h2 class="text-lg font-semibold text-slate-900">My Checklist Tasks</h2><p class="text-sm text-slate-600">Tasks assigned to your user ID (${user.id}).</p></div>`;
  root.appendChild(header);

  const container = document.createElement('div');
  container.className = 'bg-white border border-slate-200 rounded-xl overflow-hidden';
  container.innerHTML = `<div class="p-4 text-sm text-slate-600">Loading...</div>`;
  root.appendChild(container);

  const listRes = await apiRequest('GET', '/departures?page=1&limit=50');
  const departures = listRes?.data || [];

  const tasks = [];

  for (const d of departures) {
    try {
      const items = await apiRequest('GET', `/departures/${d.id}/checklist`);
      for (const it of items) {
        if (it.assigneeId === user.id) {
          tasks.push({ departureId: d.id, employee: d.employee, item: it });
        }
      }
    } catch {
      continue;
    }
  }

  const table = document.createElement('div');
  table.className = 'overflow-x-auto';

  const rows = tasks
    .map((t) => {
      const status = t.item.status;
      return `
        <tr class="border-t border-slate-200">
          <td class="px-4 py-3 text-sm text-slate-900">${escapeHtml(t.item.taskName)}</td>
          <td class="px-4 py-3 text-sm text-slate-700">${escapeHtml(t.employee?.fullName || `Profile ${t.employee?.id || ''}`)}</td>
          <td class="px-4 py-3 text-sm text-slate-700">${formatDate(t.item.dueDate) || '-'}</td>
          <td class="px-4 py-3 text-sm">
            <span class="inline-flex items-center rounded-full border px-2 py-1 text-xs ${badgeClass(status)}">${escapeHtml(status)}</span>
          </td>
          <td class="px-4 py-3 text-sm">
            <a class="text-blue-700 hover:underline" href="#departure/${t.departureId}">Open</a>
          </td>
        </tr>
      `;
    })
    .join('');

  container.innerHTML = `
    <div class="p-4 flex items-center justify-between">
      <div class="text-sm text-slate-700">${tasks.length} task(s)</div>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full">
        <thead class="bg-slate-50">
          <tr>
            <th class="text-left text-xs font-semibold text-slate-700 px-4 py-2">Task</th>
            <th class="text-left text-xs font-semibold text-slate-700 px-4 py-2">Employee</th>
            <th class="text-left text-xs font-semibold text-slate-700 px-4 py-2">Due</th>
            <th class="text-left text-xs font-semibold text-slate-700 px-4 py-2">Status</th>
            <th class="text-left text-xs font-semibold text-slate-700 px-4 py-2">Link</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr class="border-t border-slate-200"><td class="px-4 py-6 text-sm text-slate-600" colspan="5">No assigned tasks found.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}
