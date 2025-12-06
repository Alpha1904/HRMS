import { fetchProfileById } from './fetch.js';

// --- Employee Dashboard ---

/**
 * Load a single employee profile and populate the employee dashboard.
 * The profile id is read from URL query param `id` or `profileId`.
 */
async function loadDashboardEmployee() {
//   const params = new URLSearchParams(window.location.search);
//   const idParam = params.get('id') || params.get('profileId');

//   if (!idParam) {
//     console.warn('No profile id provided in URL query params (use ?id=). Skipping dashboard profile load.');
//     return;
//   }

//   const id = parseInt(idParam, 10);
//   if (Number.isNaN(id)) {
//     console.warn('Profile id is not a number:', idParam);
//     return;
//   }
const id = 374;

  try {
    const profile = (await fetchProfileById(id)) as any;
    if (!profile) {
      console.warn('No profile returned for id', id);
      return;
    }

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
    setText('emp-department', profile.department || profile.team || '');
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadDashboardEmployee();
});
