(function () {
  const NS = (window.HRMSRecruitment = window.HRMSRecruitment || {});
  const { toast, setLoading, qs } = NS.ui;
  const { uploadDocument } = NS.api;

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

  function handleFileSelect() {
    const fileInput = qs('#apply-resume');
    const fileName = qs('#file-name');
    
    if (fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      fileName.textContent = `Selected: ${file.name} (${formatFileSize(file.size)})`;
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast('Please upload a PDF, DOC, or DOCX file.', 'error');
        fileInput.value = '';
        fileName.textContent = '';
        return;
      }
      
      // Validate file size (10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast('File size must be less than 10MB.', 'error');
        fileInput.value = '';
        fileName.textContent = '';
        return;
      }
    } else {
      fileName.textContent = '';
    }
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async function uploadDocumentToTable(file, fullName) {
    try {
      // First, create or find the candidate to get their ID
      const candidateData = {
        fullName: fullName,
        email: qs('#apply-email').value.trim(),
        phone: qs('#apply-phone').value.trim() || undefined,
        linkedinUrl: qs('#apply-linkedin').value.trim() || undefined
      };

      // Create/find candidate first to get candidateId
      const candidate = await NS.core.request('POST', '/candidates', { 
        body: candidateData, 
        auth: false 
      });

      if (!candidate || !candidate.id) {
        throw new Error('Failed to create candidate record');
      }

      // Now upload the document with the correct candidateId
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', 'candidate');
      formData.append('type', 'CV');
      formData.append('entityId', candidate.id.toString()); // Use actual candidate ID
      
      const result = await uploadDocument(formData);
      return {
        ...result,
        candidateId: candidate.id
      };
    } catch (error) {
      console.error('Failed to upload document:', error);
      throw error;
    }
  }

  function init() {
    prefillFromUrl();

    // File input change handler
    qs('#apply-resume')?.addEventListener('change', handleFileSelect);

    // Drag and drop handlers
    const dropZone = qs('.border-dashed');
    if (dropZone) {
      // Prevent default drag behaviors
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
        }, false);
      });

      // Highlight drop zone when item is dragged over it
      ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
          dropZone.classList.add('border-blue-400', 'bg-blue-50', 'dark:bg-blue-900/10');
        }, false);
      });

      // Remove highlight when item leaves drop zone
      ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
          dropZone.classList.remove('border-blue-400', 'bg-blue-50', 'dark:bg-blue-900/10');
        }, false);
      });

      // Handle dropped files
      dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files && files.length > 0) {
          const fileInput = qs('#apply-resume');
          if (fileInput) {
            // Create a new DataTransfer object to properly set files
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(files[0]);
            fileInput.files = dataTransfer.files;
            handleFileSelect();
          }
        }
      }, false);
    }

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
        
        const fullName = qs('#apply-full-name').value.trim();
        const email = qs('#apply-email').value.trim();
        const phone = qs('#apply-phone').value.trim();
        const linkedinUrl = qs('#apply-linkedin').value.trim();
        const resumeInput = qs('#apply-resume');

        // Validate required fields
        if (!fullName) {
          toast('Full name is required.', 'error');
          return;
        }
        
        if (!email) {
          toast('Email is required.', 'error');
          return;
        }

        let documentUploadResult = null;
        let existingCandidateId = null;
        
        // Upload document to documents table first
        const file = resumeInput.files && resumeInput.files[0];
        if (file) {
          try {
            setLoading(true, 'Uploading document…');
            documentUploadResult = await uploadDocumentToTable(file, fullName);
            existingCandidateId = documentUploadResult.candidateId;
            toast('Document uploaded successfully.', 'success', 3000);
          } catch (docError) {
            toast('Failed to upload document. Please try again.', 'error', 5000);
            return;
          }
        }

        // Prepare application form data
        const fd = new FormData();
        fd.append('postingId', String(postingId));
        fd.append('fullName', fullName);
        fd.append('email', email);
        if (phone) fd.append('phone', phone);
        if (linkedinUrl) fd.append('linkedinUrl', linkedinUrl);

        // Add the file to the application form data
        if (file) {
          fd.append('resume', file);
        }

        // Submit the application
        setLoading(true, 'Submitting application…');
        const created = await submitApplication(fd);
        
        // Show success message
        const successMessage = qs('#success-message');
        if (successMessage) {
          successMessage.classList.remove('hidden');
          successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        toast('Application submitted successfully!', 'success', 6000);

        // Reset form (keep postingId)
        const keepPosting = qs('#apply-posting-id').value;
        qs('#apply-form').reset();
        qs('#apply-posting-id').value = keepPosting;
        qs('#file-name').textContent = '';

        if (created && created.id) {
          toast(`Created application #${created.id}.`, 'success', 6000);
        }

        // Hide success message after 10 seconds
        setTimeout(() => {
          if (successMessage) {
            successMessage.classList.add('hidden');
          }
        }, 10000);

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
