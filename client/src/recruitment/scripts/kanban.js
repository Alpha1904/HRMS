(function () {
  const NS = (window.HRMSRecruitment = window.HRMSRecruitment || {});
  const { toast, setLoading, qs } = NS.ui;
  const {
    listApplicationsForPosting,
    updateApplicationStatus,
    updateApplicationPosition,
    getApplication,
    listInteractions,
    createInteraction,
    updateApplicationFeedback,
    uploadDocument,
    getCandidateDocuments,
  } = NS.api;
  const { resolveUploadUrl } = NS.core;

  // Backend ApplicationStatus enum (Prisma)
  const STATUSES = ['PENDING', 'SCREENING', 'INTERVIEW', 'EXAMINATION', 'REJECTED', 'HIRED'];

  let currentPostingId = null;
  let currentApplications = [];
  let sortables = [];
  let suppressClicksUntil = 0;

  function getCandidateLabel(app) {
    if (app.candidate) return app.candidate.fullName || app.candidate.email || `Candidate #${app.candidate.id}`;
    if (app.profile) return app.profile.fullName || app.profile.user?.email || `Profile #${app.profile.id}`;
    return `Application #${app.id}`;
  }

  function getEmail(app) {
    return app.candidate?.email || app.profile?.user?.email || '';
  }

  function renderBoardSkeleton() {
    const container = qs('#kanban-columns');
    if (!container) return;
    container.innerHTML = '';

    STATUSES.forEach((status) => {
      const col = document.createElement('div');
      col.className = 'min-w-[280px] max-w-[320px] w-[300px] flex flex-col bg-gray-50 border border-gray-300 rounded-xl';

      const header = document.createElement('div');
      header.className = 'px-3 py-3 border-b border-gray-300 flex items-center justify-between';

      const title = document.createElement('div');
      title.className = 'text-sm font-semibold text-black';
      title.textContent = status;

      const badge = document.createElement('div');
      badge.id = `count-${status}`;
      badge.className = 'text-xs px-2 py-0.5 rounded bg-gray-200 text-black';
      badge.textContent = '0';

      header.appendChild(title);
      header.appendChild(badge);

      const body = document.createElement('div');
      body.className = 'kanban-column-body p-3 flex flex-col gap-2';
      body.setAttribute('data-status', status);
      body.id = `list-${status}`;

      col.appendChild(header);
      col.appendChild(body);

      container.appendChild(col);
    });
  }

  function computeBoardPosition(listEl, itemEl) {
    const items = Array.from(listEl.children).filter((n) => n instanceof HTMLElement);
    const idx = items.indexOf(itemEl);

    const prev = idx > 0 ? items[idx - 1] : null;
    const next = idx < items.length - 1 ? items[idx + 1] : null;

    const prevPos = prev ? parseFloat(prev.getAttribute('data-board-position') || '0') : null;
    const nextPos = next ? parseFloat(next.getAttribute('data-board-position') || '0') : null;

    if (prevPos === null && nextPos === null) return 1;
    if (prevPos === null) return (isFinite(nextPos) ? nextPos : 1) - 1;
    if (nextPos === null) return (isFinite(prevPos) ? prevPos : 0) + 1;

    if (!isFinite(prevPos) && !isFinite(nextPos)) return 1;
    if (!isFinite(prevPos)) return nextPos - 1;
    if (!isFinite(nextPos)) return prevPos + 1;

    // midpoint
    const mid = (prevPos + nextPos) / 2;
    if (mid === prevPos || mid === nextPos) return prevPos + 0.0001;
    return mid;
  }

  function renderApplications(applications) {
    currentApplications = applications || [];

    // Clear
    STATUSES.forEach((s) => {
      const list = qs(`#list-${s}`);
      if (list) list.innerHTML = '';
    });

    // Group + render
    const groups = {};
    STATUSES.forEach((s) => (groups[s] = []));
    currentApplications.forEach((a) => {
      const s = a.status;
      if (!groups[s]) groups[s] = [];
      groups[s].push(a);
    });

    STATUSES.forEach((status) => {
      const list = qs(`#list-${status}`);
      const badge = qs(`#count-${status}`);

      const arr = (groups[status] || []).slice().sort((a, b) => (a.boardPosition || 0) - (b.boardPosition || 0));
      if (badge) badge.textContent = String(arr.length);
      if (!list) return;

      arr.forEach((app) => {
        const card = document.createElement('div');
        card.className = [
          'bg-white border border-gray-300 rounded-lg shadow-sm',
          'p-3 cursor-pointer hover:border-[rgb(242,101,34)]',
        ].join(' ');

        card.setAttribute('data-app-id', String(app.id));
        card.setAttribute('data-board-position', String(app.boardPosition ?? 0));

        const title = document.createElement('div');
        title.className = 'text-sm font-semibold text-black';
        title.textContent = getCandidateLabel(app);

        const meta = document.createElement('div');
        meta.className = 'mt-1 text-xs text-gray-600 flex items-center justify-between gap-2';

        const email = document.createElement('div');
        email.className = 'truncate';
        email.textContent = getEmail(app);

        const score = document.createElement('div');
        score.className = 'shrink-0 px-2 py-0.5 rounded bg-gray-100 text-black';
        score.textContent = app.score === null || app.score === undefined ? '—' : `Score ${Math.round(app.score)}`;

        meta.appendChild(email);
        meta.appendChild(score);

        const feedback = document.createElement('div');
        feedback.className = 'mt-2 text-xs text-gray-600 truncate-2';
        feedback.textContent = app.feedback ? app.feedback : 'No feedback yet.';

        card.appendChild(title);
        card.appendChild(meta);
        card.appendChild(feedback);

        card.addEventListener('click', () => {
          if (Date.now() < suppressClicksUntil) return;
          openApplicationDetails(app.id);
        });

        list.appendChild(card);
      });
    });
  }

  function destroySortables() {
    sortables.forEach((s) => {
      try {
        s.destroy();
      } catch {
        // ignore
      }
    });
    sortables = [];
  }

  function initSortables() {
    if (typeof Sortable === 'undefined') {
      toast('SortableJS not loaded.', 'error');
      return;
    }

    destroySortables();

    STATUSES.forEach((status) => {
      const list = qs(`#list-${status}`);
      if (!list) return;

      const sortable = new Sortable(list, {
        group: 'kanban',
        animation: 150,
        ghostClass: 'kanban-ghost',
        chosenClass: 'kanban-chosen',
        dragClass: 'shadow-lg',
        emptyInsertThreshold: 24,
        fallbackOnBody: true,
        forceFallback: true,
        onStart: () => {
          // Prevent the click handler from firing right after a drag.
          suppressClicksUntil = Date.now() + 800;
        },
        onEnd: async (evt) => {
          suppressClicksUntil = Date.now() + 800;
          const item = evt.item;
          const appId = parseInt(item.getAttribute('data-app-id') || '0', 10);
          if (!appId) return;

          const fromStatus = evt.from.getAttribute('data-status');
          const toStatus = evt.to.getAttribute('data-status');

          try {
            setLoading(true, 'Updating application…');

            if (fromStatus !== toStatus) {
              // Some browsers may report null if dropped outside; ignore.
              if (!toStatus) return;
              await updateApplicationStatus(appId, toStatus);
              // Reset position by computing new float based on current DOM order.
              const newPos = computeBoardPosition(evt.to, item);
              await updateApplicationPosition(appId, newPos);
            } else {
              const newPos = computeBoardPosition(evt.to, item);
              await updateApplicationPosition(appId, newPos);
            }

            await loadBoard(currentPostingId);
            toast('Application updated.', 'success');
          } catch (e) {
            toast(e.message || 'Failed to update application.', 'error');
            // Re-render from source of truth
            await loadBoard(currentPostingId);
          } finally {
            setLoading(false);
          }
        },
      });

      sortables.push(sortable);
    });
  }

  async function loadBoard(postingId) {
    currentPostingId = postingId;

    try {
      setLoading(true, 'Loading applications…');
      const res = await listApplicationsForPosting(postingId, { page: 1, limit: 200 });
      const data = res && res.data ? res.data : [];

      renderBoardSkeleton();
      renderApplications(data);
      initSortables();

      const el = qs('#kanban-empty');
      if (el) el.classList.toggle('hidden', data.length !== 0);

      return data;
    } catch (e) {
      toast(e.message || 'Failed to load applications.', 'error');
      return [];
    } finally {
      setLoading(false);
    }
  }

  // Application details
  async function openApplicationDetails(appId) {
    const modal = qs('#application-modal');
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');

    qs('#application-modal-body').innerHTML = '';

    try {
      setLoading(true, 'Loading application…');
      const app = await getApplication(appId);

      const body = qs('#application-modal-body');
      if (!body) return;

      const name = getCandidateLabel(app);
      const email = getEmail(app);

      const resumeUrl = app.document?.uploadUrl ? resolveUploadUrl(app.document.uploadUrl) : '';

      body.innerHTML = `
        <div class="flex flex-col gap-4">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="text-lg font-semibold text-black">${escapeHtml(name)}</div>
              <div class="text-sm text-gray-600">${escapeHtml(email || '')}</div>
              <div class="mt-2 text-xs text-gray-500">Status: <span class="font-medium">${escapeHtml(app.status || '')}</span></div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div class="border border-gray-300 rounded-lg p-3">
              <div class="text-sm font-semibold text-black">Feedback</div>
              <form id="feedback-form" class="mt-2 flex flex-col gap-2">
                <textarea id="feedback-text" class="w-full min-h-[110px] rounded border border-gray-300 bg-white px-3 py-2 text-sm" placeholder="Write feedback…">${escapeHtml(app.feedback || '')}</textarea>
                <div class="flex items-center gap-2">
                  <input id="feedback-score" type="number" min="0" max="100" class="w-28 rounded border border-gray-300 bg-white px-3 py-2 text-sm" placeholder="Score" value="${app.score === null || app.score === undefined ? '' : String(app.score)}" />
                  <button class="ml-auto px-3 py-2 rounded bg-[rgb(242,101,34)] hover:bg-[rgb(220,90,30)] text-white text-sm" type="submit">Save</button>
                </div>
              </form>
            </div>

            <div class="border border-gray-300 rounded-lg p-3">
              <div class="text-sm font-semibold text-black">Add interaction</div>
              <form id="interaction-form" class="mt-2 flex flex-col gap-2">
                <select id="interaction-type" class="rounded border border-gray-300 bg-white px-3 py-2 text-sm">
                  <option value="NOTE">NOTE</option>
                  <option value="EMAIL">EMAIL</option>
                  <option value="INTERVIEW_INVITE">INTERVIEW_INVITE</option>
                </select>
                <textarea id="interaction-content" class="w-full min-h-[110px] rounded border border-gray-300 bg-white px-3 py-2 text-sm" placeholder="Content…"></textarea>
                <div class="flex">
                  <button class="ml-auto px-3 py-2 rounded bg-[rgb(242,101,34)] hover:bg-[rgb(220,90,30)] text-white text-sm" type="submit">Add</button>
                </div>
              </form>
            </div>
          </div>

          <div class="border border-gray-300 rounded-lg p-3">
            <div class="text-sm font-semibold text-black">Resume or CV</div>
            <div id="candidate-resume" class="mt-2">
              <div class="text-sm text-gray-500">Loading resume...</div>
            </div>
          </div>

          <div class="border border-gray-300 rounded-lg p-3">
            <div class="text-sm font-semibold text-black">Interactions</div>
            <div id="interactions-list" class="mt-2 flex flex-col gap-2"></div>
          </div>
        </div>
      `;

      const resumeLink = qs('#resume-link');
      if (resumeLink && resumeUrl) resumeLink.href = resumeUrl;

      // Load interactions
      const interactions = await listInteractions(app.id);
      renderInteractions(interactions);

      // Load candidate documents (resume/CV)
      await loadCandidateDocuments(app.candidateId);

      wireDetailsForms(app);
    } catch (e) {
      toast(e.message || 'Failed to load application.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function renderInteractions(interactions) {
    const list = qs('#interactions-list');
    if (!list) return;
    list.innerHTML = '';

    const arr = Array.isArray(interactions) ? interactions : [];
    if (!arr.length) {
      list.innerHTML = '<div class="text-sm text-gray-500">No interactions yet.</div>';
      return;
    }

    arr.forEach((it) => {
      const row = document.createElement('div');
      row.className = 'rounded border border-gray-300 bg-white p-3';

      const top = document.createElement('div');
      top.className = 'flex items-center justify-between gap-2';

      const type = document.createElement('div');
      type.className = 'text-xs font-semibold text-black';
      type.textContent = it.type || 'NOTE';

      const date = document.createElement('div');
      date.className = 'text-xs text-gray-500';
      date.textContent = it.createdAt ? new Date(it.createdAt).toLocaleString() : '';

      const content = document.createElement('div');
      content.className = 'mt-2 text-sm text-black whitespace-pre-wrap';
      content.textContent = it.content || '';

      top.appendChild(type);
      top.appendChild(date);
      row.appendChild(top);
      row.appendChild(content);
      list.appendChild(row);
    });
  }

  async function loadCandidateDocuments(candidateId) {
    const container = qs('#candidate-resume');
    if (!container) return;

    try {
      const documents = await getCandidateDocuments(candidateId);
      
      if (!documents || documents.length === 0) {
        container.innerHTML = '<div class="text-sm text-gray-500">No resume or CV found.</div>';
        return;
      }

      // Filter for resume/CV documents
      const resumeDocs = documents.filter(doc => 
        doc.type && (doc.type.toLowerCase().includes('resume') || doc.type.toLowerCase().includes('cv'))
      );

      if (resumeDocs.length === 0) {
        container.innerHTML = '<div class="text-sm text-gray-500">No resume or CV found.</div>';
        return;
      }

      // Display the most recent resume/CV
      const latestDoc = resumeDocs[0];
      const docUrl = latestDoc.uploadUrl ? resolveUploadUrl(latestDoc.uploadUrl) : '';
      
      container.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="text-sm font-medium text-black">${escapeHtml(latestDoc.fileName || 'Document')}</div>
            <div class="text-xs text-gray-500">
              Type: ${escapeHtml(latestDoc.type || 'Unknown')} • 
              Size: ${latestDoc.size ? formatFileSize(latestDoc.size) : 'Unknown'} •
              Uploaded: ${latestDoc.uploadDate ? new Date(latestDoc.uploadDate).toLocaleDateString() : 'Unknown'}
            </div>
          </div>
          <a href="${docUrl}" target="_blank" rel="noreferrer" 
             class="ml-3 px-3 py-2 rounded bg-[rgb(242,101,34)] hover:bg-[rgb(220,90,30)] text-white text-sm ${!docUrl ? 'pointer-events-none opacity-50' : ''}">
            View Resume
          </a>
        </div>
      `;
    } catch (error) {
      console.error('Failed to load candidate documents:', error);
      container.innerHTML = '<div class="text-sm text-gray-500">Failed to load resume.</div>';
    }
  }

  function wireDetailsForms(app) {
    const feedbackForm = qs('#feedback-form');
    if (feedbackForm) {
      feedbackForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
          setLoading(true, 'Saving feedback…');
          const feedback = qs('#feedback-text').value;
          const scoreRaw = qs('#feedback-score').value;
          const payload = {
            feedback: feedback || undefined,
            score: scoreRaw === '' ? undefined : Number(scoreRaw),
          };
          await updateApplicationFeedback(app.id, payload);
          toast('Feedback saved.', 'success');
          await loadBoard(currentPostingId);
        } catch (err) {
          toast(err.message || 'Failed to save feedback.', 'error');
        } finally {
          setLoading(false);
        }
      });
    }

    const interactionForm = qs('#interaction-form');
    if (interactionForm) {
      interactionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          setLoading(true, 'Adding interaction…');
          const type = qs('#interaction-type').value;
          const content = qs('#interaction-content').value;
          if (!content.trim()) {
            toast('Interaction content is required.', 'warn');
            return;
          }
          await createInteraction(app.id, { type, content });
          qs('#interaction-content').value = '';
          const interactions = await listInteractions(app.id);
          renderInteractions(interactions);
          toast('Interaction added.', 'success');
        } catch (err) {
          toast(err.message || 'Failed to add interaction.', 'error');
        } finally {
          setLoading(false);
        }
      });
    }
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function escapeHtml(s) {
    return String(s || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  NS.kanban = {
    STATUSES,
    loadBoard,
    renderBoardSkeleton,
  };
})();
