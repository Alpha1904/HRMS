
import {
  fetchProfiles,
  fetchProfileById,
  updateProfile,
  deleteProfile,
  updateAvatar,
  createProfile,
} from "./fetch.js";

// jQuery/DataTables is available globally in the app; declare for TypeScript
declare const $: any;

/**
 * Defines the shape of a single employee profile object.
 * This should match the structure of the data coming from your API.
 */
interface Profile {
  id: number;
  fullName: string;
  avatarUrl: string;
  department: string; // department is designation
  phone: string;
  hireDate: string;
  user: {
    email: string;
    isActive: boolean;
  }
}



// ----- Breadcrumb ------
async function setupBreadcrumb() {
  const bcTotal = document.getElementById('bco');
  const totalActive = document.getElementById('bct');
  const totalInactive = document.getElementById('bctt');
  const tottalNewJoiners = document.getElementById('bcf');
  try {
    // First, request a minimal page to learn pagination metadata (if backend returns it)
    const head = await fetchProfiles({ page: 1, limit: 1 }) as any;

    const total = head?.meta?.total ?? (Array.isArray(head?.data) ? head.data.length : 0);
    if (bcTotal) bcTotal.textContent = String(total);

    // If backend provides active/inactive counts in meta, use them directly
    if (head?.meta && typeof head.meta.active === 'number' && typeof head.meta.inactive === 'number') {
      if (totalActive) totalActive.textContent = String(head.meta.active);
      if (totalInactive) totalInactive.textContent = String(head.meta.inactive);
      // Use server-provided new-joiners if available (common keys: news, newJoiners, new)
      const metaNew = typeof head.meta.news === 'number' ? head.meta.news :
                      typeof head.meta.newJoiners === 'number' ? head.meta.newJoiners :
                      typeof head.meta.new === 'number' ? head.meta.new : undefined;
      if (typeof metaNew === 'number') {
        if (tottalNewJoiners) tottalNewJoiners.textContent = String(metaNew);
      } else if (tottalNewJoiners) {
        tottalNewJoiners.textContent = '0';
      }
      return;
    }

    // Otherwise we need to compute active/inactive client-side.
    // If total is reasonably small, fetch all profiles once; otherwise fetch a sample and mark as estimated.
    if (total > 0 && total <= 2000) {
      const all = await fetchProfiles({ page: 1, limit: total }) as any;
      const profiles: Profile[] = all?.data ?? [];
      const activeCount = profiles.filter((p) => p.user?.isActive).length;
      const inactiveCount = profiles.length - activeCount;
      if (totalActive) totalActive.textContent = String(activeCount);
      if (totalInactive) totalInactive.textContent = String(inactiveCount);

      // Compute new joiners (last 7 days) from hireDate or createdAt
      if (tottalNewJoiners) {
        const now = Date.now();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        const newCount = profiles.filter((p) => {
          const d = p.hireDate ? new Date(p.hireDate) : (p as any).createdAt ? new Date((p as any).createdAt) : null;
          return d && !isNaN(d.getTime()) && (now - d.getTime()) <= sevenDays;
        }).length;
        tottalNewJoiners.textContent = String(newCount);
      }
      return;
    }

    if (total > 2000) {
      // Large dataset: fetch a sample and show approximate counts with a '+' indicator.
      const sampleLimit = Math.min(1000, total);
      const sample = await fetchProfiles({ page: 1, limit: sampleLimit }) as any;
      const profiles: Profile[] = sample?.data ?? [];
      const activeInSample = profiles.filter((p) => p.user?.isActive).length;
      const inactiveInSample = profiles.length - activeInSample;
      const activeText = `${activeInSample}${total > sampleLimit ? '+' : ''}`;
      const inactiveText = `${inactiveInSample}${total > sampleLimit ? '+' : ''}`;
      if (totalActive) totalActive.textContent = activeText;
      if (totalInactive) totalInactive.textContent = inactiveText;

      // Estimate new joiners in sample (last 7 days)
      if (tottalNewJoiners) {
        const now = Date.now();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        const newInSample = profiles.filter((p) => {
          const d = p.hireDate ? new Date(p.hireDate) : (p as any).createdAt ? new Date((p as any).createdAt) : null;
          return d && !isNaN(d.getTime()) && (now - d.getTime()) <= sevenDays;
        }).length;
        tottalNewJoiners.textContent = `${newInSample}${total > sampleLimit ? '+' : ''}`;
      }
      return;
    }

    // Fallback: no data
    if (totalActive) totalActive.textContent = '0';
    if (totalInactive) totalInactive.textContent = '0';
  } catch (err) {
    console.error('Failed to load breadcrumb total:', err);
    if (bcTotal) bcTotal.textContent = '0';
    const totalActive = document.getElementById('bct');
    const totalInactive = document.getElementById('bctt');
    if (totalActive) totalActive.textContent = '0';
    if (totalInactive) totalInactive.textContent = '0';
    if (tottalNewJoiners) tottalNewJoiners.textContent = '0';
  }
}


// --- UI Helper Functions ---

/**
 * Displays a notification message.
 * @param message The message to display.
 * @param isError If true, styles the notification as an error.
 */
function showNotification(message: string, isError = false) {
    // In a real app, you would use a library like Toastify or a custom component.
    // For this example, we'll use a simple alert.
    console.log(`Notification: ${message}`, isError ? 'Error' : 'Success');
    alert(message);
}

/**
 * Shows a confirmation modal and returns a promise that resolves when the user confirms or rejects.
 * @param message The confirmation message.
 * @returns A promise that resolves to true if confirmed, false otherwise.
 */
function showConfirmation(message: string): Promise<boolean> {
    // This is a stand-in for a custom modal. In a real app, you would create
    // a proper modal element and handle its button clicks.
    return Promise.resolve(confirm(message));
}

/**
 * A map to link form field IDs to the profile data keys.
 * This centralizes the logic for populating and reading the form.
 */
const editFormFieldMap: Partial<Record<keyof Profile | 'email' | 'isActive', string>> = {
    fullName: 'edit-full-name',
    email: 'edit-email',
    phone: 'edit-phone',
    department: 'edit-department',
    hireDate: 'edit-joining-date',
    isActive: 'edit-status',
};

/**
 * Initialize DataTable in server-side mode. DataTables will request
 * paginated/search/sort data from our backend via `fetchProfiles`.
 */
function initProfilesDataTable() {
  const tableSelector = '.datatable';
  const $table = $(tableSelector);
  // If already initialized, destroy to re-init
  if ($.fn && $.fn.DataTable && $.fn.DataTable.isDataTable(tableSelector)) {
    $table.DataTable().destroy();
  }
  $table.find('tbody').empty();

  // Map column index -> backend field
  const columnMap: Record<number, string> = {
    1: 'id',
    2: 'fullName',
    3: 'user.email',
    4: 'phone',
    5: 'department',
    6: 'hireDate',
    7: 'user.isActive',
  };

  $table.DataTable({
    processing: true,
    serverSide: true,
    searching: true,
    pageLength: 10,
    ajax: async (data: any, callback: any) => {
      try {
        const start = Number(data.start || 0);
        const length = Number(data.length || 10);
        const page = Math.floor(start / length) + 1;
        const searchValue = data.search && data.search.value ? data.search.value : undefined;

        // Determine sorting
        let sortBy: string | undefined;
        let sortOrder: string | undefined;
        if (Array.isArray(data.order) && data.order.length > 0) {
          const ord = data.order[0];
          const colIdx = Number(ord.column);
          const dir = ord.dir || 'asc';
          if (columnMap[colIdx]) {
            sortBy = columnMap[colIdx];
            sortOrder = dir;
          }
        }

        const res = await fetchProfiles({
          page,
          limit: length,
          search: searchValue,
          sortBy,
          sortOrder,
        });

        // DataTables expects recordsTotal and recordsFiltered
        callback({
          data: res.data || [],
          recordsTotal: res.meta?.total ?? 0,
          recordsFiltered: res.meta?.total ?? 0,
          draw: data.draw,
        });
      } catch (err) {
        console.error('DataTable AJAX error', err);
        callback({ data: [], recordsTotal: 0, recordsFiltered: 0 });
      }
    },
    columns: [
      { data: null, orderable: false, searchable: false, render: (d: any) => `
          <div class="flex items-center">
            <input class="row-checkbox size-4 bg-white border border-borderColor rounded text-primary focus:ring-0" type="checkbox" value="${d.id}">
          </div>` },
      { data: 'id', render: (d: any) => `Emp-${d}` },
      { data: 'fullName', render: (d: any, t: any, row: any) => {
          const avatar = row.avatarUrl || 'assets/img/users/user-32.jpg';
          return `
            <div class="flex items-center file-name-icon">
              <a href="employee-details.html?id=${row.id}" class="size-8 rounded-full border border-borderColor">
                <img src="${avatar}" class="rounded-full size-8 img-fluid" alt="img">
              </a>
              <div class="ms-2">
                <h6 class="font-medium"><a href="employee-details.html?id=${row.id}" class="text-gray-900 hover:text-primary">${row.fullName}</a></h6>
                <span class="text-xs leading-normal">${row.department || 'N/A'}</span>
              </div>
            </div>`;
        }
      },
      { data: 'user.email' },
      { data: 'phone' },
      { data: 'department', render: (d: any, t: any, row: any) => `
          <div>
            <a href="javascript:void(0);" class="border rounded p-2 bg-white inline-flex items-center ...">
              ${row.department || 'N/A'}
              <i class="ti ti-chevron-down ml-1"></i>
            </a>
          </div>` },
      { data: 'hireDate', render: (d: any) => d ? new Date(d).toLocaleDateString() : '' },
      { data: 'user.isActive', render: (d: any) => `
          <span class="${d ? 'bg-success' : 'bg-danger'} text-white rounded ...">
            <i class="ti ti-point-filled me-1"></i>${d ? 'Active' : 'Inactive'}
          </span>` },
      { data: null, orderable: false, searchable: false, render: (d: any) => `
          <div class="action-icon inline-flex">
            <a href="#" class="me-2 ... edit-btn" data-id="${d.id}" data-modal-toggle="edit_employee" data-modal-target="edit_employee">
              <i class="ti ti-edit"></i>
            </a>
            <a href="#" class="... delete-btn" data-id="${d.id}" data-modal-toggle="delete_modal" data-modal-target="delete_modal">
              <i class="ti ti-trash"></i>
            </a>
          </div>` },
    ],
    order: [[2, 'asc']],
    createdRow: function(row: any, data: any) {
      // Allow action listeners on dynamically created buttons
      // No-op; we use event delegation in setupActionListeners
    }
  });
}



function setupActionListeners() {
    const tableBody = document.querySelector('.datatable tbody');

    if (!tableBody) return;

    tableBody.addEventListener('click', async (e: Event) => {
        // Find the closest action button
        const target = e.target as HTMLElement;
        const editButton = target.closest<HTMLElement>('.edit-btn');
        const deleteButton = target.closest<HTMLElement>('.delete-btn');
        const checkbox = target.closest<HTMLInputElement>('input.row-checkbox');

        // Handle checkbox selection to highlight row
        if (checkbox) {
            const row = checkbox.closest('tr');
            if (row) {
                if (checkbox.checked) {
                    row.classList.add('bg-red-200');
                } else {
                    row.classList.remove('bg-red-200');
                }
            }
            return;
        }

        if (editButton) {
            e.preventDefault();
            const idString = editButton.dataset.id;
            console.log("edit clicked")
            // Use getAttribute for data attributes with hyphens
            const modalId = editButton.getAttribute('data-modal-toggle');
            const numId = idString && parseInt(idString, 10);
            if (numId && modalId) {
                populateEditModal(numId, modalId);
            }
        }

        if (deleteButton) {
            e.preventDefault();
            const idString = deleteButton.dataset.id;
            if (!idString) return;
            
            const confirmed = await showConfirmation('Are you sure you want to delete this profile?');
            if (confirmed) {
                try {
                    await deleteProfile(parseInt(idString, 10));
                    showNotification('Profile deleted successfully.');
                    $('.datatable').DataTable().ajax.reload(null, false); // Reload data from server
                } catch (error) {
                    console.error('Failed to delete profile:', error);
                    showNotification('Could not delete profile.', true);
                }
            }
        }
    });
}

/**
 * Fetches a single profile's data and fills the edit modal.
 *
 * @param {string} id - The Profile ID to fetch.
 * @param {string} modalId - The ID of the modal to show.
 */
async function populateEditModal(id: number, modalId: string) {
    const modal = document.getElementById(modalId) as HTMLElement;
    if (!modal) return;

    modal.classList.remove('hidden'); // Show the modal
    // Show a loading state (optional)
    const form = modal.querySelector('form');
    if (form) form.reset(); // Clear old data    
    
    try {
        // 1. Call the API to get the latest data
        const profile = await fetchProfileById(id) as Profile;

        // 2. Populate the form fields
        // Note: Field names ('firstName', 'lastName') are assumptions
        
        (modal.querySelector('#edit-profile-id') as HTMLInputElement).value = String(profile.id);
        (modal.querySelector('#edit-emp-id') as HTMLInputElement).value = `Emp-${profile.id}`;
        
        // Use the centralized map to populate fields
        (modal.querySelector(`#${editFormFieldMap.fullName}`) as HTMLInputElement).value = profile.fullName || '';
        (modal.querySelector(`#${editFormFieldMap.email}`) as HTMLInputElement).value = profile.user?.email || '';
        (modal.querySelector(`#${editFormFieldMap.phone}`) as HTMLInputElement).value = profile.phone || '';
        (modal.querySelector(`#${editFormFieldMap.department}`) as HTMLSelectElement).value = profile.department || '';
        (modal.querySelector(`#${editFormFieldMap.isActive}`) as HTMLSelectElement).value = profile.user?.isActive ? 'Active' : 'Inactive';
        
        // Format the date for <input type="date"> (YYYY-MM-DD)
        if (profile.hireDate && modal.querySelector(`#${editFormFieldMap.hireDate}`)) {
            (modal.querySelector('#edit-joining-date') as HTMLInputElement).value = 
                new Date(profile.hireDate).toISOString().split('T')[0];
        }

        // Set avatar preview
        (modal.querySelector('#edit-avatar-preview') as HTMLImageElement).src = 
            profile.avatarUrl || 'assets/img/users/user-32.jpg';
        
    } catch (error: any) {
        console.error('Failed to fetch profile data:', error);
        showNotification('Could not load employee data.', true);
    }
}

/**
 * Handles the submission of the edit form.
 */
async function handleEditFormSubmit(event: SubmitEvent) {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    const id = parseInt((form.querySelector('#edit-profile-id') as HTMLInputElement).value, 10);
    const saveButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
   
    if (saveButton) saveButton.disabled = true;
    saveButton.textContent = 'Saving...';

    try {
        // --- Step 1: Handle Avatar Upload (if any) ---
        const avatarFileInput = form.querySelector('#edit-avatar-file') as HTMLInputElement;
        if (avatarFileInput.files && avatarFileInput.files.length > 0) {
            const formData = new FormData();
            formData.append('file', avatarFileInput.files[0]);
            
            // Call the avatar endpoint 
            await updateAvatar(id, formData);
        }

        // --- Step 2: Handle Profile Data Update ---
        const formValues = new FormData(form);
        const updateProfileDto: Record<string, any> = {};
        
        // Build the DTO from form data, ensuring names match the DTO keys.
        // Collect any user-related fields separately so we can send them nested as `user: { ... }`.
        const userPayload: Record<string, any> = {};

        formValues.forEach((value, key) => {
          // Exclude fields you don't want to send, like the file input or hidden IDs
          if (key === 'file' || key === 'profileId' || key === 'id' || key === 'empId') return;

          if (key === 'avatarUrl') {
            const url = typeof value === 'string' ? value.trim() : '';
            const isValid = /^https?:\/\/.+|^\/assets\/.+|^data:image\/.+/.test(url);
            if (url && isValid) {
              updateProfileDto.avatarUrl = url;
            }
            return;
          }

          // Route email and isActive into the nested `user` object
          if (key === 'email') {
            userPayload.email = String(value).trim();
            return;
          }

          if (key === 'isActive') {
            // The select uses values 'Active'/'Inactive' so convert to boolean
            const raw = String(value).trim();
            userPayload.isActive = raw.toLowerCase() === 'active';
            return;
          }

          // All other fields go to the profile payload
          updateProfileDto[key] = value;
        });

        // Attach nested user payload if any user fields were present
        if (Object.keys(userPayload).length > 0) {
          updateProfileDto.user = userPayload;
        }

        console.log(updateProfileDto, " " + "update data")

        // Call the data update endpoint
        await updateProfile(id, updateProfileDto);

        // --- Step 3: Success ---
        showNotification('Profile updated successfully!');

        console.log('Profile updated:', updateProfileDto);

        // Manually hide the modal
        const modal = document.getElementById('edit_employee') as HTMLElement;
        if (modal) {
            modal.classList.add('hidden'); // Hide the modal on success
        }
        
        // Refresh the DataTable to show updated data
        $('.datatable').DataTable().ajax.reload(null, false);

    } catch (error: any) {
        console.error('Failed to update profile:', error);
        showNotification(`Error: ${error.message}`, true);
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = 'Save Changes';
    }
}

/**
 * Sets up static event listeners for the page, like form submissions and modal controls.
 */
function setupStaticListeners() {
    // Attach the submit handler to the form
    const editForm = document.getElementById('edit-employee-form');
    if (editForm) {
        editForm.addEventListener('submit', handleEditFormSubmit);
    }

    // Attach add-employee form handler if form exists inside #add_employee modal
    const addForm = document.querySelector<HTMLFormElement>('#add_employee form');
    if (addForm) {
      addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        // Attempt to build a payload from commonly used field names
        const form = e.target as HTMLFormElement;

        const get = (selector: string) => {
          const el = form.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(selector);
          return el ? (el.value || '').trim() : '';
        };

        const payload: any = {
          email: get('[name="email"]') || get('input[placeholder*="Email"]'),
          isActive: true,
          role: get('[name="role"]') || get('select') || get('input[placeholder*="role"]'),
          password: get('[name="password"]') || get('input[placeholder*="Password"]'),
          profile: {
            fullName: get('[name="fullName"]') || get('input[placeholder*="Full Name"]') || get('input[aria-label*="Full Name"]'),
            phone: get('[name="phone"]') || get('input[placeholder*="Phone"]'),
            hireDate: get('[name="hireDate"]') || get('input[placeholder*="dd/mm/yyyy"]') || get('input[type="date"]'),
            department: get('[name="department"]') || get('select') || get('input[placeholder*="Department"]'),
          },
        };

        // Clean payload by removing empty strings
        Object.keys(payload).forEach((k) => {
          if (payload[k] === '' || payload[k] === undefined || payload[k] === null) delete payload[k];
        });

        // Normalize and validate role: backend expects one of the enum values
        const allowedRoles = ['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'RECRUITER', 'CANDIDATE', 'SYSTEM_ADMIN'];
        let rawRole = '';
        if (payload.role) rawRole = String(payload.role).trim();
        // Try to map common UI labels to enum values (case-insensitive)
        let normalizedRole = rawRole.toUpperCase();
        if (!allowedRoles.includes(normalizedRole)) {
          // If user selected a placeholder like 'Select' or provided an unknown value, default to EMPLOYEE
          normalizedRole = 'EMPLOYEE';
        }
        payload.role = normalizedRole;

        // Basic client-side checks to avoid sending obviously invalid requests
        if (!payload.email) {
          showNotification('Email is required to create a user.', true);
          return;
        }
        if (!payload.password) {
          showNotification('Password is required to create a user.', true);
          return;
        }

       // Handle avatar file if present
        const fileInput = form.querySelector<HTMLInputElement>('input[type="file"]');
        let file: File | null = null;
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
          file = fileInput.files[0];
        }

        try {
          const created = await createProfile(payload as object);
         // If avatar was provided, upload it via updateAvatar
          if (file && (created as any).id) {
            const fd = new FormData();
            fd.append('file', file);
            await updateAvatar((created as any).id, fd);
          }

          // Close modal if possible
          const modal = document.getElementById('add_employee');
          if (modal) modal.classList.add('hidden');

          showNotification('Employee created successfully!');
          // Refresh DataTable and breadcrumb
          if (typeof $ !== 'undefined' && ($ as any).fn && ($ as any).fn.DataTable) {
            ($('.datatable').DataTable() as any).ajax.reload(null, false);
          }
          console.log('Employee created:', payload);
          await setupBreadcrumb();
        } catch (err: any) {
          console.error('Failed to create employee:', err);
          showNotification(err?.message || 'Failed to create employee', true);
        }
      });
    }

    // Handle the cancel button on the edit modal
    const editModal = document.getElementById('edit_employee');
    const cancelButton = editModal?.querySelector('#cancel-btn');
    if (editModal && cancelButton) {
        cancelButton.addEventListener('click', () => {
            editModal.classList.add('hidden');
        });
    }
}

/**
 * Loads employee details from backend and populates the employee-details page.
 * Called on page load if the page contains employee detail elements.
 */
async function loadEmployeeDetails() {
  // Get employee ID from URL query param: ?id=123
  const params = new URLSearchParams(window.location.search);
  const employeeId = params.get('id');
  
  if (!employeeId) {
    console.warn('No employee ID in URL query param');
    return;
  }

  try {
    const profile = await fetchProfileById(parseInt(employeeId, 10)) as Profile & any;

    // Populate profile header section
    const avatar = document.getElementById('employee-avatar') as HTMLImageElement;
    if (avatar && profile.avatarUrl) {
      avatar.src = profile.avatarUrl;
    }

    const name = document.getElementById('employee-name') as HTMLElement;
    if (name) {
      name.textContent = profile.fullName || 'N/A';
    }

    const phone = document.getElementById('employee-phone') as HTMLElement;
    if (phone) {
      phone.textContent = profile.phone || 'N/A';
    }

    const email = document.getElementById('employee-email') as HTMLElement;
    if (email) {
      const emailSpan = email.querySelector('.email-value') as HTMLElement;
      if (emailSpan) {
        emailSpan.textContent = profile.user?.email || 'N/A';
      }
    }

    const hireDate = document.getElementById('employee-hireDate') as HTMLElement;
    if (hireDate && profile.hireDate) {
      hireDate.textContent = new Date(profile.hireDate).toLocaleDateString();
    }

    const designation = document.getElementById('employee-designation') as HTMLElement;
    if (designation && profile.department) {
      designation.textContent = `Software Developer`; // You can replace this with a real designation field
    }

    // Populate form inputs
    const formFullName = document.getElementById('form-employee-fullName') as HTMLInputElement;
    if (formFullName) {
      formFullName.value = profile.fullName || '';
    }

    const formEmail = document.getElementById('form-employee-email') as HTMLInputElement;
    if (formEmail) {
      formEmail.value = profile.user?.email || '';
    }

    const formPhone = document.getElementById('form-employee-phone') as HTMLInputElement;
    if (formPhone) {
      formPhone.value = profile.phone || '';
    }

    const formDepartment = document.getElementById('form-employee-department') as HTMLSelectElement;
    if (formDepartment && profile.department) {
      formDepartment.value = profile.department;
    }

    console.log('Employee details loaded:', profile);
  } catch (error: any) {
    console.error('Failed to load employee details:', error);
    showNotification('Could not load employee details.', true);
  }
}

// --- Main execution block ---
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on the employee-details page
  if (document.getElementById('employee-name')) {
    loadEmployeeDetails();
  }

  // Initialize DataTable and attach all necessary event listeners (only on employees list page)
  if (document.querySelector('.datatable')) {
    initProfilesDataTable();
    setupActionListeners(); // Set up listeners for edit/delete
    setupStaticListeners(); // Set up form submissions and other static listeners
    setupBreadcrumb(); // Set up breadcrumb total employee count
  }
});

console.log("Application script loaded.");