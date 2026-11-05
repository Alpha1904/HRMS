(function () {
  const NS = (window.HRMSRecruitment = window.HRMSRecruitment || {});
  const { toast, setLoading, qs } = NS.ui;
  const {
    uploadDocument,
    getDocument,
    deleteDocument,
    getAllDocuments,
    getAllProfiles,
    getAllCandidates,
    getAllApplications,
  } = NS.api;
  const { resolveUploadUrl } = NS.core;

  let allDocuments = [];
  let filteredDocuments = [];
  let entityData = {
    profiles: [],
    candidates: [],
    applications: []
  };

  function formatDocId(id) {
    return `doc-${String(id).padStart(2, '0')}`;
  }

  async function loadEntityData() {
    try {
      setLoading(true, 'Loading entity data…');
      
      const [profiles, candidates, applications] = await Promise.all([
        getAllProfiles(),
        getAllCandidates(), 
        getAllApplications()
      ]);
      
      entityData.profiles = profiles?.data || profiles || [];
      entityData.candidates = candidates?.data || candidates || [];
      entityData.applications = applications?.data || applications || [];
    } catch (err) {
      toast(err.message || 'Failed to load entity data.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function populateEntityDropdown(entityType) {
    const dropdown = qs('#doc-entity-name');
    const hiddenInput = qs('#doc-entity-id');
    
    dropdown.innerHTML = '<option value="">Select...</option>';
    hiddenInput.value = '';
    
    let options = [];
    
    switch (entityType) {
      case 'profile':
        options = entityData.profiles.map(profile => ({
          id: profile.id,
          name: profile.fullName || `Profile ${profile.id}`
        }));
        break;
      case 'candidate':
        options = entityData.candidates.map(candidate => ({
          id: candidate.id,
          name: candidate.fullName || candidate.email || `Candidate ${candidate.id}`
        }));
        break;
      case 'application':
        options = entityData.applications.map(app => ({
          id: app.id,
          name: app.candidate?.fullName || 
                 app.profile?.fullName || 
                 `Application ${app.id}`
        }));
        break;
    }
    
    options.forEach(option => {
      const optionEl = document.createElement('option');
      optionEl.value = option.id;
      optionEl.textContent = option.name;
      dropdown.appendChild(optionEl);
    });
    
    dropdown.disabled = false;
  }

  function handleEntityTypeChange() {
    const entityType = qs('#doc-entity-type').value;
    const dropdown = qs('#doc-entity-name');
    
    if (!entityType) {
      dropdown.disabled = true;
      dropdown.innerHTML = '<option value="">Select entity type first</option>';
      qs('#doc-entity-id').value = '';
      return;
    }
    
    populateEntityDropdown(entityType);
  }

  function handleEntityNameChange() {
    const selectedId = qs('#doc-entity-name').value;
    qs('#doc-entity-id').value = selectedId;
  }

  function renderDocumentRow(doc) {
    const url = resolveUploadUrl(doc.uploadUrl);
    return `
      <tr class="hover:bg-gray-100">
        <td class="px-4 py-3 font-mono text-xs">${formatDocId(doc.id)}</td>
        <td class="px-4 py-3">${escapeHtml(doc.fullName || 'Unknown')}</td>
        <td class="px-4 py-3">
          <span class="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
            ${escapeHtml(doc.type || '')}
          </span>
        </td>
        <td class="px-4 py-3">
          <span class="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-black">
            ${escapeHtml(doc.entityType || '')}
          </span>
        </td>
        <td class="px-4 py-3">
          <div class="flex gap-2">
            <a href="${url}" target="_blank" rel="noreferrer" class="px-2.5 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs">View</a>
            <button data-doc-delete="${doc.id}" class="px-2.5 py-1.5 rounded bg-[rgb(242,101,34)] hover:bg-[rgb(220,90,30)] text-white text-xs">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }

  async function loadAllDocuments() {
    try {
      setLoading(true, 'Loading documents…');
      allDocuments = await getAllDocuments();
      
      // Extract unique document types for filter
      const docTypes = [...new Set(allDocuments.map(doc => doc.type).filter(Boolean))];
      const typeFilter = qs('#doc-type-filter');
      typeFilter.innerHTML = '<option value="">All Types</option>' + 
        docTypes.map(type => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join('');
      
      applyFilters();
    } catch (err) {
      toast(err.message || 'Failed to load documents.', 'error');
      qs('#documents-table-body').innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500">Failed to load documents.</td></tr>';
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    const searchTerm = qs('#doc-search').value.toLowerCase();
    const typeFilter = qs('#doc-type-filter').value;
    const entityFilter = qs('#entity-type-filter').value;

    filteredDocuments = allDocuments.filter(doc => {
      const matchesSearch = !searchTerm || 
        doc.id.toString().includes(searchTerm) ||
        (doc.type && doc.type.toLowerCase().includes(searchTerm)) ||
        (doc.fileName && doc.fileName.toLowerCase().includes(searchTerm)) ||
        (doc.fullName && doc.fullName.toLowerCase().includes(searchTerm));
      
      const matchesType = !typeFilter || doc.type === typeFilter;
      const matchesEntity = !entityFilter || doc.entityType === entityFilter;

      return matchesSearch && matchesType && matchesEntity;
    });

    renderTable();
  }

  function renderTable() {
    const tbody = qs('#documents-table-body');
    const noResults = qs('#no-results');

    if (filteredDocuments.length === 0) {
      tbody.innerHTML = '';
      noResults.classList.remove('hidden');
      return;
    }

    noResults.classList.add('hidden');
    tbody.innerHTML = filteredDocuments.map(renderDocumentRow).join('');
    wireDeleteButtons();
  }

  function wireDeleteButtons() {
    document.querySelectorAll('button[data-doc-delete]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.getAttribute('data-doc-delete'));
        if (!id) return;
        
        // Find the document name from the table row
        const row = btn.closest('tr');
        const docNameElement = row?.querySelector('td:nth-child(3)'); // Document type column
        const docName = docNameElement?.textContent || 'this document';
        
        await openDeleteModal(id, docName);
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

  async function handleUpload(e) {
    e.preventDefault();

    const entityType = qs('#doc-entity-type').value;
    const entityId = qs('#doc-entity-id').value;
    const type = qs('#doc-type').value;
    const fileInput = qs('#doc-file');
    const file = fileInput.files && fileInput.files[0];

    if (!entityType) {
      toast('Please select an entity type.', 'warn');
      return;
    }

    if (!entityId) {
      toast('Please select an entity.', 'warn');
      return;
    }

    if (!type) {
      toast('Please select a document type.', 'warn');
      return;
    }

    if (!file) {
      toast('Please select a file.', 'warn');
      return;
    }

    try {
      setLoading(true, 'Uploading…');

      const fd = new FormData();
      fd.append('file', file);
      fd.append('entityType', entityType);
      fd.append('entityId', entityId);
      fd.append('type', type);

      const created = await uploadDocument(fd);
      toast('Document uploaded successfully.', 'success');

      // Reset form and reload table
      qs('#doc-upload').reset();
      qs('#doc-entity-name').disabled = true;
      qs('#doc-entity-name').innerHTML = '<option value="">Select entity type first</option>';
      await loadAllDocuments();
    } catch (err) {
      toast(err.message || 'Upload failed.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function openDeleteModal(documentId, documentName) {
    const modal = qs('#delete-modal');
    const nameElement = qs('#delete-doc-name');
    const confirmBtn = qs('#confirm-delete-btn');
    
    if (!modal || !nameElement || !confirmBtn) return;

    // Set document name
    nameElement.textContent = documentName;

    // Show modal
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');

    // Handle confirm button click
    const handleConfirm = async () => {
      try {
        setLoading(true, 'Deleting…');
        await deleteDocument(documentId);
        toast('Document deleted.', 'success');
        await loadAllDocuments(); // Reload the table
        
        // Close modal
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
      } catch (err) {
        toast(err.message || 'Delete failed.', 'error');
      } finally {
        setLoading(false);
      }
    };

    // Remove existing listener and add new one
    confirmBtn.removeEventListener('click', handleConfirm);
    confirmBtn.addEventListener('click', handleConfirm);
  }

  function init() {
    // Load entity data first
    loadEntityData();
    
    // Upload form
    qs('#doc-upload')?.addEventListener('submit', handleUpload);
    
    // Entity type change handler
    qs('#doc-entity-type')?.addEventListener('change', handleEntityTypeChange);
    
    // Entity name change handler
    qs('#doc-entity-name')?.addEventListener('change', handleEntityNameChange);
    
    // Search and filters
    qs('#doc-search')?.addEventListener('input', applyFilters);
    qs('#doc-type-filter')?.addEventListener('change', applyFilters);
    qs('#entity-type-filter')?.addEventListener('change', applyFilters);
    
    // Load initial documents data
    loadAllDocuments();
  }

  NS.documents = {
    init,
  };
})();
