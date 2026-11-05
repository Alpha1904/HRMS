(function () {
  const NS = (window.HRMSRecruitment = window.HRMSRecruitment || {});
  const { qs, qsa, toast, setLoading } = NS.ui;

  async function fetchPublicJobs() {
    return NS.core.request('GET', '/job-postings/public', {
      auth: false,
      query: { page: 1, limit: 50 },
    });
  }

  function escapeHtml(input) {
    return String(input || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(d) {
    try {
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return '';
      return dt.toLocaleDateString();
    } catch {
      return '';
    }
  }

  function formatSalaryRange(sr) {
    if (!sr) return '';
    const min = sr.min ?? sr.minimum ?? null;
    const max = sr.max ?? sr.maximum ?? null;
    const currency = sr.currency ?? '';
    if (min == null && max == null) return '';
    const fmt = (v) => {
      try {
        return Number(v).toLocaleString();
      } catch {
        return String(v);
      }
    };
    if (min != null && max != null) return `${currency} ${fmt(min)} - ${fmt(max)}`.trim();
    if (min != null) return `${currency} ${fmt(min)}+`.trim();
    return `${currency} up to ${fmt(max)}`.trim();
  }

  function renderJobs(jobs) {
    const grid = qs('#careers-grid');
    const empty = qs('#careers-empty');
    const summary = qs('#careers-summary');

    if (!Array.isArray(jobs) || jobs.length === 0) {
      grid.innerHTML = '';
      empty.classList.remove('hidden');
      summary.textContent = 'No published jobs found.';
      return;
    }

    empty.classList.add('hidden');
    summary.textContent = `Showing ${jobs.length} job${jobs.length === 1 ? '' : 's'}.`;

    grid.innerHTML = jobs
      .map((j) => {
        const title = escapeHtml(j.title);
        const dept = escapeHtml(j.department || '');
        const site = escapeHtml(j.site || '');
        const recruiter = escapeHtml((j.recruiter && j.recruiter.fullName) || '');
        const apps = j._count && typeof j._count.applications === 'number' ? j._count.applications : null;
        const published = formatDate(j.publishedAt);
        const salary = formatSalaryRange(j.salaryRange);
        const description = escapeHtml(j.description || '');
        const requirements = escapeHtml(j.requirements || '');

        return `
<div class="bg-white border border-gray-300 rounded-xl p-4 flex flex-col" data-job-card data-job-id="${j.id}">
  <div class="flex items-start justify-between gap-3">
    <div class="min-w-0">
      <div class="font-semibold truncate" title="${title}">${title}</div>
      <div class="text-xs text-gray-500 mt-1">${dept}${dept && site ? ' • ' : ''}${site}</div>
    </div>
    <div class="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Open</div>
  </div>

  <div class="mt-3 text-sm text-black" data-job-desc>
    <div class="line-clamp-4" data-job-desc-short>${description || '<span class="text-gray-500">No description</span>'}</div>
    <div class="hidden" data-job-desc-full>
      <div class="whitespace-pre-wrap">${description || '<span class="text-gray-500">No description</span>'}</div>
      ${requirements ? `<div class="mt-3"><div class="text-xs font-semibold text-gray-600">Requirements</div><div class="mt-1 text-sm text-black whitespace-pre-wrap">${requirements}</div></div>` : ''}
    </div>
  </div>

  <div class="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
    ${published ? `<div class="px-2 py-1 rounded bg-gray-50 border border-gray-300">Published: ${escapeHtml(published)}</div>` : ''}
    ${salary ? `<div class="px-2 py-1 rounded bg-gray-50 border border-gray-300">Salary: ${escapeHtml(salary)}</div>` : ''}
    ${recruiter ? `<div class="px-2 py-1 rounded bg-gray-50 border border-gray-300">Recruiter: ${recruiter}</div>` : ''}
    ${apps != null ? `<div class="px-2 py-1 rounded bg-gray-50 border border-gray-300">Applications: ${apps}</div>` : ''}
  </div>

  <div class="mt-4 flex items-center justify-between gap-2">
    <button class="px-3 py-2 rounded bg-white hover:bg-gray-50 border border-gray-300 text-black text-sm" data-action="toggle">Show more</button>
    <button class="px-3 py-2 rounded bg-[rgb(242,101,34)] hover:bg-[rgb(220,90,30)] text-white text-sm" data-action="apply">Apply</button>
  </div>
</div>`;
      })
      .join('');
  }

  function wireCardActions() {
    const grid = qs('#careers-grid');
    grid.addEventListener('click', (e) => {
      const btn = e.target && e.target.closest ? e.target.closest('button[data-action]') : null;
      if (!btn) return;

      const card = btn.closest('[data-job-card]');
      if (!card) return;

      const jobId = card.getAttribute('data-job-id');
      const action = btn.getAttribute('data-action');

      if (action === 'apply') {
        if (!jobId) return;
        window.location.href = `./apply.html?postingId=${encodeURIComponent(jobId)}`;
        return;
      }

      if (action === 'toggle') {
        const shortEl = card.querySelector('[data-job-desc-short]');
        const fullEl = card.querySelector('[data-job-desc-full]');
        const expanded = fullEl && !fullEl.classList.contains('hidden');

        if (shortEl) shortEl.classList.toggle('hidden', !expanded);
        if (fullEl) fullEl.classList.toggle('hidden', expanded);
        btn.textContent = expanded ? 'Show more' : 'Show less';
      }
    });
  }

  async function load() {
    try {
      setLoading(true, 'Loading jobs…');
      const res = await fetchPublicJobs();
      const jobs = res && res.data ? res.data : [];
      renderJobs(jobs);
    } catch (err) {
      qs('#careers-grid').innerHTML = '';
      qs('#careers-empty').classList.remove('hidden');
      qs('#careers-summary').textContent = 'Failed to load jobs.';
      toast(err.message || 'Failed to load jobs.', 'error', 7000);
    } finally {
      setLoading(false);
    }
  }

  function init() {
    wireCardActions();
    qs('#careers-refresh')?.addEventListener('click', () => load());
    load();
  }

  NS.career = {
    init,
  };
})();
