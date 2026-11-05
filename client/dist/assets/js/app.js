import { fetchProfiles, fetchProfileById, fetchProfileByUserId, detectApiBase, updateProfile, deleteProfile, updateAvatar, createProfile, } from "./fetch.js";
let currentEmployeeDetailsProfileId = null;
function applyProfileToEmployeeDetailsUI(profile) {
    const avatar = document.getElementById('employee-avatar');
    if (avatar && profile.avatarUrl)
        avatar.src = profile.avatarUrl;
    const name = document.getElementById('employee-name');
    if (name && typeof profile.fullName === 'string')
        name.textContent = profile.fullName || 'N/A';
    const phone = document.getElementById('employee-phone');
    if (phone && typeof profile.phone === 'string')
        phone.textContent = profile.phone || 'N/A';
    const email = document.getElementById('employee-email');
    if (email && profile.user?.email) {
        const emailSpan = email.querySelector('.email-value');
        if (emailSpan)
            emailSpan.textContent = profile.user.email || 'N/A';
    }
    const hireDate = document.getElementById('employee-hireDate');
    if (hireDate && profile.hireDate)
        hireDate.textContent = new Date(profile.hireDate).toLocaleDateString();
    const formFullName = document.getElementById('form-employee-fullName');
    if (formFullName && typeof profile.fullName === 'string')
        formFullName.value = profile.fullName || '';
    const formEmail = document.getElementById('form-employee-email');
    if (formEmail && profile.user?.email)
        formEmail.value = profile.user.email || '';
    const formPhone = document.getElementById('form-employee-phone');
    if (formPhone && typeof profile.phone === 'string')
        formPhone.value = profile.phone || '';
    const formDepartment = document.getElementById('form-employee-department');
    if (formDepartment && typeof profile.department === 'string')
        formDepartment.value = profile.department || '';
}
// ----- Breadcrumb ------
async function setupBreadcrumb() {
    const bcTotal = document.getElementById('bco');
    const totalActive = document.getElementById('bct');
    const totalInactive = document.getElementById('bctt');
    const tottalNewJoiners = document.getElementById('bcf');
    try {
        // First, request a minimal page to learn pagination metadata (if backend returns it)
        const head = await fetchProfiles({ page: 1, limit: 1 });
        const total = head?.meta?.total ?? (Array.isArray(head?.data) ? head.data.length : 0);
        if (bcTotal)
            bcTotal.textContent = String(total);
        // If backend provides active/inactive counts in meta, use them directly
        if (head?.meta && typeof head.meta.active === 'number' && typeof head.meta.inactive === 'number') {
            if (totalActive)
                totalActive.textContent = String(head.meta.active);
            if (totalInactive)
                totalInactive.textContent = String(head.meta.inactive);
            // Use server-provided new-joiners if available (common keys: news, newJoiners, new)
            const metaNew = typeof head.meta.news === 'number' ? head.meta.news :
                typeof head.meta.newJoiners === 'number' ? head.meta.newJoiners :
                    typeof head.meta.new === 'number' ? head.meta.new : undefined;
            if (typeof metaNew === 'number') {
                if (tottalNewJoiners)
                    tottalNewJoiners.textContent = String(metaNew);
            }
            else if (tottalNewJoiners) {
                tottalNewJoiners.textContent = '0';
            }
            return;
        }
        // Otherwise we need to compute active/inactive client-side.
        // If total is reasonably small, fetch all profiles once; otherwise fetch a sample and mark as estimated.
        if (total > 0 && total <= 2000) {
            const all = await fetchProfiles({ page: 1, limit: total });
            const profiles = all?.data ?? [];
            const activeCount = profiles.filter((p) => p.user?.isActive).length;
            const inactiveCount = profiles.length - activeCount;
            if (totalActive)
                totalActive.textContent = String(activeCount);
            if (totalInactive)
                totalInactive.textContent = String(inactiveCount);
            // Compute new joiners (last 7 days) from hireDate or createdAt
            if (tottalNewJoiners) {
                const now = Date.now();
                const sevenDays = 7 * 24 * 60 * 60 * 1000;
                const newCount = profiles.filter((p) => {
                    const d = p.hireDate ? new Date(p.hireDate) : p.createdAt ? new Date(p.createdAt) : null;
                    return d && !isNaN(d.getTime()) && (now - d.getTime()) <= sevenDays;
                }).length;
                tottalNewJoiners.textContent = String(newCount);
            }
            return;
        }
        if (total > 2000) {
            // Large dataset: fetch a sample and show approximate counts with a '+' indicator.
            const sampleLimit = Math.min(1000, total);
            const sample = await fetchProfiles({ page: 1, limit: sampleLimit });
            const profiles = sample?.data ?? [];
            const activeInSample = profiles.filter((p) => p.user?.isActive).length;
            const inactiveInSample = profiles.length - activeInSample;
            const activeText = `${activeInSample}${total > sampleLimit ? '+' : ''}`;
            const inactiveText = `${inactiveInSample}${total > sampleLimit ? '+' : ''}`;
            if (totalActive)
                totalActive.textContent = activeText;
            if (totalInactive)
                totalInactive.textContent = inactiveText;
            // Estimate new joiners in sample (last 7 days)
            if (tottalNewJoiners) {
                const now = Date.now();
                const sevenDays = 7 * 24 * 60 * 60 * 1000;
                const newInSample = profiles.filter((p) => {
                    const d = p.hireDate ? new Date(p.hireDate) : p.createdAt ? new Date(p.createdAt) : null;
                    return d && !isNaN(d.getTime()) && (now - d.getTime()) <= sevenDays;
                }).length;
                tottalNewJoiners.textContent = `${newInSample}${total > sampleLimit ? '+' : ''}`;
            }
            return;
        }
        // Fallback: no data
        if (totalActive)
            totalActive.textContent = '0';
        if (totalInactive)
            totalInactive.textContent = '0';
    }
    catch (err) {
        console.error('Failed to load breadcrumb total:', err);
        if (bcTotal)
            bcTotal.textContent = '0';
        const totalActive = document.getElementById('bct');
        const totalInactive = document.getElementById('bctt');
        if (totalActive)
            totalActive.textContent = '0';
        if (totalInactive)
            totalInactive.textContent = '0';
        if (tottalNewJoiners)
            tottalNewJoiners.textContent = '0';
    }
}
// --- UI Helper Functions ---
/**
 * Displays a notification message.
 * @param message The message to display.
 * @param isError If true, styles the notification as an error.
 */
function showNotification(message, isError = false) {
    console.log(`Notification: ${message}`, isError ? 'Error' : 'Success');
    const maybeToastify = window.Toastify;
    if (typeof maybeToastify === 'function') {
        maybeToastify({
            text: message,
            duration: 3500,
            close: true,
            gravity: 'top',
            position: 'right',
            stopOnFocus: true,
            style: {
                background: isError
                    ? 'linear-gradient(to right, #ef4444, #b91c1c)'
                    : 'linear-gradient(to right, #22c55e, #16a34a)',
                borderRadius: '10px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                fontSize: '14px',
                padding: '12px 14px',
            },
        }).showToast();
        return;
    }
    alert(message);
}
/**
 * Shows a confirmation modal and returns a promise that resolves when the user confirms or rejects.
 * @param message The confirmation message.
 * @returns A promise that resolves to true if confirmed, false otherwise.
 */
function showConfirmation(message) {
    const maybeSwal = window.Swal;
    if (maybeSwal && typeof maybeSwal.fire === 'function') {
        return maybeSwal
            .fire({
            title: 'Confirm',
            text: message,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'Cancel',
            reverseButtons: true,
            focusCancel: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
        })
            .then((result) => !!result.isConfirmed);
    }
    return Promise.resolve(confirm(message));
}
/**
 * A map to link form field IDs to the profile data keys.
 * This centralizes the logic for populating and reading the form.
 */
const editFormFieldMap = {
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
    const columnMap = {
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
        ajax: async (data, callback) => {
            try {
                const start = Number(data.start || 0);
                const length = Number(data.length || 10);
                const page = Math.floor(start / length) + 1;
                const searchValue = data.search && data.search.value ? data.search.value : undefined;
                // Determine sorting
                let sortBy;
                let sortOrder;
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
            }
            catch (err) {
                console.error('DataTable AJAX error', err);
                callback({ data: [], recordsTotal: 0, recordsFiltered: 0 });
            }
        },
        columns: [
            { data: null, orderable: false, searchable: false, render: (d) => `
          <div class="flex items-center">
            <input class="row-checkbox size-4 bg-white border border-borderColor rounded text-primary focus:ring-0" type="checkbox" value="${d.id}">
          </div>` },
            { data: 'id', render: (d) => `Emp-${d}` },
            { data: 'fullName', render: (d, t, row) => {
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
            { data: 'department', render: (d, t, row) => `
          <div>
            <a href="javascript:void(0);" class="border rounded p-2 bg-white inline-flex items-center ...">
              ${row.department || 'N/A'}
              <i class="ti ti-chevron-down ml-1"></i>
            </a>
          </div>` },
            { data: 'hireDate', render: (d) => d ? new Date(d).toLocaleDateString() : '' },
            { data: 'user.isActive', render: (d) => `
          <span class="${d ? 'bg-success' : 'bg-danger'} text-white rounded ...">
            <i class="ti ti-point-filled me-1"></i>${d ? 'Active' : 'Inactive'}
          </span>` },
            { data: null, orderable: false, searchable: false, render: (d) => `
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
        createdRow: function (row, data) {
            // Allow action listeners on dynamically created buttons
            // No-op; we use event delegation in setupActionListeners
        }
    });
}
/**
 * Sets up event listeners for the page's action buttons.
 */
function setupActionListeners() {
    const tableBody = document.querySelector('.datatable tbody');
    if (!tableBody)
        return;
    tableBody.addEventListener('click', async (e) => {
        // Find the closest action button
        const target = e.target;
        const editButton = target.closest('.edit-btn');
        const deleteButton = target.closest('.delete-btn');
        const checkbox = target.closest('input.row-checkbox');
        // Handle checkbox selection to highlight row
        if (checkbox) {
            const row = checkbox.closest('tr');
            if (row) {
                if (checkbox.checked) {
                    row.classList.add('bg-red-200');
                }
                else {
                    row.classList.remove('bg-red-200');
                }
            }
            return;
        }
        if (editButton) {
            e.preventDefault();
            const idString = editButton.dataset.id;
            console.log("edit clicked");
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
            if (!idString)
                return;
            const confirmed = await showConfirmation('Are you sure you want to delete this profile?');
            if (confirmed) {
                try {
                    await deleteProfile(parseInt(idString, 10));
                    showNotification('Profile deleted successfully.');
                    $('.datatable').DataTable().ajax.reload(null, false); // Reload data from server
                }
                catch (error) {
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
async function populateEditModal(id, modalId) {
    const modal = document.getElementById(modalId);
    if (!modal)
        return;
    modal.classList.remove('hidden'); // Show the modal
    // Show a loading state (optional)
    const form = modal.querySelector('form');
    if (form)
        form.reset(); // Clear old data    
    try {
        // 1. Call the API to get the latest data
        const profile = await fetchProfileById(id);
        // 2. Populate the form fields
        // Note: Field names ('firstName', 'lastName') are assumptions
        modal.querySelector('#edit-profile-id').value = String(profile.id);
        modal.querySelector('#edit-emp-id').value = `Emp-${profile.id}`;
        // Use the centralized map to populate fields
        const fullNameEl = modal.querySelector(`#${editFormFieldMap.fullName}`);
        if (fullNameEl)
            fullNameEl.value = profile.fullName || '';
        const emailEl = modal.querySelector(`#${editFormFieldMap.email}`);
        if (emailEl)
            emailEl.value = profile.user?.email || '';
        const phoneEl = modal.querySelector(`#${editFormFieldMap.phone}`);
        if (phoneEl)
            phoneEl.value = profile.phone || '';
        const deptEl = modal.querySelector(`#${editFormFieldMap.department}`);
        if (deptEl)
            deptEl.value = profile.department || '';
        const statusEl = modal.querySelector(`#${editFormFieldMap.isActive}`);
        if (statusEl)
            statusEl.value = profile.user?.isActive ? 'Active' : 'Inactive';
        // Format the date for <input type="date"> (YYYY-MM-DD)
        if (profile.hireDate && modal.querySelector(`#${editFormFieldMap.hireDate}`)) {
            modal.querySelector('#edit-joining-date').value =
                new Date(profile.hireDate).toISOString().split('T')[0];
        }
        // Set avatar preview
        const avatarPreview = modal.querySelector('#edit-avatar-preview');
        if (avatarPreview) {
            avatarPreview.src = profile.avatarUrl || 'assets/img/users/user-32.jpg';
        }
    }
    catch (error) {
        console.error('Failed to fetch profile data:', error);
        showNotification('Could not load employee data.', true);
    }
}
/**
 * Handles the submission of the edit form.
 */
async function handleEditFormSubmit(event) {
    event.preventDefault();
    event.stopPropagation();
    const form = event.target;
    const id = parseInt(form.querySelector('#edit-profile-id').value, 10);
    const saveButton = form.querySelector('button[type="submit"]');
    if (saveButton)
        saveButton.disabled = true;
    saveButton.textContent = 'Saving...';
    try {
        // --- Step 1: Handle Avatar Upload (if any) ---
        const avatarFileInput = form.querySelector('#edit-avatar-file');
        const avatarFile = avatarFileInput?.files && avatarFileInput.files.length > 0 ? avatarFileInput.files[0] : null;
        if (avatarFile) {
            const formData = new FormData();
            formData.append('file', avatarFile);
            // Call the avatar endpoint
            await updateAvatar(id, formData);
        }
        // --- Step 2: Handle Profile Data Update ---
        const formValues = new FormData(form);
        const updateProfileDto = {};
        // Build the DTO from form data, ensuring names match the DTO keys.
        // Collect any user-related fields separately so we can send them nested as `user: { ... }`.
        const userPayload = {};
        formValues.forEach((value, key) => {
            // Exclude fields you don't want to send, like hidden IDs
            if (key === 'profileId' || key === 'id' || key === 'empId')
                return;
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
        // Never send avatarUrl from this form (we handle avatar upload via updateAvatar)
        delete updateProfileDto.avatarUrl;
        // Attach nested user payload if any user fields were present
        if (Object.keys(userPayload).length > 0) {
            updateProfileDto.user = userPayload;
        }
        console.log(updateProfileDto, " " + "update data");
        // Call the data update endpoint
        await updateProfile(id, updateProfileDto);
        // Fetch the latest profile and update UI immediately (employee-details page)
        try {
            if (currentEmployeeDetailsProfileId && currentEmployeeDetailsProfileId === id) {
                const updated = await fetchProfileById(id);
                applyProfileToEmployeeDetailsUI(updated);
            }
        }
        catch (e) {
            console.warn('Could not refresh employee-details UI after update', e);
        }
        // --- Step 3: Success ---
        showNotification('Profile updated successfully!');
        console.log('Profile updated:', updateProfileDto);
        // Manually hide the modal
        const modal = document.getElementById('edit_employee');
        if (modal) {
            modal.classList.add('hidden'); // Hide the modal on success
        }
        // Refresh the DataTable to show updated data (employees list page)
        if (document.querySelector('.datatable') && $.fn && $.fn.DataTable && $.fn.DataTable.isDataTable('.datatable')) {
            $('.datatable').DataTable().ajax.reload(null, false);
        }
    }
    catch (error) {
        console.error('Failed to update profile:', error);
        showNotification(`Error: ${error.message}`, true);
    }
    finally {
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
    const addForm = document.querySelector('#add_employee form');
    if (addForm) {
        addForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // Attempt to build a payload from commonly used field names
            const form = e.target;
            const normalizeDateToYMD = (raw) => {
                const v = (raw || '').trim();
                if (!v)
                    return '';
                // Already ISO date (from <input type="date">)
                if (/^\d{4}-\d{2}-\d{2}$/.test(v))
                    return v;
                // Common UI format: dd/mm/yyyy or dd-mm-yyyy
                const m = v.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
                if (m) {
                    const dd = String(m[1]).padStart(2, '0');
                    const mm = String(m[2]).padStart(2, '0');
                    const yyyy = m[3];
                    return `${yyyy}-${mm}-${dd}`;
                }
                // Last resort: try Date parsing
                const d = new Date(v);
                if (!Number.isNaN(d.getTime()))
                    return d.toISOString().slice(0, 10);
                return '';
            };
            const get = (selector) => {
                const el = form.querySelector(selector);
                return el ? (el.value || '').trim() : '';
            };
            const payload = {
                email: get('[name="email"]') || get('input[placeholder*="Email"]'),
                isActive: true,
                role: get('[name="role"]') || get('select') || get('input[placeholder*="role"]'),
                password: get('[name="password"]') || get('input[placeholder*="Password"]'),
                profile: {
                    fullName: get('[name="fullName"]') || get('input[placeholder*="Full Name"]') || get('input[aria-label*="Full Name"]'),
                    phone: get('[name="phone"]') || get('input[placeholder*="Phone"]'),
                    hireDate: normalizeDateToYMD(get('[name="hireDate"]') || get('input[placeholder*="dd/mm/yyyy"]') || get('input[type="date"]')),
                    department: get('[name="department"]') || get('select') || get('input[placeholder*="Department"]'),
                },
            };
            // Clean payload by removing empty strings
            Object.keys(payload).forEach((k) => {
                if (payload[k] === '' || payload[k] === undefined || payload[k] === null)
                    delete payload[k];
            });
            // Normalize and validate role: backend expects one of the enum values
            const allowedRoles = ['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'RECRUITER', 'CANDIDATE', 'SYSTEM_ADMIN'];
            let rawRole = '';
            if (payload.role)
                rawRole = String(payload.role).trim();
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
            const fileInput = form.querySelector('input[type="file"]');
            let file = null;
            if (fileInput && fileInput.files && fileInput.files.length > 0) {
                file = fileInput.files[0];
            }
            try {
                const created = await createProfile(payload);
                // If avatar was provided, upload it via updateAvatar
                if (file && created.id) {
                    const fd = new FormData();
                    fd.append('file', file);
                    await updateAvatar(created.id, fd);
                }
                // Close modal if possible
                const modal = document.getElementById('add_employee');
                if (modal)
                    modal.classList.add('hidden');
                showNotification('Employee created successfully!');
                // Refresh DataTable and breadcrumb
                if (typeof $ !== 'undefined' && $.fn && $.fn.DataTable) {
                    $('.datatable').DataTable().ajax.reload(null, false);
                }
                console.log('Employee created:', payload);
                await setupBreadcrumb();
            }
            catch (err) {
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
function setupEmployeeDetailsEditModal() {
    const modal = document.getElementById('edit_employee');
    if (!modal)
        return;
    const openers = document.querySelectorAll('[data-modal-toggle="edit_employee"]');
    if (openers.length === 0)
        return;
    openers.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!currentEmployeeDetailsProfileId) {
                showNotification('No employee selected to edit.', true);
                return;
            }
            populateEditModal(currentEmployeeDetailsProfileId, 'edit_employee');
        });
    });
}
/**
 * Loads employee details from backend and populates the employee-details page.
 * Called on page load if the page contains employee detail elements.
 */
async function loadEmployeeDetails() {
    // Get employee ID from URL query param: ?id=123
    const params = new URLSearchParams(window.location.search);
    const employeeId = params.get('id');
    const getStoredCurrentUserId = () => {
        const direct = sessionStorage.getItem('currentUserId') ||
            localStorage.getItem('currentUserId') ||
            sessionStorage.getItem('userId') ||
            localStorage.getItem('userId');
        if (direct) {
            const n = parseInt(String(direct), 10);
            if (!Number.isNaN(n) && n > 0)
                return n;
        }
        const userStr = sessionStorage.getItem('user') || localStorage.getItem('user');
        if (userStr) {
            try {
                const u = JSON.parse(userStr);
                const id = u?.id ?? u?.user?.id;
                const n = typeof id === 'number' ? id : parseInt(String(id || ''), 10);
                if (!Number.isNaN(n) && n > 0)
                    return n;
            }
            catch (_) {
                return null;
            }
        }
        return null;
    };
    const getStoredAccessToken = () => sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
    const resolveProfileIdToLoad = async () => {
        // 1) Explicit query param always wins
        if (employeeId) {
            const n = parseInt(employeeId, 10);
            return Number.isNaN(n) ? null : n;
        }
        // 2) If no query param, try to use current authenticated user
        const uid = getStoredCurrentUserId();
        if (uid) {
            try {
                const profile = await fetchProfileByUserId(uid);
                const pid = profile?.id;
                const n = typeof pid === 'number' ? pid : parseInt(String(pid || ''), 10);
                return !Number.isNaN(n) && n > 0 ? n : null;
            }
            catch (_) {
                // Fall through to /auth/me
            }
        }
        // 3) Fallback: call /auth/me (requires token)
        const token = getStoredAccessToken();
        if (!token)
            return null;
        try {
            const API_BASE_URL = detectApiBase();
            const res = await fetch(`${API_BASE_URL}/auth/me`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
                credentials: 'include',
            });
            if (!res.ok)
                return null;
            const me = await res.json();
            const id = me?.id ?? me?.user?.id;
            const n = typeof id === 'number' ? id : parseInt(String(id || ''), 10);
            if (Number.isNaN(n) || n <= 0)
                return null;
            // store for later pages
            sessionStorage.setItem('currentUserId', String(n));
            const profile = await fetchProfileByUserId(n);
            const pid = profile?.id;
            const pn = typeof pid === 'number' ? pid : parseInt(String(pid || ''), 10);
            return !Number.isNaN(pn) && pn > 0 ? pn : null;
        }
        catch (_) {
            return null;
        }
    };
    const profileId = await resolveProfileIdToLoad();
    if (!profileId) {
        window.location.href = 'login.html';
        return;
    }
    currentEmployeeDetailsProfileId = profileId;
    try {
        const profile = await fetchProfileById(profileId);
        // Populate profile header section
        const avatar = document.getElementById('employee-avatar');
        if (avatar && profile.avatarUrl) {
            avatar.src = profile.avatarUrl;
        }
        const name = document.getElementById('employee-name');
        if (name) {
            name.textContent = profile.fullName || 'N/A';
        }
        const phone = document.getElementById('employee-phone');
        if (phone) {
            phone.textContent = profile.phone || 'N/A';
        }
        const email = document.getElementById('employee-email');
        if (email) {
            const emailSpan = email.querySelector('.email-value');
            if (emailSpan) {
                emailSpan.textContent = profile.user?.email || 'N/A';
            }
        }
        const hireDate = document.getElementById('employee-hireDate');
        if (hireDate && profile.hireDate) {
            hireDate.textContent = new Date(profile.hireDate).toLocaleDateString();
        }
        const designation = document.getElementById('employee-designation');
        if (designation && profile.department) {
            designation.textContent = `Software Developer`; // You can replace this with a real designation field
        }
        // Populate form inputs
        const formFullName = document.getElementById('form-employee-fullName');
        if (formFullName) {
            formFullName.value = profile.fullName || '';
        }
        const formEmail = document.getElementById('form-employee-email');
        if (formEmail) {
            formEmail.value = profile.user?.email || '';
        }
        const formPhone = document.getElementById('form-employee-phone');
        if (formPhone) {
            formPhone.value = profile.phone || '';
        }
        const formDepartment = document.getElementById('form-employee-department');
        if (formDepartment && profile.department) {
            formDepartment.value = profile.department;
        }
        console.log('Employee details loaded:', profile);
    }
    catch (error) {
        console.error('Failed to load employee details:', error);
        showNotification('Could not load employee details.', true);
    }
}
// --- Main execution block ---
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the employee-details page
    if (document.getElementById('employee-name')) {
        loadEmployeeDetails();
        setupEmployeeDetailsEditModal();
        setupStaticListeners();
    }
    // Redirect "Dashboard" link based on current user role
    const backToDashboard = document.getElementById('backToDashboard');
    if (backToDashboard) {
        const link = backToDashboard.querySelector('a');
        if (link) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const roleFromStorage = () => {
                    const direct = sessionStorage.getItem('currentUserRole') ||
                        localStorage.getItem('currentUserRole') ||
                        sessionStorage.getItem('role') ||
                        localStorage.getItem('role');
                    if (direct)
                        return direct;
                    const userStr = sessionStorage.getItem('user') || localStorage.getItem('user');
                    if (userStr) {
                        try {
                            const u = JSON.parse(userStr);
                            return u?.role || u?.user?.role;
                        }
                        catch (_) {
                            return null;
                        }
                    }
                    return null;
                };
                const role = String(roleFromStorage() || '').toUpperCase();
                let dest = 'dashboard.employee.html';
                switch (role) {
                    case 'MANAGER':
                        dest = 'dashboard.manager.html';
                        break;
                    case 'HR_ADMIN':
                    case 'SYSTEM_ADMIN':
                    case 'ADMIN':
                    case 'RECRUITER':
                        dest = 'dashboard.admin.html';
                        break;
                    case 'EMPLOYEE':
                    default:
                        dest = 'dashboard.employee.html';
                        break;
                }
                window.location.href = dest;
            });
        }
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
//# sourceMappingURL=app.js.map