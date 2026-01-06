(function () {
  const NS = (window.HRMSRecruitment = window.HRMSRecruitment || {});
  const { toast, setLoading, qs } = NS.ui;
  const {
    listCandidates,
    getCandidate,
    createCandidate,
    updateCandidate,
    deactivateCandidate,
  } = NS.api;
  const { resolveUploadUrl } = NS.core;

  let state = {
    page: 1,
    limit: 10,
    fullName: '',
    email: '',
    data: [],
    meta: null,
  };

  async function loadCandidates() {
    try {
      setLoading(true, 'Loading candidates…');
      const res = await listCandidates({
        page: state.page,
        limit: state.limit,
        fullName: state.fullName || undefined,
        email: state.email || undefined,
      });
      state.data = res.data || [];
      state.meta = res.meta || null;
      renderTable();
      renderPagination();
    } catch (e) {
      toast(e.message || 'Failed to load candidates.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function renderTable() {
    const tbody = qs('#cand-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!state.data.length) {
      tbody.innerHTML = '<tr><td class="px-4 py-4 text-sm text-slate-500" colspan="5">No candidates found.</td></tr>';
      return;
    }

    state.data.forEach((c) => {
      const appsCount = c._count?.applications ?? 0;
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-200 dark:border-slate-800';
      tr.innerHTML = `
        <td class="px-4 py-3">
          <div class="text-sm font-semibold text-slate-900 dark:text-slate-100">${escapeHtml(c.fullName)}</div>
          <div class="text-xs text-slate-500 dark:text-slate-400">Status: ${escapeHtml(c.status || '')}</div>
        </td>
        <td class="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">${escapeHtml(c.email)}</td>
        <td class="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">${escapeHtml(c.phone || '—')}</td>
        <td class="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">${appsCount}</td>
        <td class="px-4 py-3">
          <div class="flex justify-end gap-2">
            <button data-action="view" data-id="${c.id}" class="px-2.5 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs">View</button>
            <button data-action="edit" data-id="${c.id}" class="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs">Edit</button>
            <button data-action="deactivate" data-id="${c.id}" class="px-2.5 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs">Deactivate</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('button[data-action]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.getAttribute('data-id') || '0', 10);
        const action = btn.getAttribute('data-action');
        if (!id || !action) return;

        if (action === 'view') {
          await openCandidateModal(id, 'view');
          return;
        }

        if (action === 'edit') {
          await openCandidateModal(id, 'edit');
          return;
        }

        if (action === 'deactivate') {
          if (!confirm('Deactivate this candidate?')) return;
          try {
            setLoading(true, 'Deactivating…');
            await deactivateCandidate(id);
            toast('Candidate deactivated.', 'success');
            await loadCandidates();
          } catch (e) {
            toast(e.message || 'Failed to deactivate.', 'error');
          } finally {
            setLoading(false);
          }
        }
      });
    });
  }

  function renderPagination() {
    const el = qs('#cand-pagination');
    if (!el) return;

    const meta = state.meta;
    if (!meta) {
      el.innerHTML = '';
      return;
    }

    const totalPages = meta.totalPages || 1;
    el.innerHTML = `
      <div class="flex items-center justify-between gap-3">
        <div class="text-xs text-slate-500 dark:text-slate-400">Total: ${meta.total} • Page ${meta.page} / ${totalPages}</div>
        <div class="flex items-center gap-2">
          <button id="cand-prev" class="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-800 text-sm" ${meta.page <= 1 ? 'disabled' : ''}>Prev</button>
          <button id="cand-next" class="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-800 text-sm" ${meta.page >= totalPages ? 'disabled' : ''}>Next</button>
        </div>
      </div>
    `;

    qs('#cand-prev')?.addEventListener('click', () => {
      if (state.page <= 1) return;
      state.page -= 1;
      loadCandidates();
    });

    qs('#cand-next')?.addEventListener('click', () => {
      if (state.page >= totalPages) return;
      state.page += 1;
      loadCandidates();
    });
  }

  async function openCandidateModal(id, mode) {
    const modal = qs('#candidate-modal');
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');

    qs('#candidate-modal-title').textContent = mode === 'edit' ? 'Edit candidate' : 'Candidate details';
    qs('#candidate-modal-body').innerHTML = '';

    try {
      setLoading(true, 'Loading candidate…');
      const c = await getCandidate(id);

      const docs = Array.isArray(c.documents) ? c.documents.filter((d) => !d.deletedAt) : [];
      const apps = Array.isArray(c.applications) ? c.applications : [];

      const body = qs('#candidate-modal-body');
      body.innerHTML = `
        <form id="candidate-form" class="grid grid-cols-1 gap-3">
          <input type="hidden" id="cand-id" value="${c.id}" />

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-slate-600 dark:text-slate-300">Full name</label>
              <input id="cand-fullName" class="w-full px-3 py-2 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm" value="${escapeHtml(c.fullName || '')}" ${mode === 'view' ? 'disabled' : ''} />
            </div>
            <div>
              <label class="block text-xs text-slate-600 dark:text-slate-300">Email</label>
              <input id="cand-email" type="email" class="w-full px-3 py-2 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm" value="${escapeHtml(c.email || '')}" ${mode === 'view' ? 'disabled' : ''} />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-slate-600 dark:text-slate-300">Phone</label>
              <input id="cand-phone" class="w-full px-3 py-2 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm" value="${escapeHtml(c.phone || '')}" ${mode === 'view' ? 'disabled' : ''} />
            </div>
            <div>
              <label class="block text-xs text-slate-600 dark:text-slate-300">LinkedIn</label>
              <input id="cand-linkedin" class="w-full px-3 py-2 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm" value="${escapeHtml(c.linkedinUrl || '')}" ${mode === 'view' ? 'disabled' : ''} />
            </div>
          </div>

          <div class="flex items-center justify-end gap-2">
            <button type="button" class="px-3 py-2 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sm" data-modal-close>Close</button>
            ${mode === 'edit' ? '<button type="submit" class="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm">Save</button>' : ''}
          </div>
        </form>

        <div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="border border-slate-200 dark:border-slate-800 rounded-lg p-3">
            <div class="text-sm font-semibold">Documents</div>
            <div class="mt-2" id="cand-docs"></div>
          </div>
          <div class="border border-slate-200 dark:border-slate-800 rounded-lg p-3">
            <div class="text-sm font-semibold">Applications</div>
            <div class="mt-2" id="cand-apps"></div>
          </div>
        </div>
      `;

      renderCandidateDocs(docs);
      renderCandidateApps(apps);

      const form = qs('#candidate-form');
      if (form && mode === 'edit') {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          try {
            setLoading(true, 'Saving candidate…');
            const payload = {
              fullName: qs('#cand-fullName').value || undefined,
              email: qs('#cand-email').value || undefined,
              phone: qs('#cand-phone').value || undefined,
              linkedinUrl: qs('#cand-linkedin').value || undefined,
            };
            await updateCandidate(c.id, payload);
            toast('Candidate updated.', 'success');
            await loadCandidates();
            await openCandidateModal(c.id, 'view');
          } catch (err) {
            toast(err.message || 'Failed to update candidate.', 'error');
          } finally {
            setLoading(false);
          }
        });
      }
    } catch (e) {
      toast(e.message || 'Failed to load candidate.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function renderCandidateDocs(docs) {
    const el = qs('#cand-docs');
    if (!el) return;

    if (!docs.length) {
      el.innerHTML = '<div class="text-sm text-slate-500 dark:text-slate-400">No documents.</div>';
      return;
    }

    el.innerHTML = '';
    docs.forEach((d) => {
      const url = resolveUploadUrl(d.uploadUrl);
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between gap-2 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2';
      row.innerHTML = `
        <div class="min-w-0">
          <div class="text-sm font-medium truncate">${escapeHtml(d.fileName || '')}</div>
          <div class="text-xs text-slate-500 dark:text-slate-400">${escapeHtml(d.type || '')} • Doc #${d.id}</div>
        </div>
        <a class="shrink-0 px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sm" target="_blank" rel="noreferrer" href="${url}">Open</a>
      `;
      el.appendChild(row);
    });
  }

  function renderCandidateApps(apps) {
    const el = qs('#cand-apps');
    if (!el) return;

    if (!apps.length) {
      el.innerHTML = '<div class="text-sm text-slate-500 dark:text-slate-400">No applications.</div>';
      return;
    }

    el.innerHTML = '';
    apps.forEach((a) => {
      const row = document.createElement('div');
      row.className = 'rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2';
      row.innerHTML = `
        <div class="flex items-center justify-between gap-2">
          <div class="text-sm font-medium truncate">${escapeHtml(a.posting?.title || 'Job posting')}</div>
          <div class="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">${escapeHtml(a.status || '')}</div>
        </div>
        <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">Application #${a.id}</div>
      `;
      el.appendChild(row);
    });
  }

  function openCreateModal() {
    const modal = qs('#candidate-modal');
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');

    qs('#candidate-modal-title').textContent = 'Create candidate';

    qs('#candidate-modal-body').innerHTML = `
      <form id="candidate-create" class="grid grid-cols-1 gap-3">
        <div>
          <label class="block text-xs text-slate-600 dark:text-slate-300">Full name *</label>
          <input id="new-fullName" class="w-full px-3 py-2 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm" required />
        </div>
        <div>
          <label class="block text-xs text-slate-600 dark:text-slate-300">Email *</label>
          <input id="new-email" type="email" class="w-full px-3 py-2 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm" required />
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-slate-600 dark:text-slate-300">Phone</label>
            <input id="new-phone" class="w-full px-3 py-2 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm" />
          </div>
          <div>
            <label class="block text-xs text-slate-600 dark:text-slate-300">LinkedIn</label>
            <input id="new-linkedin" class="w-full px-3 py-2 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm" />
          </div>
        </div>

        <div class="flex items-center justify-end gap-2">
          <button type="button" class="px-3 py-2 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sm" data-modal-close>Cancel</button>
          <button type="submit" class="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm">Create</button>
        </div>
      </form>
    `;

    qs('#candidate-create').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        setLoading(true, 'Creating candidate…');
        const payload = {
          fullName: qs('#new-fullName').value.trim(),
          email: qs('#new-email').value.trim(),
          phone: qs('#new-phone').value || undefined,
          linkedinUrl: qs('#new-linkedin').value || undefined,
        };
        const created = await createCandidate(payload);
        toast('Candidate created.', 'success');
        await loadCandidates();
        await openCandidateModal(created.id, 'view');
      } catch (err) {
        toast(err.message || 'Failed to create candidate.', 'error');
      } finally {
        setLoading(false);
      }
    });
  }

  function wireControls() {
    qs('#cand-search-btn')?.addEventListener('click', () => {
      state.fullName = qs('#cand-filter-name').value.trim();
      state.email = qs('#cand-filter-email').value.trim();
      state.page = 1;
      loadCandidates();
    });

    qs('#cand-create-btn')?.addEventListener('click', openCreateModal);
  }

  function escapeHtml(s) {
    return String(s || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function init() {
    wireControls();
    loadCandidates();
  }

  NS.candidates = {
    init,
  };
})();
