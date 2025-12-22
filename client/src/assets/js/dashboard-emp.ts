import { detectApiBase, fetchLeavesByProfileId, fetchProfileById, submitLeaveRequest } from './fetch.js';

// Toast notification helper
const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
  const colors: Record<string, string> = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  };

  (window as any).Toastify({
    text: message,
    duration: 4000,
    gravity: 'top',
    position: 'right',
    backgroundColor: colors[type],
    stopOnFocus: true,
  }).showToast();
};

// --- Employee Dashboard ---

/**
 * Load a single employee profile and populate the employee dashboard.
 * The profile id is read from URL query param `id` or `profileId`.
 */

async function userId(): Promise<number | undefined> {
    let id: number | null = null;
  const storedId = typeof window !== 'undefined' ? sessionStorage.getItem('currentUserId') : null;
  if (storedId) {
    const parsed = parseInt(storedId, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      id = parsed;
    }
  }

  if (!id) {
    const API_BASE_URL = detectApiBase();
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, { method: 'GET', headers, credentials: 'include' });
      if (res.ok) {
        const me = await res.json();
        const uid = me?.id || me?.user?.id;
        if (uid && typeof uid === 'number' && uid > 0) {
          id = uid;
          sessionStorage.setItem('currentUserId', String(uid));
        }
      }
    } catch (_) {}
  }

  if (!id) {
    console.warn('No authenticated user id found');
    return;
  }

  return id;
}
async function loadDashboardEmployee() {
 const id = await userId();
  if (!id) return;
  try {
    const profile = (await fetchProfileById(id)) as any;

    // Header avatar image (first img inside the header card)
    const headerImg = document.querySelector('.card-header img') as HTMLImageElement | null;
    if (headerImg) {
      const avatar = profile.avatarUrl
        ? (String(profile.avatarUrl).startsWith('http') ? profile.avatarUrl : `${window.location.origin}${profile.avatarUrl}`)
        : headerImg.src; // keep existing
      headerImg.src = avatar;
      headerImg.alt = profile.fullName || headerImg.alt || '';
    }

    // Populate text fields
    const setText = (idName: string, value: any) => {
      const el = document.getElementById(idName);
      if (!el) return;
      el.textContent = value != null ? String(value) : '';
    };

    setText('emp-name', profile.fullName ||'');
    // Position / designation
    setText('emp-position', profile.position || profile.jobTitle || '');
    setText('emp-departmnt', profile.department || profile.team || '');
    setText('emp-phone', profile.phone || profile.mobile || '');
    setText('emp-email', profile.user?.email || profile.email || '');

    // Manager — try several common fields
    const managerName = profile.manager?.fullName || '';
    setText('emp-manager', managerName);

    // Hire / joined date formatting
    if (profile.hireDate || profile.createdAt) {
      const raw = profile.hireDate || profile.createdAt;
      const d = new Date(raw);
      if (!Number.isNaN(d.getTime())) {
        setText('emp-hireDate', d.toLocaleDateString());
      } else {
        setText('emp-hireDate', String(raw));
      }
    }

  } catch (err) {
    console.error('Error loading dashboard employee profile:', err);
  }
}
/**
 * get leaves by profile id and render in tableq
 */
async function loadLeavesByProfileId() {
   const id = await userId();
  if (!id) return;
  try {
    const response = await fetchLeavesByProfileId(id);
    const leaves = Array.isArray(response) ? response : [response];
    console.log('Leaves by profile id:', leaves);
    const tbody = document.querySelector('#leave table tbody');
    if (!tbody) return;
    tbody.innerHTML = ''; // Clear existing rows

    leaves.forEach(async (leave: any) => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-borderColor';
      tr.innerHTML = `
        <td class="py-2 px-5 text-nowrap"><h6 class="font-medium">${leave.type || 'N/A'}</h6></td>
        <td class="py-2 px-5 text-nowrap">${new Date(leave.startDate).toLocaleDateString()} - ${new Date(leave.endDate).toLocaleDateString()}</td>
        <td class="py-2 px-5 text-nowrap">
          <span class="${leave.status === 'APPROVED' ? 'bg-success' : leave.status === 'REJECTED' ? 'bg-danger' : 'bg-warning'} text-white inline-flex items-center text-[10px] font-medium px-[5px] leading-4 rounded">
            <i class="ti ti-point-filled me-1"></i>${leave.status || 'PENDING'}
          </span>

        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error loading leaves by profile id:', err);
  }

}

/**
 * sumbit new leave request
 */
async function handleLeaveRequestSubmit(event: Event) {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  const formData = new FormData(form);

  const type = formData.get('leave_type') as string;
  const startDateStr = formData.get('start_date') as string;
  const endDateStr = formData.get('end_date') as string;
  const reason = formData.get('reason') as string;
  const id = await userId();
  if (!id) {
    showToast('User not authenticated.', 'error');
    return;
  }

  // Convert date strings to ISO 8601 format
  let startDate = '';
  let endDate = '';

  const convertToISO = (dateStr: string): string | null => {
    if (!dateStr) return null;
    // Trim whitespace
    const trimmed = String(dateStr).trim();
    if (!trimmed) return null;
    
    console.log('Converting date:', trimmed);
    
    // Handle YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return `${trimmed}T00:00:00.000Z`;
    }
    
    // Handle DD-MM-YYYY format (convert to YYYY-MM-DD first)
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
      const parts = trimmed.split('-');
      const day = parts[0];
      const month = parts[1];
      const year = parts[2];
      const isoDate = `${year}-${month}-${day}T00:00:00.000Z`;
      return isoDate;
    }
    
    // Try parsing as a regular date
    const dateObj = new Date(trimmed);
    if (!Number.isNaN(dateObj.getTime())) {
      return dateObj.toISOString();
    }
    console.warn('Failed to parse date:', trimmed);
    return null;
  };

  if (startDateStr) {
    startDate = convertToISO(startDateStr) || '';
    if (!startDate) {
      showToast(`Invalid start date format: "${startDateStr}". Please use DD-MM-YYYY or YYYY-MM-DD format.`, 'warning');
      return;
    }
  }

  if (endDateStr) {
    endDate = convertToISO(endDateStr) || '';
    if (!endDate) {
      showToast(`Invalid end date format: "${endDateStr}". Please use DD-MM-YYYY or YYYY-MM-DD format.`, 'warning');
      return;
    }
  }

  const payload = {
    profileId: id,
    type,
    startDate,
    endDate,
    reason,
  };
  console.log('Submitting leave request payload:', payload);
  try {
    const response = await submitLeaveRequest(payload);
    console.log('Response received:', response);
    if (response) {
      console.log('Leave request submitted successfully.', response);
      showToast('Leave request submitted successfully.', 'success');
      form.reset();
      // Close the modal
      const modal = document.getElementById('add_leaves');
      if (modal) {
        modal.classList.add('hidden');
      }
      loadLeavesByProfileId(); // Refresh the leaves table
    }
  } catch (err) {
    console.error('Error submitting leave request:', err);
    const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
    console.error('Error details:', errorMsg);
    showToast(`Error submitting leave request: ${errorMsg}`, 'error');
  }
}

// Attach event listener to the leave request form
const leaveForm = document.getElementById('leave_request_form') as HTMLFormElement | null;
if (leaveForm) {
  leaveForm.addEventListener('submit', handleLeaveRequestSubmit);
}



// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadDashboardEmployee();
  loadLeavesByProfileId();
});
