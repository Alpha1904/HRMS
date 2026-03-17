import { apiFetch, getCurrentUser, hasAnyRole, renderPerformanceNav, getUrlParam, showToast } from './core.js';

type Evaluation = any;

type Criteria = {
  id: number;
  name: string;
  description?: string | null;
  weight: number;
  isActive: boolean;
};

type TabKey = 'summary' | 'automatic' | 'criteria' | 'manual' | 'self' | 'objectives';

function getEl<T extends HTMLElement>(id: string) {
  return document.getElementById(id) as T | null;
}

async function loadCriteriaBreakdown(evaluationId: number) {
  return apiFetch(`/performance/evaluations/${evaluationId}/criteria-breakdown`);
}

async function loadConfiguredCriteria() {
  const res = await apiFetch('/performance/criteria');
  return (Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []) as Criteria[];
}

function isTaskCriteria(name?: string | null) {
  return String(name ?? '').toLowerCase().includes('task');
}

function openCriteriaEditModal(open: boolean) {
  const modal = getEl<HTMLDivElement>('criteria-edit-modal');
  if (!modal) return;
  if (open) modal.classList.remove('hidden');
  else modal.classList.add('hidden');
}

function setCriteriaEditForm(row: Partial<Criteria>) {
  (getEl<HTMLInputElement>('criteria-edit-id')!).value = row?.id ? String(row.id) : '';
  (getEl<HTMLInputElement>('criteria-edit-name')!).value = row?.name ?? '';

  const wrap = getEl<HTMLDivElement>('criteria-edit-weight-wrap');
  const input = getEl<HTMLInputElement>('criteria-edit-weight');
  const isTask = isTaskCriteria(row?.name);

  if (wrap) wrap.classList.toggle('hidden', isTask);
  if (input) {
    input.value = row?.weight !== undefined ? String(row.weight) : '';
    input.disabled = isTask;
  }
}

function renderCriteriaBreakdown(breakdown: any, configured?: Criteria[]) {
  const container = getEl<HTMLDivElement>('criteria-breakdown');
  if (!container) return;

  if (!breakdown || typeof breakdown !== 'object') {
    container.innerHTML = '<div class="text-sm text-gray-600">No criteria breakdown available.</div>';
    return;
  }

  const cfg = Array.isArray(configured) ? configured : [];
  const findCfg = (key: string) => cfg.find((c) => String(c.name || '').toLowerCase().includes(key));

  const rows = [
    { key: 'attendance', label: 'Attendance', v: breakdown.attendance, c: findCfg('attendance') },
    { key: 'discipline', label: 'Discipline', v: breakdown.discipline, c: findCfg('discipline') },
    { key: 'task', label: 'Task (objectives completion)', v: breakdown.task, c: findCfg('task') },
  ];

  container.innerHTML = `
    <div class="border border-borderColor rounded bg-white overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="text-left text-xs font-semibold text-gray-600 px-4 py-2">Criteria</th>
            <th class="text-left text-xs font-semibold text-gray-600 px-4 py-2">Score</th>
            <th class="text-left text-xs font-semibold text-gray-600 px-4 py-2">Weight</th>
            <th class="text-left text-xs font-semibold text-gray-600 px-4 py-2">Status</th>
            <th class="text-left text-xs font-semibold text-gray-600 px-4 py-2">Details</th>
            <th class="text-left text-xs font-semibold text-gray-600 px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map((r) => {
              const score = r?.v?.score ?? 0;
              const weight = r?.c?.weight;
              const details = r?.v?.details ?? {};
              const pct = Math.max(0, Math.min(100, Number(score)));

              let detailsText = '';
              if (r.key === 'task') {
                detailsText = `Objectives: ${details.completedObjectives ?? 0}/${details.totalObjectives ?? 0} (${(((details.completionRate ?? 0) as number) * 100).toFixed(0)}%)`;
              } else if (r.key === 'attendance') {
                detailsText = `Absences: ${Number(details.absences ?? 0).toFixed(0)} / Days: ${Number(details.totalDays ?? 0).toFixed(0)}`;
              } else if (r.key === 'discipline') {
                detailsText = `Incidents: ${Number(details.incidents ?? 0).toFixed(0)}`;
              }

              const breakdownWeight = r?.v?.weight;
              const weightText =
                r.key === 'task'
                  ? breakdownWeight === undefined || breakdownWeight === null
                    ? '-'
                    : Number(breakdownWeight).toFixed(2)
                  : weight === undefined || weight === null
                    ? '-'
                    : Number(weight).toFixed(2);

              const statusBadge = r?.c?.isActive
                ? '<span class="inline-flex items-center text-[10px] font-medium px-2 py-1 rounded bg-green-100 text-green-800 border border-green-200">Active</span>'
                : '<span class="inline-flex items-center text-[10px] font-medium px-2 py-1 rounded bg-gray-100 text-gray-700 border border-gray-200">Inactive</span>';

              const idAttr = r?.c?.id ? String(r.c.id) : '';
              const canEdit = r.key === 'attendance' || r.key === 'discipline';
              const actions = idAttr
                ? `
                  <div class="flex items-center gap-2">
                    ${canEdit ? `<button class="crit-act-edit px-2 py-1 text-xs border rounded bg-white hover:bg-dark-transparent" data-id="${idAttr}">Edit</button>` : ''}
                    <button class="crit-act-toggle px-2 py-1 text-xs border rounded bg-white hover:bg-dark-transparent" data-id="${idAttr}">Toggle</button>
                    <button class="crit-act-del px-2 py-1 text-xs border rounded bg-white hover:bg-dark-transparent" data-id="${idAttr}">Delete</button>
                  </div>
                `
                : '';

              return `
                <tr class="border-t border-borderColor">
                  <td class="px-4 py-2 text-sm">${r.label}</td>
                  <td class="px-4 py-2 text-sm">
                    <div class="flex items-center gap-2">
                      <div class="h-2 w-[140px] bg-gray-200 rounded">
                        <div class="h-2 bg-primary rounded" style="width:${pct}%;"></div>
                      </div>
                      <span>${Number(score).toFixed(2)}</span>
                    </div>
                  </td>
                  <td class="px-4 py-2 text-sm">${weightText}</td>
                  <td class="px-4 py-2">${statusBadge}</td>
                  <td class="px-4 py-2 text-sm text-gray-600">${detailsText}</td>
                  <td class="px-4 py-2">${actions}</td>
                </tr>
              `;
            })
            .join('')}
        </tbody>
      </table>
    </div>
  `;
}

async function saveCriteriaWeight(id: number, weight: number) {
  return apiFetch(`/performance/criteria/${id}`, { method: 'PATCH', body: { weight } });
}

async function toggleCriteria(id: number) {
  return apiFetch(`/performance/criteria/${id}/toggle-status`, { method: 'PATCH' });
}

async function deleteCriteria(id: number) {
  return apiFetch(`/performance/criteria/${id}`, { method: 'DELETE' });
}

function setActiveTab(tab: TabKey) {
  const tabs: TabKey[] = ['summary', 'automatic', 'criteria', 'manual', 'self', 'objectives'];
  tabs.forEach((t) => {
    getEl<HTMLDivElement>(`tab-${t}`)?.classList.toggle('hidden', t !== tab);
    getEl<HTMLButtonElement>(`tabbtn-${t}`)?.classList.toggle('bg-primary', t === tab);
    getEl<HTMLButtonElement>(`tabbtn-${t}`)?.classList.toggle('text-white', t === tab);
    getEl<HTMLButtonElement>(`tabbtn-${t}`)?.classList.toggle('bg-white', t !== tab);
  });
}

function fmtDateTime(d: string) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleString();
}

function applyProgressBar(bar: HTMLDivElement, pct: number) {
  const clamped = Math.max(0, Math.min(100, Number(pct) || 0));
  bar.dataset.progress = String(clamped);
  bar.style.background = getProgressColor(clamped);
  bar.style.width = `${clamped}%`;
}

function animateProgressBars(root: ParentNode = document) {
  const bars = root.querySelectorAll<HTMLDivElement>('.progress-bar');
  requestAnimationFrame(() => {
    bars.forEach((bar) => {
      const raw = bar.dataset.progress;
      const pct = raw ? Number(raw) : 0;
      applyProgressBar(bar, pct);
    });
  });
}

function updateProgressBarFromClick(progressContainer: HTMLElement, clickX: number) {
  const rect = progressContainer.getBoundingClientRect();
  const percentage = Math.max(0, Math.min(100, ((clickX - rect.left) / rect.width) * 100));
  const progressBar = progressContainer.querySelector('.progress-bar') as HTMLDivElement;
  const objectiveId = progressContainer.dataset.objectiveId;
  
  if (progressBar && objectiveId) {
    applyProgressBar(progressBar, percentage);
    progressContainer.dataset.currentProgress = String(percentage);
    
    // Update the percentage display
    const percentageDisplay = progressContainer.closest('.mt-4')?.querySelector('.font-semibold.text-gray-700') as HTMLElement;
    if (percentageDisplay) {
      percentageDisplay.textContent = `${Math.round(percentage)}%`;
    }
    
    // Show a toast indicating the new value
    showToast(`Progress updated to ${Math.round(percentage)}%`, 'info');
    
    // Optionally, you could automatically save this or open the log modal
    logObjectiveProgressWithPercentage(Number(objectiveId), Math.round(percentage));
  }
}

function updateObjectiveProgressUI(objectiveId: number, pct: number) {
  const clamped = Math.max(0, Math.min(100, Number(pct) || 0));
  const container = document.querySelector<HTMLElement>(`[data-objective-id="${objectiveId}"]`);
  if (!container) return;

  const bar = container.querySelector<HTMLDivElement>('.progress-bar');
  if (bar) applyProgressBar(bar, clamped);
  container.dataset.currentProgress = String(clamped);

  const wrap = container.closest('.mt-4');
  const percentageDisplay = wrap?.querySelector<HTMLElement>('.font-semibold.text-gray-700');
  if (percentageDisplay) percentageDisplay.textContent = `${Math.round(clamped)}%`;
}

async function logObjectiveProgressWithPercentage(objectiveId: number, percentage: number) {
  const modal = getEl<HTMLDivElement>('obj-log-modal');
  const idInput = getEl<HTMLInputElement>('obj-log-id');
  const noteInput = getEl<HTMLTextAreaElement>('obj-log-note');
  const rateInput = getEl<HTMLInputElement>('obj-log-rate');

  if (!modal || !idInput || !noteInput || !rateInput) return;

  idInput.value = String(objectiveId);
  rateInput.value = String(percentage);
  noteInput.value = `Progress updated to ${percentage}% via progress bar click`;
  modal.classList.remove('hidden');
  noteInput.focus();
}

function renderObjective(obj: any) {
  const status = String(obj.status || '').toUpperCase();
  const badgeBase = 'inline-flex items-center text-[10px] font-medium px-2 py-1 rounded border';
  const badge =
    status === 'COMPLETED'
      ? `${badgeBase} bg-green-100 text-green-800 border-green-200`
      : status === 'IN_PROGRESS'
        ? `${badgeBase} bg-blue-100 text-blue-800 border-blue-200`
        : `${badgeBase} bg-gray-100 text-gray-700 border-gray-200`;

  const progressPct = Math.max(0, Math.min(100, Number(obj.progressRate ?? 0)));

  return `
    <div style="margin-top: 1rem;" class="mt-10 border border-borderColor rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <div class="font-semibold text-gray-900 text-base truncate">${obj.title || ''}</div>
          <div class="text-sm text-gray-600 mt-1 line-clamp-2">${obj.description || ''}</div>
          <div class="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Target: ${obj.targetValue || 'N/A'}
          </div>
        </div>
        <div class="flex flex-col items-end gap-2 flex-shrink-0">
          <span class="${badge}">${status || 'UNKNOWN'}</span>
          <div class="text-xs text-gray-500 font-medium">Weight: ${obj.weight ?? 0}</div>
        </div>
      </div>
      <div class="mt-4">
        <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span class="font-semibold text-gray-700">${progressPct}%</span>
        </div>
        <div class="h-3 w-full bg-gray-200 rounded-full overflow-hidden relative group cursor-pointer" 
             data-objective-id="${obj.id}" 
             data-current-progress="${progressPct}">
          <div class="progress-bar h-full rounded-full transition-all duration-700 ease-out hover:duration-300 group-hover:shadow-lg" 
               style="width: ${progressPct}%; background: ${getProgressColor(progressPct)};" 
               data-progress="${progressPct}"></div>
          <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span class="text-xs font-semibold text-white bg-black/70 px-2 py-1 rounded">Click to update</span>
          </div>
        </div>
      </div>
      <div class="mt-4 flex flex-wrap gap-2">
        <button class="obj-log inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors" data-id="${obj.id}">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
          Log progress
        </button>
        <button class="obj-status inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors" data-id="${obj.id}">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          Update status
        </button>
        <button class="obj-del inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors" data-id="${obj.id}" data-title="${obj.title || ''}" data-description="${obj.description || ''}">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          Delete
        </button>
      </div>
      <div class="mt-4 text-xs text-gray-600 space-y-2">
        ${(Array.isArray(obj.progress) ? obj.progress : [])
          .slice()
          .reverse()
          .slice(0, 5)
          .map((p: any) => `
            <div class="flex items-start gap-2 p-2 bg-gray-50 rounded border-l-2 border-primary">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-gray-700">${fmtDateTime(p.createdAt)}</span>
                  ${p.progressRate !== null && p.progressRate !== undefined ? `<span class="text-xs bg-gray-200 px-1.5 py-0.5 rounded">${p.progressRate}%</span>` : ''}
                </div>
                <div class="text-gray-600 mt-0.5">${p.progressNote || ''}</div>
              </div>
            </div>
          `).join('')}
      </div>
    </div>
  `;
}

function getProgressColor(pct: number): string {
  if (pct >= 80) return 'linear-gradient(90deg, #10b981, #34d399)';
  if (pct >= 50) return 'linear-gradient(90deg, #f59e0b, #fbbf24)';
  return 'linear-gradient(90deg, #ef4444, #f87171)';
}

function fillForms(evaluation: any) {
  const manual = evaluation?.manualReview;
  (getEl<HTMLTextAreaElement>('manual-strengths')!).value = manual?.strengths ?? '';
  (getEl<HTMLTextAreaElement>('manual-weaknesses')!).value = manual?.weaknesses ?? '';
  (getEl<HTMLTextAreaElement>('manual-achievements')!).value = manual?.achievements ?? '';
  (getEl<HTMLTextAreaElement>('manual-recommendations')!).value = manual?.recommendations ?? '';
  (getEl<HTMLInputElement>('manual-score')!).value = manual?.score !== null && manual?.score !== undefined ? String(manual.score) : '';

  const self = evaluation?.selfReview;
  (getEl<HTMLTextAreaElement>('self-comments')!).value = self?.comments ?? '';
  (getEl<HTMLTextAreaElement>('self-achievements')!).value = self?.achievements ?? '';
  (getEl<HTMLTextAreaElement>('self-challenges')!).value = self?.challenges ?? '';
  (getEl<HTMLInputElement>('self-score')!).value = self?.selfScore !== null && self?.selfScore !== undefined ? String(self.selfScore) : '';
}

async function loadEvaluation() {
  const idRaw = getUrlParam('id');
  const id = Number(idRaw);
  if (!idRaw || Number.isNaN(id)) {
    showToast('Missing evaluation id', 'error');
    return null;
  }

  const evaluation = await apiFetch(`/performance/evaluations/${id}`);
  return evaluation;
}

function renderSummary(e: Evaluation) {
  getEl<HTMLSpanElement>('ev-id')!.textContent = String(e.id);
  getEl<HTMLSpanElement>('ev-status')!.textContent = String(e.status);
  getEl<HTMLSpanElement>('ev-employee')!.textContent = String(e.employee?.fullName ?? '');
  getEl<HTMLSpanElement>('ev-dept')!.textContent = String(e.employee?.department ?? '');
  getEl<HTMLSpanElement>('ev-cycle')!.textContent = String(e.cycle?.name ?? '');
  getEl<HTMLSpanElement>('ev-final')!.textContent = e.finalScore === null || e.finalScore === undefined ? '-' : Number(e.finalScore).toFixed(2);
  getEl<HTMLSpanElement>('ev-rank')!.textContent = e.rank === null || e.rank === undefined ? '-' : String(e.rank);

  const auto = e.automaticScore;
  getEl<HTMLSpanElement>('ev-auto')!.textContent = auto?.totalScore === null || auto?.totalScore === undefined ? '-' : Number(auto.totalScore).toFixed(2);

  const manual = e.manualReview;
  getEl<HTMLSpanElement>('ev-manual')!.textContent = manual?.score === null || manual?.score === undefined ? '-' : Number(manual.score).toFixed(2);

  const self = e.selfReview;
  getEl<HTMLSpanElement>('ev-self')!.textContent = self?.selfScore === null || self?.selfScore === undefined ? '-' : Number(self.selfScore).toFixed(2);
}

function renderAutomatic(e: Evaluation) {
  const container = getEl<HTMLDivElement>('auto-breakdown');
  if (!container) return;

  const breakdown = e?.automaticScore?.breakdown;
  if (!breakdown || typeof breakdown !== 'object') {
    container.innerHTML = '<div class="text-sm text-gray-600">No automatic score breakdown available.</div>';
    return;
  }

  const entries = Object.entries(breakdown).filter(([k]) => k !== 'totalScore');

  container.innerHTML = `
    <div class="border border-borderColor rounded bg-white overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="text-left text-xs font-semibold text-gray-600 px-4 py-2">Criteria</th>
            <th class="text-left text-xs font-semibold text-gray-600 px-4 py-2">Score</th>
            <th class="text-left text-xs font-semibold text-gray-600 px-4 py-2">Weight</th>
          </tr>
        </thead>
        <tbody>
          ${entries
            .map(([name, v]: any) => {
              const score = v?.score ?? '';
              const weight = v?.weight ?? '';
              const pct = Math.max(0, Math.min(100, Number(score)));
              return `
                <tr class="border-t border-borderColor">
                  <td class="px-4 py-2 text-sm">${name}</td>
                  <td class="px-4 py-2 text-sm">
                    <div class="flex items-center gap-2">
                      <div class="h-2 w-[140px] bg-gray-200 rounded">
                        <div class="h-2 bg-primary rounded" style="width:${pct}%;"></div>
                      </div>
                      <span>${Number(score).toFixed(2)}</span>
                    </div>
                  </td>
                  <td class="px-4 py-2 text-sm">${Number(weight).toFixed(2)}</td>
                </tr>
              `;
            })
            .join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderObjectives(e: Evaluation) {
  const list = getEl<HTMLDivElement>('obj-list');
  if (!list) return;
  const objectives = Array.isArray(e.objectives) ? e.objectives : [];
  if (!objectives.length) {
    list.innerHTML = '<div class="text-sm text-gray-600">No objectives found.</div>';
    return;
  }
  list.innerHTML = `<div class="space-y-3 gap-3">${objectives.map(renderObjective).join('')}</div>`;

  // Ensure progress bars reflect current percentages
  animateProgressBars(list);
}

async function calculateAutomatic(id: number) {
  await apiFetch(`/performance/evaluations/${id}/calculate-automatic`, { method: 'POST' });
}

async function calculateFinal(id: number) {
  await apiFetch(`/performance/evaluations/${id}/calculate-final-score`, { method: 'POST' });
}

async function submitManual(evaluationId: number) {
  const strengths = (getEl<HTMLTextAreaElement>('manual-strengths')!).value.trim();
  const weaknesses = (getEl<HTMLTextAreaElement>('manual-weaknesses')!).value.trim();
  const achievements = (getEl<HTMLTextAreaElement>('manual-achievements')!).value.trim();
  const recommendations = (getEl<HTMLTextAreaElement>('manual-recommendations')!).value.trim();
  const scoreRaw = (getEl<HTMLInputElement>('manual-score')!).value.trim();

  if (!strengths || !weaknesses) {
    showToast('Strengths and weaknesses are required', 'error');
    return;
  }

  const payload: any = { strengths, weaknesses };
  if (achievements) payload.achievements = achievements;
  if (recommendations) payload.recommendations = recommendations;
  if (scoreRaw) payload.score = Number(scoreRaw);

  await apiFetch(`/performance/evaluations/${evaluationId}/manual-review`, { method: 'POST', body: payload });
}

async function submitSelf(evaluationId: number) {
  const comments = (getEl<HTMLTextAreaElement>('self-comments')!).value.trim();
  const achievements = (getEl<HTMLTextAreaElement>('self-achievements')!).value.trim();
  const challenges = (getEl<HTMLTextAreaElement>('self-challenges')!).value.trim();
  const scoreRaw = (getEl<HTMLInputElement>('self-score')!).value.trim();

  if (!comments) {
    showToast('Comments are required', 'error');
    return;
  }

  const payload: any = { comments };
  if (achievements) payload.achievements = achievements;
  if (challenges) payload.challenges = challenges;
  if (scoreRaw) payload.selfScore = Number(scoreRaw);

  await apiFetch(`/performance/evaluations/${evaluationId}/self-review`, { method: 'POST', body: payload });
}

async function createObjective(evaluationId: number) {
  const title = (getEl<HTMLInputElement>('obj-title')!).value.trim();
  const description = (getEl<HTMLInputElement>('obj-desc')!).value.trim();
  const targetValue = (getEl<HTMLInputElement>('obj-target')!).value.trim();
  const weightRaw = (getEl<HTMLInputElement>('obj-weight')!).value.trim();

  if (!title) {
    showToast('Objective title is required', 'error');
    return;
  }

  const payload: any = { title };
  if (description) payload.description = description;
  if (targetValue) payload.targetValue = targetValue;
  if (weightRaw) payload.weight = Number(weightRaw);

  await apiFetch(`/performance/evaluations/${evaluationId}/objectives`, { method: 'POST', body: payload });
}

async function logObjectiveProgress(objectiveId: number) {
  const modal = getEl<HTMLDivElement>('obj-log-modal');
  const idInput = getEl<HTMLInputElement>('obj-log-id');
  const noteInput = getEl<HTMLTextAreaElement>('obj-log-note');
  const rateInput = getEl<HTMLInputElement>('obj-log-rate');

  if (!modal || !idInput || !noteInput || !rateInput) return;

  idInput.value = String(objectiveId);
  noteInput.value = '';
  rateInput.value = '';
  modal.classList.remove('hidden');
  noteInput.focus();
}

async function submitLogProgress() {
  const idInput = getEl<HTMLInputElement>('obj-log-id');
  const noteInput = getEl<HTMLTextAreaElement>('obj-log-note');
  const rateInput = getEl<HTMLInputElement>('obj-log-rate');

  if (!idInput || !noteInput) return;

  const objectiveId = Number(idInput.value);
  const note = noteInput.value.trim();
  const rateRaw = rateInput?.value?.trim() || '';

  if (!note) {
    showToast('Progress note is required', 'error');
    return;
  }

  const payload: any = { progressNote: note };
  if (rateRaw) payload.progressRate = Number(rateRaw);

  try {
    const created = await apiFetch(`/performance/objectives/${objectiveId}/progress`, { method: 'POST', body: payload });
    if (created?.progressRate !== null && created?.progressRate !== undefined) {
      updateObjectiveProgressUI(objectiveId, Number(created.progressRate));
    }
    showToast('Progress logged', 'success');
    closeObjLogModal();
    const next = await loadEvaluation();
    if (next) renderObjectives(next);
  } catch (err: any) {
    showToast(err?.message || 'Failed to log progress', 'error');
  }
}

function closeObjLogModal() {
  const modal = getEl<HTMLDivElement>('obj-log-modal');
  if (modal) modal.classList.add('hidden');
}

async function updateObjectiveStatus(objectiveId: number) {
  const modal = getEl<HTMLDivElement>('obj-status-modal');
  const idInput = getEl<HTMLInputElement>('obj-status-id');

  if (!modal || !idInput) return;

  idInput.value = String(objectiveId);
  // Reset radio selection
  const radios = document.querySelectorAll<HTMLInputElement>('input[name="obj-status-value"]');
  radios.forEach((r) => (r.checked = false));
  modal.classList.remove('hidden');
}

async function submitUpdateStatus() {
  const idInput = getEl<HTMLInputElement>('obj-status-id');
  if (!idInput) return;

  const objectiveId = Number(idInput.value);
  const selected = document.querySelector<HTMLInputElement>('input[name="obj-status-value"]:checked');

  if (!selected) {
    showToast('Please select a status', 'error');
    return;
  }

  const status = selected.value;

  try {
    await apiFetch(`/performance/objectives/${objectiveId}/status`, { method: 'PATCH', body: { status } });
    showToast('Objective status updated', 'success');
    closeObjStatusModal();
    const next = await loadEvaluation();
    if (next) renderObjectives(next);
  } catch (err: any) {
    showToast(err?.message || 'Failed to update objective status', 'error');
  }
}

function closeObjStatusModal() {
  const modal = getEl<HTMLDivElement>('obj-status-modal');
  if (modal) modal.classList.add('hidden');
}

let pendingDeleteObjectiveId: number | null = null;
let pendingDeleteTitle = '';

async function confirmDeleteObjective(objectiveId: number, title: string, description: string) {
  const modal = getEl<HTMLDivElement>('obj-delete-modal');
  const card = getEl<HTMLDivElement>('obj-delete-card');
  const idInput = getEl<HTMLInputElement>('obj-delete-id');
  const titleEl = getEl<HTMLParagraphElement>('obj-delete-title');
  const descEl = getEl<HTMLParagraphElement>('obj-delete-desc');

  if (!modal) return;

  pendingDeleteObjectiveId = objectiveId;
  pendingDeleteTitle = title;

  if (idInput) idInput.value = String(objectiveId);
  if (titleEl) titleEl.textContent = title || 'Untitled Objective';
  if (descEl) descEl.textContent = description || 'No description provided';

  modal.classList.remove('hidden');
  // Trigger entrance animation
  if (card) {
    card.classList.remove('scale-95', 'opacity-0');
    card.classList.add('scale-100', 'opacity-100');
  }
}

async function submitDeleteObjective() {
  if (!pendingDeleteObjectiveId) return;

  try {
    await apiFetch(`/performance/objectives/${pendingDeleteObjectiveId}`, { method: 'DELETE' });
    showToast('Objective deleted', 'success');
    closeObjDeleteModal();
    const next = await loadEvaluation();
    if (next) renderObjectives(next);
  } catch (err: any) {
    showToast(err?.message || 'Failed to delete objective', 'error');
  }
}

function closeObjDeleteModal() {
  const modal = getEl<HTMLDivElement>('obj-delete-modal');
  const card = getEl<HTMLDivElement>('obj-delete-card');
  if (card) {
    card.classList.remove('scale-100', 'opacity-100');
    card.classList.add('scale-95', 'opacity-0');
  }
  setTimeout(() => {
    if (modal) modal.classList.add('hidden');
    pendingDeleteObjectiveId = null;
    pendingDeleteTitle = '';
  }, 200);
}

function startPolling(evaluationId: number) {
  const intervalMs = 15000;
  window.setInterval(() => {
    apiFetch(`/performance/evaluations/${evaluationId}`)
      .then((e) => {
        renderSummary(e);
        renderAutomatic(e);
        renderObjectives(e);
      })
      .catch(() => undefined);

    Promise.all([loadCriteriaBreakdown(evaluationId), loadConfiguredCriteria()])
      .then(([b, c]) => renderCriteriaBreakdown(b, c))
      .catch(() => undefined);
  }, intervalMs);
}

document.addEventListener('DOMContentLoaded', async () => {
  await renderPerformanceNav('perf-nav');

  const me = await getCurrentUser();
  const isAdmin = hasAnyRole(me.role, ['HR_ADMIN', 'SYSTEM_ADMIN']);
  const isManager = hasAnyRole(me.role, ['MANAGER']);
  const isEmployee = hasAnyRole(me.role, ['EMPLOYEE']);

  const e = await loadEvaluation();
  if (!e) return;
  const evaluationId = Number(e.id);

  renderSummary(e);
  renderAutomatic(e);
  renderObjectives(e);
  fillForms(e);

  try {
    const [b, c] = await Promise.all([loadCriteriaBreakdown(evaluationId), loadConfiguredCriteria()]);
    renderCriteriaBreakdown(b, c);
  } catch {
    // ignore
  }

  getEl<HTMLButtonElement>('btn-auto')?.classList.toggle('hidden', !isAdmin);
  getEl<HTMLButtonElement>('btn-final')?.classList.toggle('hidden', !isAdmin);
  getEl<HTMLButtonElement>('btn-manual-submit')?.classList.toggle('hidden', !(isManager || isAdmin));
  getEl<HTMLButtonElement>('btn-self-submit')?.classList.toggle('hidden', !(isEmployee || isAdmin));

  getEl<HTMLButtonElement>('btn-auto')?.addEventListener('click', async () => {
    try {
      await calculateAutomatic(evaluationId);
      showToast('Automatic score calculated', 'success');
      const next = await loadEvaluation();
      if (next) {
        renderSummary(next);
        renderAutomatic(next);
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to calculate automatic score', 'error');
    }
  });

  getEl<HTMLButtonElement>('btn-final')?.addEventListener('click', async () => {
    try {
      await calculateFinal(evaluationId);
      showToast('Final score calculated', 'success');
      const next = await loadEvaluation();
      if (next) renderSummary(next);
    } catch (err: any) {
      showToast(err?.message || 'Failed to calculate final score', 'error');
    }
  });

  getEl<HTMLButtonElement>('btn-manual-submit')?.addEventListener('click', async () => {
    try {
      await submitManual(evaluationId);
      showToast('Manual review submitted', 'success');
      const next = await loadEvaluation();
      if (next) {
        renderSummary(next);
        fillForms(next);
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to submit manual review', 'error');
    }
  });

  getEl<HTMLButtonElement>('btn-self-submit')?.addEventListener('click', async () => {
    try {
      await submitSelf(evaluationId);
      showToast('Self review submitted', 'success');
      const next = await loadEvaluation();
      if (next) {
        renderSummary(next);
        fillForms(next);
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to submit self review', 'error');
    }
  });

  getEl<HTMLButtonElement>('btn-obj-create')?.addEventListener('click', async () => {
    try {
      await createObjective(evaluationId);
      showToast('Objective created', 'success');
      const next = await loadEvaluation();
      if (next) renderObjectives(next);
    } catch (err: any) {
      showToast(err?.message || 'Failed to create objective', 'error');
    }
  });

  getEl<HTMLDivElement>('obj-list')?.addEventListener('click', async (ev) => {
    const t = ev.target as HTMLElement;
    
    // Handle progress bar clicks
    const progressContainer = t.closest('[data-objective-id]') as HTMLElement;
    if (progressContainer && progressContainer.classList.contains('group')) {
      const rect = progressContainer.getBoundingClientRect();
      const clickX = ev.clientX;
      updateProgressBarFromClick(progressContainer, clickX);
      return;
    }
    
    const logBtn = t.closest<HTMLButtonElement>('.obj-log');
    if (logBtn) {
      const id = Number(logBtn.dataset.id);
      try {
        await logObjectiveProgress(id);
        const next = await loadEvaluation();
        if (next) renderObjectives(next);
      } catch (err: any) {
        showToast(err?.message || 'Failed to log progress', 'error');
      }
      return;
    }

    const statusBtn = t.closest<HTMLButtonElement>('.obj-status');
    if (statusBtn) {
      const id = Number(statusBtn.dataset.id);
      try {
        await updateObjectiveStatus(id);
        const next = await loadEvaluation();
        if (next) renderObjectives(next);
      } catch (err: any) {
        showToast(err?.message || 'Failed to update objective status', 'error');
      }
      return;
    }

    const delBtn = t.closest<HTMLButtonElement>('.obj-del');
    if (delBtn) {
      const id = Number(delBtn.dataset.id);
      const title = delBtn.dataset.title || '';
      const description = delBtn.dataset.description || '';
      if (!Number.isFinite(id) || id <= 0) return;
      confirmDeleteObjective(id, title, description);
      return;
    }
  });

  getEl<HTMLButtonElement>('tabbtn-summary')?.addEventListener('click', () => setActiveTab('summary'));
  getEl<HTMLButtonElement>('tabbtn-automatic')?.addEventListener('click', () => setActiveTab('automatic'));
  getEl<HTMLButtonElement>('tabbtn-criteria')?.addEventListener('click', () => setActiveTab('criteria'));
  getEl<HTMLButtonElement>('tabbtn-manual')?.addEventListener('click', () => setActiveTab('manual'));
  getEl<HTMLButtonElement>('tabbtn-self')?.addEventListener('click', () => setActiveTab('self'));
  getEl<HTMLButtonElement>('tabbtn-objectives')?.addEventListener('click', () => setActiveTab('objectives'));

  document.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement;
    const btn = t.closest<HTMLButtonElement>('button[id^="tabbtn-"]');
    if (!btn?.id) return;
    const key = btn.id.replace('tabbtn-', '') as TabKey;
    const allowed: TabKey[] = ['summary', 'automatic', 'criteria', 'manual', 'self', 'objectives'];
    if (!allowed.includes(key)) return;
    setActiveTab(key);
  });

  getEl<HTMLButtonElement>('criteria-edit-close')?.addEventListener('click', () => openCriteriaEditModal(false));
  getEl<HTMLButtonElement>('criteria-edit-cancel')?.addEventListener('click', () => openCriteriaEditModal(false));
  getEl<HTMLButtonElement>('criteria-edit-save')?.addEventListener('click', async () => {
    const idRaw = (getEl<HTMLInputElement>('criteria-edit-id')!).value.trim();
    const wRaw = (getEl<HTMLInputElement>('criteria-edit-weight')!).value.trim();
    const id = Number(idRaw);
    const w = Number(wRaw);
    if (!idRaw || Number.isNaN(id) || id <= 0) {
      showToast('Invalid criteria id', 'error');
      return;
    }
    if (Number.isNaN(w) || w < 0 || w > 1) {
      showToast('Weight must be between 0 and 1', 'error');
      return;
    }
    try {
      await saveCriteriaWeight(id, w);
      showToast('Criteria updated', 'success');
      openCriteriaEditModal(false);
      const [b, c] = await Promise.all([loadCriteriaBreakdown(evaluationId), loadConfiguredCriteria()]);
      renderCriteriaBreakdown(b, c);
    } catch (err: any) {
      showToast(err?.message || 'Failed to update criteria', 'error');
    }
  });

  getEl<HTMLDivElement>('criteria-breakdown')?.addEventListener('click', async (ev) => {
    const t = ev.target as HTMLElement;

    const editBtn = t.closest<HTMLButtonElement>('.crit-act-edit');
    if (editBtn) {
      const id = Number(editBtn.dataset.id);
      if (!Number.isFinite(id) || id <= 0) return;
      try {
        const all = await loadConfiguredCriteria();
        const row = all.find((c) => c.id === id);
        if (!row) return;
        setCriteriaEditForm(row);
        openCriteriaEditModal(true);
      } catch {
        // ignore
      }
      return;
    }

    const toggleBtn = t.closest<HTMLButtonElement>('.crit-act-toggle');
    if (toggleBtn) {
      const id = Number(toggleBtn.dataset.id);
      if (!Number.isFinite(id) || id <= 0) return;
      try {
        await toggleCriteria(id);
        showToast('Criteria status updated', 'success');
        const [b, c] = await Promise.all([loadCriteriaBreakdown(evaluationId), loadConfiguredCriteria()]);
        renderCriteriaBreakdown(b, c);
      } catch (err: any) {
        showToast(err?.message || 'Failed to toggle criteria', 'error');
      }
      return;
    }

    const delBtn = t.closest<HTMLButtonElement>('.crit-act-del');
    if (delBtn) {
      const id = Number(delBtn.dataset.id);
      if (!Number.isFinite(id) || id <= 0) return;
      const ok = window.confirm('Delete criteria?');
      if (!ok) return;
      try {
        await deleteCriteria(id);
        showToast('Criteria deleted', 'success');
        const [b, c] = await Promise.all([loadCriteriaBreakdown(evaluationId), loadConfiguredCriteria()]);
        renderCriteriaBreakdown(b, c);
      } catch (err: any) {
        showToast(err?.message || 'Failed to delete criteria', 'error');
      }
    }
  });

  setActiveTab('summary');
  startPolling(evaluationId);

  // Modal event handlers for objectives
  getEl<HTMLButtonElement>('obj-log-close')?.addEventListener('click', closeObjLogModal);
  getEl<HTMLButtonElement>('obj-log-cancel')?.addEventListener('click', closeObjLogModal);
  getEl<HTMLButtonElement>('obj-log-save')?.addEventListener('click', submitLogProgress);

  getEl<HTMLInputElement>('obj-log-rate')?.addEventListener('input', (ev) => {
    const idInput = getEl<HTMLInputElement>('obj-log-id');
    if (!idInput?.value) return;
    const objectiveId = Number(idInput.value);
    const v = (ev.target as HTMLInputElement).value;
    if (v === '') return;
    updateObjectiveProgressUI(objectiveId, Number(v));
  });

  getEl<HTMLButtonElement>('obj-status-close')?.addEventListener('click', closeObjStatusModal);
  getEl<HTMLButtonElement>('obj-status-cancel')?.addEventListener('click', closeObjStatusModal);
  getEl<HTMLButtonElement>('obj-status-save')?.addEventListener('click', submitUpdateStatus);

  getEl<HTMLButtonElement>('obj-delete-close')?.addEventListener('click', closeObjDeleteModal);
  getEl<HTMLButtonElement>('obj-delete-cancel')?.addEventListener('click', closeObjDeleteModal);
  getEl<HTMLButtonElement>('obj-delete-confirm')?.addEventListener('click', submitDeleteObjective);

  // Ensure any initial render uses correct progress widths/colors
  setTimeout(() => {
    animateProgressBars(document);
  }, 100);
});
