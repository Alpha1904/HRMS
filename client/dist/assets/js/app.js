import { fetchProfiles, fetchProfileById, updateProfile, deleteProfile, updateAvatar, } from "./fetch.js";
// --- UI Helper Functions ---
/**
 * Displays a notification message.
 * @param message The message to display.
 * @param isError If true, styles the notification as an error.
 */
function showNotification(message, isError = false) {
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
function showConfirmation(message) {
    // This is a stand-in for a custom modal. In a real app, you would create
    // a proper modal element and handle its button clicks.
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
        modal.querySelector(`#${editFormFieldMap.fullName}`).value = profile.fullName || '';
        modal.querySelector(`#${editFormFieldMap.email}`).value = profile.user?.email || '';
        modal.querySelector(`#${editFormFieldMap.phone}`).value = profile.phone || '';
        modal.querySelector(`#${editFormFieldMap.department}`).value = profile.department || '';
        modal.querySelector(`#${editFormFieldMap.isActive}`).value = profile.user?.isActive ? 'Active' : 'Inactive';
        // Format the date for <input type="date"> (YYYY-MM-DD)
        if (profile.hireDate && modal.querySelector(`#${editFormFieldMap.hireDate}`)) {
            modal.querySelector('#edit-joining-date').value =
                new Date(profile.hireDate).toISOString().split('T')[0];
        }
        // Set avatar preview
        modal.querySelector('#edit-avatar-preview').src =
            profile.avatarUrl || 'assets/img/users/user-32.jpg';
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
    const form = event.target;
    const id = parseInt(form.querySelector('#edit-profile-id').value, 10);
    const saveButton = form.querySelector('button[type="submit"]');
    if (saveButton)
        saveButton.disabled = true;
    saveButton.textContent = 'Saving...';
    try {
        // --- Step 1: Handle Avatar Upload (if any) ---
        const avatarFileInput = form.querySelector('#edit-avatar-file');
        if (avatarFileInput.files && avatarFileInput.files.length > 0) {
            const formData = new FormData();
            formData.append('file', avatarFileInput.files[0]);
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
            // Exclude fields you don't want to send, like the file input or hidden IDs
            if (key === 'file' || key === 'profileId' || key === 'id' || key === 'empId')
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
        // Attach nested user payload if any user fields were present
        if (Object.keys(userPayload).length > 0) {
            updateProfileDto.user = userPayload;
        }
        console.log(updateProfileDto, " " + "update data");
        // Call the data update endpoint
        await updateProfile(id, updateProfileDto);
        // --- Step 3: Success ---
        showNotification('Profile updated successfully!');
        console.log('Profile updated:', updateProfileDto);
        // Manually hide the modal
        const modal = document.getElementById('edit_employee');
        if (modal) {
            modal.classList.add('hidden'); // Hide the modal on success
        }
        // Refresh the DataTable to show updated data
        $('.datatable').DataTable().ajax.reload(null, false);
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
    // Handle the cancel button on the edit modal
    const editModal = document.getElementById('edit_employee');
    const cancelButton = editModal?.querySelector('#cancel-btn');
    if (editModal && cancelButton) {
        cancelButton.addEventListener('click', () => {
            editModal.classList.add('hidden');
        });
    }
}
// --- Main execution block ---
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DataTable and attach all necessary event listeners
    initProfilesDataTable();
    setupActionListeners(); // Set up listeners for edit/delete
    setupStaticListeners(); // Set up form submissions and other static listeners
});
console.log("Application script loaded.");
//# sourceMappingURL=app.js.map