/**
 * Based on main.ts, the global prefix is 'api'.
 * We assume the server is running on port 3000.
 * [cite: 46, 49]
 */
declare global {
    interface Window {
        __API_BASE__?: string;
    }
}
/**
 * Finds all profiles with pagination and filtering.
 * Corresponds to: @Get() findAll(@Query() query: QueryProfileDto)
 *
 * @param {object} [queryParams] - Optional query parameters (e.g., { page: 1, limit: 10, filter: 'Developer' })
 * @returns {Promise<object>} A paginated list of profiles and total count.
 */
export declare function fetchProfiles(queryParams?: Record<string, any>): Promise<any>;
/**
 * Finds a single profile by its *Profile ID*.
 * Corresponds to: @Get(':id') findOne(@Param('id') id: number)
 * [cite: 37]
 * @param {number} id - The Profile ID.
 * @returns {Promise<object>} The profile object.
 */
export declare function fetchProfileById(id: number): Promise<object>;
/**
 * Finds a single profile by its associated *User ID*.
 * Corresponds to: @Get('/user/:userId') findOneByUserId(@Param('userId') userId: number)
 * [cite: 38]
 * @param {number} userId - The User ID.
 * @returns {Promise<object>} The profile object.
 */
export declare function fetchProfileByUserId(userId: number): Promise<object>;
/**
 * Updates a profile by its *Profile ID*.
 * Corresponds to: @Patch(':id') update(@Param('id') id: number, @Body() updateProfileDto: UpdateProfileDto)
 * [cite: 34, 39]
 * @param {number} id - The Profile ID.
 * @param {object} updateProfileDto - The data to update (e.g., { phone: '...', designation: '...' }).
 * @returns {Promise<object>} The updated profile object.
 */
export declare function updateProfile(id: number, updateProfileDto: object): Promise<object>;
/**
 * Updates a profile's avatar by its *Profile ID*.
 * Corresponds to: @Patch(':id/avatar') updateAvatar(...)
 *
 * @param {number} id - The Profile ID.
 * @param {FormData} formData - A FormData object containing the file (e.g., formData.append('file', fileInput.files[0])).
 * @returns {Promise<object>} The updated profile object.
 */
export declare function updateAvatar(id: number, formData: FormData): Promise<object>;
/**
 * Soft-deletes a profile by its *Profile ID*.
 * Corresponds to: @Delete(':id') remove(@Param('id') id: number)
 * [cite: 43]
 * @param {number} id - The Profile ID.
 * @returns {Promise<object>} A confirmation of the deletion.
 */
export declare function deleteProfile(id: number): Promise<object>;
//# sourceMappingURL=fetch.d.ts.map