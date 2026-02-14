import { fetchProfiles, fetchProfileById, detectApiBase } from './fetch.js';


// --- Employees ---

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


/**
 * Loads recent employees from backend and populates the dashboard employees table.
 * Fetches the first 5 employees and renders them in the employee section.
 */
async function loadDashboardEmployees() {
  try {
    const id = await userId();
    if (!id) return;
    const profile = (await fetchProfileById(id)) as any;

     const headerImg = document.querySelector('#me-img') as HTMLImageElement | null;
    if (headerImg) {
      const avatar = profile.avatarUrl
        ? (String(profile.avatarUrl).startsWith('http') ? profile.avatarUrl : `${window.location.origin}${profile.avatarUrl}`)
        : headerImg.src; // keep existing
      headerImg.src = avatar;
      headerImg.alt = profile.fullName || headerImg.alt || '';
    }

    const nameEl = document.getElementById('me-name');
    if (nameEl) {
      nameEl.textContent = `Welcome Back, ${profile.fullName || ''}`;
    }

    // Fetch employees from backend (limit to 5 for dashboard preview)
    const response = await fetchProfiles({ page: 1, limit: 5 });
    const employees = response?.data || [];

    // Get the employee table body
    const employeeTableBody = document.querySelector('.card-body table tbody') as HTMLTableSectionElement;

    if (!employeeTableBody) {
      console.log('Employee table body not found on dashboard', employeeTableBody);
      return;
    }

    // Clear existing static rows
    employeeTableBody.innerHTML = '';

    // Render each employee from backend
    employees.forEach((employee: any) => {
      const row = document.createElement('tr');
      row.className = 'border-b border-borderColor';

      // Construct avatar URL with fallback
      const avatarUrl = employee.avatarUrl 
        ? (employee.avatarUrl.startsWith('http') ? employee.avatarUrl : `${window.location.origin}${employee.avatarUrl}`)
        : 'assets/img/users/user-32.jpg';

      // Get user email safely
      const email = employee.user?.email || 'N/A';

      // Get department safely
      const department = employee.department || 'N/A';

      row.innerHTML = `
        <td class="py-2 px-5">
          <div class="flex items-center">
            <a href="employee-details.html?id=${employee.id}" class="size-[42px] flex items-center justify-center rounded-full">
              <img src="${avatarUrl}" class="rounded-full" alt="${employee.fullName}">
            </a>
            <div class="ms-2">
              <h6 class="font-medium"><a href="employee-details.html?id=${employee.id}" class="text-gray-900 hover:text-primary">${employee.fullName}</a></h6>
              <span class="text-xs leading-normal">${employee.position}</span>
            </div>
          </div>
        </td>
        <td class="py-2 px-5">
          <span class="inline-block bg-secondary-transparent text-secondary text-[10px] font-medium px-[5px] leading-4 rounded">
            ${department}
          </span>
        </td>
      `;

      employeeTableBody.appendChild(row);
    });

    // If no employees, show a message
    if (employees.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = '<td colspan="2" class="py-4 px-5 text-center text-gray-500">No employees found</td>';
      employeeTableBody.appendChild(emptyRow);
    }

  } catch (error) {
    console.error('Failed to load dashboard employees:', error);
    // Show error message in the table
    const employeeTableBody = document.querySelector('.card-header')
      ?.closest('.card')
      ?.querySelector('table tbody') as HTMLTableSectionElement;
    
    if (employeeTableBody) {
      employeeTableBody.innerHTML = '<tr><td colspan="2" class="py-4 px-5 text-center text-red-500">Failed to load employees</td></tr>';
    }
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadDashboardEmployees();
  console.log('Dashboard admin module loaded.')
});

