(function () {
  const NS = (window.HRMSRecruitment = window.HRMSRecruitment || {});
  const { request } = NS.core;

  function authMe() {
    return request('GET', '/auth/me', {});
  }

  // Job Postings
  function listJobPostings(query) {
    return request('GET', '/job-postings', { query });
  }

  function getJobPosting(id) {
    return request('GET', `/job-postings/${id}`, {});
  }

  function createJobPosting(payload) {
    return request('POST', '/job-postings', { body: payload });
  }

  function updateJobPosting(id, payload) {
    return request('PATCH', `/job-postings/${id}`, { body: payload });
  }

  function publishJobPosting(id) {
    return request('PATCH', `/job-postings/${id}/publish`, { body: {} });
  }

  function pauseJobPosting(id) {
    return request('PATCH', `/job-postings/${id}/pause`, { body: {} });
  }

  function closeJobPosting(id) {
    return request('PATCH', `/job-postings/${id}/close`, { body: {} });
  }

  function deleteJobPosting(id) {
    return request('DELETE', `/job-postings/${id}`, {});
  }

  // Candidates
  function listCandidates(query) {
    return request('GET', '/candidates', { query });
  }

  function getCandidate(id) {
    return request('GET', `/candidates/${id}`, {});
  }

  function getCandidateDocuments(id) {
    return request('GET', `/candidates/${id}/documents`, {});
  }

  function createCandidate(payload) {
    return request('POST', '/candidates', { body: payload });
  }

  function updateCandidate(id, payload) {
    return request('PATCH', `/candidates/${id}`, { body: payload });
  }

  function deactivateCandidate(id) {
    return request('PATCH', `/candidates/${id}/deactivate`, { body: {} });
  }

  // Applications
  function listApplicationsForPosting(postingId, query) {
    return request('GET', `/applications/posting/${postingId}`, { query });
  }

  function getApplication(id) {
    return request('GET', `/applications/${id}`, {});
  }

  function updateApplicationStatus(id, status) {
    return request('PATCH', `/applications/${id}/status`, { body: { status } });
  }

  function updateApplicationPosition(id, boardPosition) {
    return request('PATCH', `/applications/${id}/position`, { body: { boardPosition } });
  }

  function updateApplicationFeedback(id, payload) {
    return request('PATCH', `/applications/${id}/feedback`, { body: payload });
  }

  // Interactions
  function listInteractions(applicationId) {
    return request('GET', `/applications/${applicationId}/interactions`, {});
  }

  function createInteraction(applicationId, payload) {
    return request('POST', `/applications/${applicationId}/interactions`, { body: payload });
  }

  // Documents
  function getAllDocuments() {
    return request('GET', '/documents', {});
  }

  function uploadDocument(formData) {
    return request('POST', '/documents/upload', { formData });
  }

  function getDocument(id) {
    return request('GET', `/documents/${id}`, {});
  }

  function deleteDocument(id) {
    return request('DELETE', `/documents/${id}`, {});
  }

  // Entity data for dropdowns
  function getProfile(id) {
    return request('GET', `/profiles/${id}`, {});
  }

  function getAllProfiles() {
    return request('GET', '/profiles', {});
  }

  function getAllCandidates() {
    return request('GET', '/candidates', {});
  }

  function getAllApplications() {
    return request('GET', '/applications', {});
  }

  NS.api = {
    authMe,

    listJobPostings,
    getJobPosting,
    createJobPosting,
    updateJobPosting,
    publishJobPosting,
    pauseJobPosting,
    closeJobPosting,
    deleteJobPosting,

    listCandidates,
    getCandidate,
    getCandidateDocuments,
    createCandidate,
    updateCandidate,
    deactivateCandidate,

    listApplicationsForPosting,
    getApplication,
    updateApplicationStatus,
    updateApplicationPosition,
    updateApplicationFeedback,

    listInteractions,
    createInteraction,

    getAllDocuments,
    uploadDocument,
    getDocument,
    deleteDocument,

    getProfile,
    getAllProfiles,
    getAllCandidates,
    getAllApplications,
  };
})();
