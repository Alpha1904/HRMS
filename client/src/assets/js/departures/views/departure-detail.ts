import { apiRequest } from '../api.js';
import { badgeClass, escapeHtml, formatDate, toast } from '../ui.js';
import type { CurrentUser } from '../auth.js';
import { renderChecklist } from './tabs/checklist.js';
import { renderDocuments } from './tabs/documents.js';
import { renderInterview } from './tabs/interview.js';
import { renderSurvey } from './tabs/survey.js';
import { renderHandover } from './tabs/handover.js';
import { renderTimeline } from './tabs/timeline.js';

export async function renderDepartureDetail(
  root: HTMLElement,
  departureId: number,
  user: CurrentUser,
  perms: { canManage: (role: string) => boolean; canSeverance: (role: string) => boolean },
): Promise<void> {
  root.innerHTML = '<div class="p-3 text-sm text-gray-500">Loading...</div>';

  const dep = await apiRequest('GET', `/departures/${departureId}`);

  const allowedNext: Record<string, string[]> = {
    PENDING: ['APPROVED', 'CANCELLED'],
    APPROVED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
  };

  const nextStatuses = allowedNext[String(dep.status)] || [];
  const statusOptions = nextStatuses.length
    ? [`<option value="" selected disabled>Select next status</option>`, ...nextStatuses.map((s) => `<option value="${s}">${s}</option>`)].join('')
    : `<option value="" selected disabled>No further transitions</option>`;

  root.innerHTML = `
    <div class="mb-3">
      <a href="#departures" class="text-primary">← Back to list</a>
    </div>

    <div class="card">
      <div class="card-body">
        <div class="flex md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <h5 class="mb-1">Departure #${dep.id}</h5>
            <div class="text-sm text-gray-500">${escapeHtml(dep.employee?.fullName || `Profile ${dep.employeeId}`)}</div>
            <div class="mt-2 flex flex-wrap gap-2 items-center">
              <span class="inline-flex items-center rounded-full border px-2 py-1 text-xs ${badgeClass(dep.status)}">${escapeHtml(dep.status)}</span>
              <span class="inline-flex items-center rounded-full border px-2 py-1 text-xs bg-gray-50 text-gray-700 border-borderColor">${escapeHtml(dep.type)}</span>
            </div>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <div class="text-xs text-gray-500">Notice</div>
              <div class="text-sm font-medium">${formatDate(dep.noticeDate)}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500">Last day</div>
              <div class="text-sm font-medium">${formatDate(dep.lastWorkDate)}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500">Actual notice days</div>
              <div class="text-sm font-medium">${dep.actualNoticeDays ?? '-'}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500">Checklist</div>
              <div class="text-sm font-medium">${Math.round((dep.checklistCompletion || 0) * 100)}%</div>
            </div>
          </div>
        </div>

        <div class="mt-3 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div class="text-sm text-gray-700">${escapeHtml(dep.reason || '')}</div>

          <div class="flex flex-wrap gap-3">
            <div class="${perms.canManage(user.role) ? '' : 'hidden'}">
              <label class="block mb-1 text-sm font-medium text-title">Change status</label>
              <div class="flex items-center gap-2">
                <select id="statusSel" ${nextStatuses.length ? '' : 'disabled'} class="bg-white border-borderColor text-gray-900 text-sm rounded-input block py-2 px-2.5 h-[38px]">
                  ${statusOptions}
                </select>
                <button id="statusBtn" ${nextStatuses.length ? '' : 'disabled'} class="btn btn-primary">Update</button>
              </div>
            </div>

            <div class="${perms.canSeverance(user.role) ? '' : 'hidden'}">
              <label class="block mb-1 text-sm font-medium text-title">Severance</label>
              <div class="flex items-center gap-2">
                <input id="sevPay" type="number" step="0.01" class="bg-white border-borderColor text-gray-900 text-sm rounded-input block py-2 px-2.5 h-[38px]" value="${dep.severancePay ?? ''}" placeholder="0.00" />
                <label class="flex items-center gap-2 text-sm text-gray-700">
                  <input id="sevApproved" type="checkbox" class="size-4 bg-white border border-borderColor rounded text-primary focus:ring-0" ${dep.severanceApproved ? 'checked' : ''} />
                  Approve
                </label>
                <button id="sevBtn" class="btn btn-primary">Save</button>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4">
          <div class="border border-borderColor rounded-[14px] overflow-hidden bg-white">
            <div class="bg-slate-50/70 border-b border-borderColor p-2">
              <div class="flex flex-wrap gap-2" id="tabs"></div>
            </div>
            <div class="p-3 md:p-4" id="tabContent"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  const statusBtn = root.querySelector('#statusBtn') as HTMLButtonElement | null;
  statusBtn?.addEventListener('click', async () => {
    const status = (root.querySelector('#statusSel') as HTMLSelectElement).value;
    if (!status) {
      toast('Select a valid next status', 'error');
      return;
    }
    try {
      await apiRequest('PATCH', `/departures/${departureId}/status`, { status });
      toast('Status updated', 'success');
      await renderDepartureDetail(root, departureId, user, perms);
    } catch (e: any) {
      toast(e?.message || 'Failed to update status', 'error');
    }
  });

  const sevBtn = root.querySelector('#sevBtn') as HTMLButtonElement | null;
  sevBtn?.addEventListener('click', async () => {
    const sevPayVal = (root.querySelector('#sevPay') as HTMLInputElement).value;
    const sevApproved = (root.querySelector('#sevApproved') as HTMLInputElement).checked;
    try {
      await apiRequest('PATCH', `/departures/${departureId}/severance`, {
        severancePay: sevPayVal === '' ? null : Number(sevPayVal),
        severanceApproved: sevApproved,
      });
      toast('Severance saved', 'success');
      await renderDepartureDetail(root, departureId, user, perms);
    } catch (e: any) {
      toast(e?.message || 'Failed to save severance', 'error');
    }
  });

  const tabs = root.querySelector('#tabs') as HTMLElement;
  const tabContent = root.querySelector('#tabContent') as HTMLElement;

  const defs = [
    { key: 'overview', label: 'Overview' },
    { key: 'checklist', label: 'Checklist' },
    { key: 'documents', label: 'Documents' },
    { key: 'interview', label: 'Exit Interview' },
    { key: 'survey', label: 'Exit Survey' },
    { key: 'handover', label: 'Handover' },
    { key: 'timeline', label: 'Timeline' },
  ];

  const mkBtn = (label: string, key: string) => {
    const b = document.createElement('button');
    b.className =
      'rounded-full border border-borderColor bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-white hover:text-gray-900 transition-colors';
    b.textContent = label;
    b.dataset.key = key;
    return b;
  };

  defs.forEach((d) => tabs.appendChild(mkBtn(d.label, d.key)));

  const activate = async (key: string) => {
    Array.from(tabs.querySelectorAll('button')).forEach((b) => {
      const active = (b as HTMLButtonElement).dataset.key === key;
      b.className = active
        ? 'rounded-full border border-gray-900 bg-gray-900 px-3 py-2 text-sm font-medium text-white transition-colors'
        : 'rounded-full border border-borderColor bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-white hover:text-gray-900 transition-colors';
    });

    tabContent.innerHTML = '';

    if (key === 'overview') {
      tabContent.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="border border-borderColor rounded-[10px] p-3">
            <div class="text-xs text-gray-500">Reason</div>
            <div class="text-sm mt-1">${escapeHtml(dep.reason || '-')}</div>
          </div>
          <div class="border border-borderColor rounded-[10px] p-3">
            <div class="text-xs text-gray-500">Notes</div>
            <div class="text-sm mt-1">${escapeHtml(dep.notes || '-')}</div>
          </div>
        </div>
      `;
      return;
    }

    if (key === 'checklist') return renderChecklist(tabContent, departureId, user);
    if (key === 'documents') return renderDocuments(tabContent, departureId, user);
    if (key === 'interview') return renderInterview(tabContent, departureId, user, dep);
    if (key === 'survey') return renderSurvey(tabContent, departureId, user, dep);
    if (key === 'handover') return renderHandover(tabContent, departureId, user, dep);
    if (key === 'timeline') return renderTimeline(tabContent, departureId);
  };

  tabs.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('button') as HTMLButtonElement | null;
    if (!btn) return;
    void activate(btn.dataset.key || 'overview');
  });

  await activate('overview');
}
