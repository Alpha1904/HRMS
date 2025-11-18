// client/src/fetch.ts
function normalizeBase(b) {
    return b.replace(/\/$/, '');
}
function detectApiBase() {
    if (typeof window !== 'undefined' && window.__API_BASE__) {
        return normalizeBase(window.__API_BASE__);
    }
    if (typeof window !== 'undefined' && window.location) {
        const port = window.location.port;
        const hostname = window.location.hostname;
        // Common static dev servers: Live Server uses port 5500/5501.
        if (port === '5500' || port === '5501' || hostname === '127.0.0.1') {
            return 'http://localhost:3000/api';
        }
    }
    return '/api';
}
const API_BASE_URL = detectApiBase();
const PROFILES_URL = `${API_BASE_URL}/profiles`;
/**
 * A helper function for handling fetch responses.
 */
async function handleResponse(response) {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
    }
    return response.json();
}
/**
 * Finds all profiles with pagination and filtering.
 * Corresponds to: @Get() findAll(@Query() query: QueryProfileDto)
 *
 * @param {object} [queryParams] - Optional query parameters (e.g., { page: 1, limit: 10, filter: 'Developer' })
 * @returns {Promise<object>} A paginated list of profiles and total count.
 */
export async function fetchProfiles(queryParams = {}) {
    // Build query string from provided params (page, limit, search, sortBy, sortOrder, etc.)
    const params = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
        if (value === undefined || value === null)
            return; // skip undefined values
        if (Array.isArray(value)) {
            value.forEach((v) => params.append(key, String(v)));
        }
        else {
            params.append(key, String(value));
        }
    });
    try {
        const url = params.toString() ? `${PROFILES_URL}?${params.toString()}` : PROFILES_URL;
        const response = await fetch(url);
        return await handleResponse(response); // expected shape: { data: [...], meta: { total, page, limit, lastPage } }
    }
    catch (err) {
        // Preserve HTTP error messages (e.g., 404) for callers to handle appropriately.
        console.error('fetchProfiles network error', err);
        throw err instanceof Error ? err : new Error('Network error: Unable to reach API');
    }
}
/**
 * Finds a single profile by its *Profile ID*.
 * Corresponds to: @Get(':id') findOne(@Param('id') id: number)
 * [cite: 37]
 * @param {number} id - The Profile ID.
 * @returns {Promise<object>} The profile object.
 */
export async function fetchProfileById(id) {
    const response = await fetch(`${PROFILES_URL}/${id}`);
    return handleResponse(response);
}
/**
 * Finds a single profile by its associated *User ID*.
 * Corresponds to: @Get('/user/:userId') findOneByUserId(@Param('userId') userId: number)
 * [cite: 38]
 * @param {number} userId - The User ID.
 * @returns {Promise<object>} The profile object.
 */
export async function fetchProfileByUserId(userId) {
    const response = await fetch(`${PROFILES_URL}/user/${userId}`);
    return handleResponse(response);
}
/**
 * Updates a profile by its *Profile ID*.
 * Corresponds to: @Patch(':id') update(@Param('id') id: number, @Body() updateProfileDto: UpdateProfileDto)
 * [cite: 34, 39]
 * @param {number} id - The Profile ID.
 * @param {object} updateProfileDto - The data to update (e.g., { phone: '...', designation: '...' }).
 * @returns {Promise<object>} The updated profile object.
 */
export async function updateProfile(id, updateProfileDto) {
    const response = await fetch(`${PROFILES_URL}/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateProfileDto),
    });
    return handleResponse(response);
}
/**
 * Updates a profile's avatar by its *Profile ID*.
 * Corresponds to: @Patch(':id/avatar') updateAvatar(...)
 *
 * @param {number} id - The Profile ID.
 * @param {FormData} formData - A FormData object containing the file (e.g., formData.append('file', fileInput.files[0])).
 * @returns {Promise<object>} The updated profile object.
 */
export async function updateAvatar(id, formData) {
    // Note: Do not set 'Content-Type' header.
    // The browser will automatically set it to 'multipart/form-data'
    // with the correct boundary when using FormData.
    const response = await fetch(`${PROFILES_URL}/${id}/avatar`, {
        method: 'PATCH',
        body: formData,
    });
    return handleResponse(response);
}
/**
 * Soft-deletes a profile by its *Profile ID*.
 * Corresponds to: @Delete(':id') remove(@Param('id') id: number)
 * [cite: 43]
 * @param {number} id - The Profile ID.
 * @returns {Promise<object>} A confirmation of the deletion.
 */
export async function deleteProfile(id) {
    const response = await fetch(`${PROFILES_URL}/${id}`, {
        method: 'DELETE',
    });
    return handleResponse(response);
}
//# sourceMappingURL=fetch.js.map