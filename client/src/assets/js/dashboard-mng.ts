import { detectApiBase, fetchLeavesByManagerId, fetchManagerById, fetchProfileById } from './fetch.js';


const API_BASE_URL = detectApiBase();

/**
 * Loads recent employees from backend and populates the dashboard employees table.
 * Fetches the first 5 employees and renders them in the employee section.
 */

interface CurrentUser {
  id?: number;
  role?: string;
  email?: string;
}

/**
 * Fetch current user profile from /api/auth/me
 * This is called after login to determine the correct dashboard to redirect to
 * Returns user profile with id and role
 */
const getCurrentUser = async(): Promise<CurrentUser> =>{
  try {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      console.warn('Failed to fetch current user profile');
      return { role: 'EMPLOYEE' };
    }

    const user = await response.json() as CurrentUser;
    console.log('Current user:', user);

    // Extract id and role from user object (could be at user.id/role or user.user.id/role depending on API)
    const userId = user?.id;
    const userRole = user?.role || 'EMPLOYEE';
    
    return { id: userId, role: userRole };
  } catch (error) {
    console.error('Error fetching current user:', error);
    return { role: 'EMPLOYEE' }; // Default fallback
  }
}

/**
 * get leaves by profile id and render in tableq
 */
async function loadLeavesByProfileId() {
   const currentUser = await getCurrentUser();
    const userId = currentUser?.id || 0;
    if (!userId) {
      console.warn('No authenticated user. Skipping dashboard data load.');
      return;
    }
  try {
    const response = await fetchLeavesByManagerId(userId);
    const leaves = Array.isArray(response) ? response : [response];
    console.log('Leaves by profile id:', leaves);
    const tbody = document.querySelector('#leave table tbody');
    if (!tbody) return;
    tbody.innerHTML = ''; // Clear existing rows

    leaves.forEach(async (leave: any) => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-borderColor';
      
      const profile =  await fetchProfileById(leave.profileId) as any;
      let statusHtml = '';
      if (leave.status === 'PENDING') {
        statusHtml = `
          <span class="handleApprove bg-success text-white inline-flex items-center text-[10px] font-medium px-[5px] leading-4 rounded cursor-pointer" data-leave-id="${leave.id}">
            <i class="ti ti-point-filled me-1"></i>APPROVE
          </span>
          <span class="handleReject bg-danger text-white inline-flex items-center text-[10px] font-medium px-[5px] leading-4 rounded cursor-pointer ms-2" data-leave-id="${leave.id}">
            <i class="ti ti-point-filled me-1"></i>REJECT
          </span>
        `;
      } else {
        statusHtml = `
          <span class="${leave.status === 'APPROVED' ? 'bg-success' : leave.status === 'REJECTED' ? 'bg-danger' : 'bg-warning'} text-white inline-flex items-center text-[10px] font-medium px-[5px] leading-4 rounded">
            <i class="ti ti-point-filled me-1"></i>${leave.status || 'PENDING'}
          </span>
        `;
      }
      
      tr.innerHTML = `
												<td class="py-2 px-5 text-nowrap">${profile?.fullName}</td>
												<td class="py-2 px-5 text-nowrap">${profile?.department}</td>
        <td class="py-2 px-5 text-nowrap"><h6 class="font-medium">${leave.type || 'N/A'}</h6></td>
        <td class="py-2 px-5 text-nowrap">${new Date(leave.startDate).toLocaleDateString()} - ${new Date(leave.endDate).toLocaleDateString()}</td>
        <td class="py-2 px-5 text-nowrap">
          ${statusHtml}
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error loading leaves by profile id:', err);
  }

}
async function loadDashboardEmployees() {
  try {
    // Fetch current user ID
    const currentUser = await getCurrentUser();
    const userId = currentUser?.id || 0;
    if (!userId) {
      console.warn('No authenticated user. Skipping dashboard data load.');
      return;
    }

    const profile = (await fetchProfileById(userId)) as any;

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
    const response: any = await fetchManagerById(userId);
    const employees = response || []; // Access the 'team' property from the response
    console.log(employees);


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
  //  Show error message in the table
    const employeeTableBody = document.querySelector('.card-body table tbody') as HTMLTableSectionElement;

    if (employeeTableBody) {
      employeeTableBody.innerHTML = '<tr><td colspan="2" class="py-4 px-5 text-center text-red-500">Failed to load employees</td></tr>';
    }
  }
}

/**
 * Handle leave approval by sending a PATCH request to the backend
 * @param leaveId - The ID of the leave request to approve
 */
async function handleApprove(leaveId: number) {
  try {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Get the current user's profile ID (manager ID)
    const currentUser = await getCurrentUser();
    const managerId = currentUser?.id || 0;

    const response = await fetch(`${API_BASE_URL}/leaves/${leaveId}/status`, {
      method: 'PATCH',
      headers,
      credentials: 'include',
      body: JSON.stringify({ managerId, status: 'APPROVED' }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      const errorMessage = errorData?.message || `Failed to approve leave request. Status: ${response.status}`;
      console.error('Response error:', errorData);
      throw new Error(errorMessage);
    }

    console.log(`Leave ${leaveId} approved successfully`);
    
    // Reload the leaves table after approval
    await loadLeavesByProfileId();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to approve leave request. Please try again.';
    console.error('Error approving leave:', error);
    alert(errorMessage);
  }
}

/**
 * Handle leave rejection by sending a PATCH request to the backend
 * @param leaveId - The ID of the leave request to reject
 */
async function handleReject(leaveId: number) {
  try {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Get the current user's profile ID (manager ID)
    const currentUser = await getCurrentUser();
    const managerId = currentUser?.id || 0;

    const response = await fetch(`${API_BASE_URL}/leaves/${leaveId}/status`, {
      method: 'PATCH',
      headers,
      credentials: 'include',
      body: JSON.stringify({ managerId, status: 'REJECTED' }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      const errorMessage = errorData?.message || `Failed to reject leave request. Status: ${response.status}`;
      console.error('Response error:', errorData);
      throw new Error(errorMessage);
    }

    console.log(`Leave ${leaveId} rejected successfully`);
    
    // Reload the leaves table after rejection
    await loadLeavesByProfileId();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to reject leave request. Please try again.';
    console.error('Error rejecting leave:', error);
    alert(errorMessage);
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadDashboardEmployees();
  loadLeavesByProfileId();

  // Attach event listeners for leave action buttons
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    
    // Handle approve button clicks
    if (target.classList.contains('handleApprove')) {
      const leaveId = parseInt(target.getAttribute('data-leave-id') || '0', 10);
      if (leaveId > 0) {
        handleApprove(leaveId);
      }
    }
    
    // Handle reject button clicks
    if (target.classList.contains('handleReject')) {
      const leaveId = parseInt(target.getAttribute('data-leave-id') || '0', 10);
      if (leaveId > 0) {
        handleReject(leaveId);
      }
    }
  });

  console.log('Dashboard admin module loaded.')
});
