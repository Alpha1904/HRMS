(function () {
  const NS = (window.HRMSRecruitment = window.HRMSRecruitment || {});
  const { toast, setLoading, qs } = NS.ui;

  async function submitApplication(formData) {
    // Public endpoint; do NOT send Authorization header.
    return NS.core.request('POST', '/applications', { formData, auth: false });
  }

  function parsePositiveInt(value) {
    const v = String(value ?? '').trim();
    if (!v) return null;
    const n = Number.parseInt(v, 10);
    if (!Number.isFinite(n) || String(n) !== v) return null;
    if (n <= 0) return null;
    return n;
  }

  function prefillFromUrl() {
    const p = new URLSearchParams(window.location.search);
    const postingId = p.get('postingId');
    const parsed = parsePositiveInt(postingId);
    if (parsed) {
      qs('#apply-posting-id').value = String(parsed);
    }
  }

  function init() {
    prefillFromUrl();

    qs('#apply-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();

      try {
        setLoading(true, 'Submitting…');

        const postingIdRaw = qs('#apply-posting-id').value;
        const postingId = parsePositiveInt(postingIdRaw);
        if (!postingId) {
          toast('Posting ID must be a positive integer.', 'error', 7000);
          return;
        }
        const fullName = qs('#apply-full-name').value;
        const email = qs('#apply-email').value;
        const phone = qs('#apply-phone').value;
        const linkedinUrl = qs('#apply-linkedin').value;
        const resumeInput = qs('#apply-resume');

        const fd = new FormData();
        fd.append('postingId', String(postingId));
        fd.append('fullName', fullName);
        fd.append('email', email);
        if (phone) fd.append('phone', phone);
        if (linkedinUrl) fd.append('linkedinUrl', linkedinUrl);

        const file = resumeInput.files && resumeInput.files[0];
        if (file) fd.append('resume', file);

        const created = await submitApplication(fd);
        toast('Application submitted.', 'success', 6000);

        // Reset (keep postingId)
        const keepPosting = qs('#apply-posting-id').value;
        qs('#apply-form').reset();
        qs('#apply-posting-id').value = keepPosting;

        if (created && created.id) {
          toast(`Created application #${created.id}.`, 'success', 6000);
        }
      } catch (err) {
        toast(err.message || 'Failed to submit application.', 'error', 7000);
      } finally {
        setLoading(false);
      }
    });
  }

  NS.apply = {
    init,
  };
})();
