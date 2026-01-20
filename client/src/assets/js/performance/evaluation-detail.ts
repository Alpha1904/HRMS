import { apiFetch, getCurrentUser, hasAnyRole, renderPerformanceNav, getUrlParam, showToast } from './core.js';

type Evaluation = any;

type TabKey = 'summary' | 'automatic' | 'manual' | 'self' | 'objectives';

function getEl<T extends HTMLElement>(id: string) {
  return document.getElementById(id) as T | null;
}

function setActiveTab(tab: TabKey) {
  const tabs: TabKey[] = ['summary', 'automatic', 'manual', 'self', 'objectives'];
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
    <div class="border border-borderColor rounded p-3 bg-white">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="font-semibold text-gray-900">${obj.title || ''}</div>
          <div class="text-sm text-gray-600">${obj.description || ''}</div>
          <div class="text-xs text-gray-500 mt-1">Target: ${obj.targetValue || ''}</div>
        </div>
        <div class="flex flex-col items-end gap-2">
          <span class="${badge}">${status || 'UNKNOWN'}</span>
          <div class="text-xs text-gray-500">Weight: ${obj.weight ?? ''}</div>
        </div>
      </div>
      <div class="mt-3">
        <div class="h-2 w-full bg-gray-200 rounded">
          <div class="h-2 bg-primary rounded" style="width:${progressPct}%;"></div>
        </div>
        <div class="mt-1 text-xs text-gray-500">${progressPct}%</div>
      </div>
      <div class="mt-3 flex flex-wrap gap-2">
        <button class="obj-log px-2 py-1 text-xs border rounded bg-white hover:bg-dark-transparent" data-id="${obj.id}">Log progress</button>
        <button class="obj-status px-2 py-1 text-xs border rounded bg-white hover:bg-dark-transparent" data-id="${obj.id}">Update status</button>
      </div>
      <div class="mt-3 text-xs text-gray-600 space-y-1">
        ${(Array.isArray(obj.progress) ? obj.progress : [])
          .slice()
          .reverse()
          .slice(0, 5)
          .map((p: any) => `<div class="border-t border-borderColor pt-2">${fmtDateTime(p.createdAt)} - ${p.progressNote || ''} ${p.progressRate !== null && p.progressRate !== undefined ? `(${p.progressRate}%)` : ''}</div>`)
          .join('')}
      </div>
    </div>
  `;
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
  list.innerHTML = `<div class="space-y-3">${objectives.map(renderObjective).join('')}</div>`;
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
  const note = window.prompt('Progress note');
  if (note === null) return;
  const rateRaw = window.prompt('Progress % (0-100) (optional)') || '';
  const payload: any = { progressNote: note };
  if (rateRaw.trim()) payload.progressRate = Number(rateRaw);
  await apiFetch(`/performance/objectives/${objectiveId}/progress`, { method: 'POST', body: payload });
}

async function updateObjectiveStatus(objectiveId: number) {
  const status = window.prompt('New status: NOT_STARTED, IN_PROGRESS, COMPLETED');
  if (!status) return;
  await apiFetch(`/performance/objectives/${objectiveId}/status`, { method: 'PATCH', body: { status } });
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
    const logBtn = t.closest<HTMLButtonElement>('.obj-log');
    if (logBtn) {
      const id = Number(logBtn.dataset.id);
      try {
        await logObjectiveProgress(id);
        showToast('Progress logged', 'success');
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
        showToast('Objective status updated', 'success');
        const next = await loadEvaluation();
        if (next) renderObjectives(next);
      } catch (err: any) {
        showToast(err?.message || 'Failed to update objective status', 'error');
      }
    }
  });

  getEl<HTMLButtonElement>('tabbtn-summary')?.addEventListener('click', () => setActiveTab('summary'));
  getEl<HTMLButtonElement>('tabbtn-automatic')?.addEventListener('click', () => setActiveTab('automatic'));
  getEl<HTMLButtonElement>('tabbtn-manual')?.addEventListener('click', () => setActiveTab('manual'));
  getEl<HTMLButtonElement>('tabbtn-self')?.addEventListener('click', () => setActiveTab('self'));
  getEl<HTMLButtonElement>('tabbtn-objectives')?.addEventListener('click', () => setActiveTab('objectives'));

  setActiveTab('summary');
  startPolling(evaluationId);
});
