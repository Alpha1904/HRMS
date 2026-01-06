(function () {
  const NS = (window.HRMSRecruitment = window.HRMSRecruitment || {});
  const { toast, setLoading, qs } = NS.ui;
  const {
    listJobPostings,
    createJobPosting,
    updateJobPosting,
    publishJobPosting,
    pauseJobPosting,
    closeJobPosting,
    deleteJobPosting,
  } = NS.api;

  let state = {
    page: 1,
    limit: 10,
    status: '',
    selectedPostingId: null,
    data: [],
    meta: null,
  };

  function parseSalaryRange(form) {
    const min = form.querySelector('#job-salary-min').value;
    const max = form.querySelector('#job-salary-max').value;
    const currency = form.querySelector('#job-salary-currency').value;

    if (min === '' && max === '' && currency === '') return undefined;

    return {
      min: min === '' ? undefined : Number(min),
      max: max === '' ? undefined : Number(max),
      currency: currency === '' ? undefined : currency,
    };
  }

  function openJobModal(mode, job) {
    const modal = qs('#job-modal');
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');

    qs('#job-modal-title').textContent = mode === 'edit' ? 'Edit job posting' : 'Create job posting';

    qs('#job-id').value = job?.id ? String(job.id) : '';
    qs('#job-title').value = job?.title || '';
    qs('#job-description').value = job?.description || '';
    qs('#job-department').value = job?.department || '';
    qs('#job-site').value = job?.site || '';
    qs('#job-requirements').value = job?.requirements || '';

    const sr = job?.salaryRange || {};
    qs('#job-salary-min').value = sr.min ?? '';
    qs('#job-salary-max').value = sr.max ?? '';
    qs('#job-salary-currency').value = sr.currency ?? '';

    qs('#job-expiresAt').value = job?.expiresAt ? String(job.expiresAt).slice(0, 10) : '';
  }

  function closeJobModal() {
    const modal = qs('#job-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }

  async function loadJobs() {
    try {
      setLoading(true, 'Loading job postings…');
      const res = await listJobPostings({
        status: state.status || undefined,
        page: state.page,
        limit: state.limit,
      });
      state.data = res.data || [];
      state.meta = res.meta || null;
      renderJobsTable();
      renderPagination();
    } catch (e) {
      toast(e.message || 'Failed to load job postings.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function renderJobsTable() {
    const tbody = qs('#jobs-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!state.data.length) {
      tbody.innerHTML = '<tr><td class="px-4 py-4 text-sm text-slate-500" colspan="5">No job postings found.</td></tr>';
      return;
    }

    state.data.forEach((job) => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-200 dark:border-slate-800';

      const appsCount = job._count?.applications ?? 0;

      tr.innerHTML = `
        <td class="px-4 py-3">
          <div class="text-sm font-semibold text-slate-900 dark:text-slate-100">${escapeHtml(job.title)}</div>
          <div class="text-xs text-slate-500 dark:text-slate-400">${escapeHtml(job.department || '')}${job.site ? ' • ' + escapeHtml(job.site) : ''}</div>
        </td>
        <td class="px-4 py-3">
          <span class="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">${escapeHtml(job.status)}</span>
        </td>
        <td class="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">${appsCount}</td>
        <td class="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">${job.publishedAt ? new Date(job.publishedAt).toLocaleDateString() : '—'}</td>
        <td class="px-4 py-3">
          <div class="flex flex-wrap gap-2 justify-end">
            <button data-action="kanban" data-id="${job.id}" class="px-2.5 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs">Kanban</button>
            <button data-action="edit" data-id="${job.id}" class="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs">Edit</button>
            <button data-action="publish" data-id="${job.id}" class="px-2.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs">Publish</button>
            <button data-action="pause" data-id="${job.id}" class="px-2.5 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs">Pause</button>
            <button data-action="close" data-id="${job.id}" class="px-2.5 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs">Close</button>
            <button data-action="delete" data-id="${job.id}" class="px-2.5 py-1.5 rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs">Delete</button>
          </div>
        </td>
      `;

      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('button[data-action]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.getAttribute('data-id') || '0', 10);
        const action = btn.getAttribute('data-action');
        const job = state.data.find((j) => j.id === id);
        if (!id || !action) return;

        if (action === 'edit') {
          openJobModal('edit', job);
          return;
        }

        if (action === 'kanban') {
          state.selectedPostingId = id;
          document.getElementById('kanban-section').classList.remove('hidden');
          document.getElementById('kanban-job-title').textContent = job?.title ? job.title : `Job #${id}`;
          await NS.kanban.loadBoard(id);
          return;
        }

        if (action === 'delete') {
          if (!confirm('Delete this job posting?')) return;
        }

        try {
          setLoading(true, 'Updating job posting…');
          if (action === 'publish') await publishJobPosting(id);
          if (action === 'pause') await pauseJobPosting(id);
          if (action === 'close') await closeJobPosting(id);
          if (action === 'delete') await deleteJobPosting(id);

          toast('Job updated.', 'success');
          await loadJobs();
        } catch (e) {
          toast(e.message || 'Failed to update job.', 'error');
        } finally {
          setLoading(false);
        }
      });
    });
  }

  function renderPagination() {
    const el = qs('#jobs-pagination');
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
          <button id="jobs-prev" class="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-800 text-sm" ${meta.page <= 1 ? 'disabled' : ''}>Prev</button>
          <button id="jobs-next" class="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-800 text-sm" ${meta.page >= totalPages ? 'disabled' : ''}>Next</button>
        </div>
      </div>
    `;

    qs('#jobs-prev')?.addEventListener('click', () => {
      if (state.page <= 1) return;
      state.page -= 1;
      loadJobs();
    });

    qs('#jobs-next')?.addEventListener('click', () => {
      if (state.page >= totalPages) return;
      state.page += 1;
      loadJobs();
    });
  }

  function wireControls() {
    qs('#job-create-btn')?.addEventListener('click', () => openJobModal('create'));

    qs('#job-modal-cancel')?.addEventListener('click', closeJobModal);

    qs('#job-modal-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;

      const idRaw = qs('#job-id').value;
      const isEdit = !!idRaw;

      const title = qs('#job-title').value.trim();
      if (!title) {
        toast('Title is required.', 'warn');
        return;
      }

      const payload = {
        title,
        description: qs('#job-description').value || undefined,
        department: qs('#job-department').value || undefined,
        site: qs('#job-site').value || undefined,
        requirements: qs('#job-requirements').value || undefined,
        salaryRange: parseSalaryRange(form),
        expiresAt: qs('#job-expiresAt').value ? new Date(qs('#job-expiresAt').value).toISOString() : undefined,
      };

      try {
        setLoading(true, isEdit ? 'Updating job…' : 'Creating job…');
        if (isEdit) {
          await updateJobPosting(Number(idRaw), payload);
        } else {
          await createJobPosting(payload);
        }
        toast(isEdit ? 'Job updated.' : 'Job created.', 'success');
        closeJobModal();
        await loadJobs();
      } catch (err) {
        toast(err.message || 'Failed to save job.', 'error');
      } finally {
        setLoading(false);
      }
    });

    qs('#jobs-filter-status')?.addEventListener('change', (e) => {
      state.status = e.target.value;
      state.page = 1;
      loadJobs();
    });

    qs('#kanban-close-btn')?.addEventListener('click', () => {
      document.getElementById('kanban-section').classList.add('hidden');
      state.selectedPostingId = null;
    });
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
    loadJobs();
  }

  NS.jobs = {
    init,
    loadJobs,
  };
})();
