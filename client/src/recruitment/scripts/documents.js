(function () {
  const NS = (window.HRMSRecruitment = window.HRMSRecruitment || {});
  const { toast, setLoading, qs } = NS.ui;
  const {
    uploadDocument,
    getDocument,
    deleteDocument,
    getCandidate,
    getApplication,
  } = NS.api;
  const { resolveUploadUrl } = NS.core;

  function renderDocumentCard(d) {
    const url = resolveUploadUrl(d.uploadUrl);
    return `
      <div class="rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <div class="text-sm font-semibold truncate">${escapeHtml(d.fileName || '')}</div>
            <div class="text-xs text-slate-500 dark:text-slate-400">Type: ${escapeHtml(d.type || '')} • Doc #${d.id}</div>
            <div class="text-xs text-slate-500 dark:text-slate-400">${escapeHtml(d.mimeType || '')} ${d.size ? `• ${Math.round(d.size / 1024)} KB` : ''}</div>
            <div class="text-xs text-slate-500 dark:text-slate-400">uploadUrl: ${escapeHtml(d.uploadUrl || '')}</div>
          </div>
          <div class="flex flex-col gap-2 shrink-0">
            <a class="px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sm" target="_blank" rel="noreferrer" href="${url}">Open</a>
            <button data-doc-delete="${d.id}" class="px-2.5 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-sm" type="button">Delete</button>
          </div>
        </div>
      </div>
    `;
  }

  async function handleUpload(e) {
    e.preventDefault();

    const entityType = qs('#doc-entity-type').value;
    const entityId = qs('#doc-entity-id').value;
    const type = qs('#doc-type').value;
    const fileInput = qs('#doc-file');
    const file = fileInput.files && fileInput.files[0];

    if (!file) {
      toast('Select a file.', 'warn');
      return;
    }

    try {
      setLoading(true, 'Uploading…');

      const fd = new FormData();
      fd.append('file', file);
      fd.append('entityType', entityType);
      fd.append('entityId', String(entityId));
      fd.append('type', type);

      const created = await uploadDocument(fd);
      toast('Uploaded.', 'success');

      // If API returns the created document, show it.
      if (created && created.id) {
        qs('#doc-id').value = String(created.id);
        await lookupDocument(created.id);
      }
    } catch (err) {
      toast(err.message || 'Upload failed.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function lookupDocument(id) {
    try {
      setLoading(true, 'Fetching document…');
      const d = await getDocument(id);
      const el = qs('#doc-lookup-result');
      el.innerHTML = renderDocumentCard(d);
      wireDeleteButtons(el);
    } catch (err) {
      toast(err.message || 'Failed to fetch document.', 'error');
      qs('#doc-lookup-result').innerHTML = '';
    } finally {
      setLoading(false);
    }
  }

  async function handleDocLookup(e) {
    e.preventDefault();
    const id = Number(qs('#doc-id').value);
    if (!id) {
      toast('Enter a document ID.', 'warn');
      return;
    }
    await lookupDocument(id);
  }

  async function handleEntityDocs(e) {
    e.preventDefault();

    const type = qs('#entity-type').value;
    const id = Number(qs('#entity-id').value);
    if (!id) {
      toast('Enter an entity ID.', 'warn');
      return;
    }

    try {
      setLoading(true, 'Loading…');

      let docs = [];
      if (type === 'candidate') {
        const c = await getCandidate(id);
        docs = Array.isArray(c.documents) ? c.documents.filter((d) => !d.deletedAt) : [];
      } else if (type === 'application') {
        const a = await getApplication(id);
        if (a.document && !a.document.deletedAt) docs = [a.document];
      }

      const el = qs('#entity-docs-result');
      if (!docs.length) {
        el.innerHTML = '<div class="text-sm text-slate-500 dark:text-slate-400">No documents found.</div>';
        return;
      }

      el.innerHTML = `<div class="flex flex-col gap-2">${docs.map(renderDocumentCard).join('')}</div>`;
      wireDeleteButtons(el);
    } catch (err) {
      toast(err.message || 'Failed to load documents.', 'error');
      qs('#entity-docs-result').innerHTML = '';
    } finally {
      setLoading(false);
    }
  }

  function wireDeleteButtons(root) {
    (root || document).querySelectorAll('button[data-doc-delete]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.getAttribute('data-doc-delete'));
        if (!id) return;
        if (!confirm('Delete this document?')) return;

        try {
          setLoading(true, 'Deleting…');
          await deleteDocument(id);
          toast('Deleted.', 'success');

          // Refresh lookup sections if currently showing this id.
          const lookupId = Number(qs('#doc-id').value);
          if (lookupId === id) qs('#doc-lookup-result').innerHTML = '';

          // Clear any entity results (unknown where it came from)
          // Caller can re-run entity load.
        } catch (err) {
          toast(err.message || 'Delete failed.', 'error');
        } finally {
          setLoading(false);
        }
      });
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
    qs('#doc-upload')?.addEventListener('submit', handleUpload);
    qs('#doc-lookup')?.addEventListener('submit', handleDocLookup);
    qs('#entity-docs')?.addEventListener('submit', handleEntityDocs);
  }

  NS.documents = {
    init,
  };
})();
