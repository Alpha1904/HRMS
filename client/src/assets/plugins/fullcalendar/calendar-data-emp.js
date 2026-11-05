import { fetchAllSchedules, detectApiBase, fetchManagerById, newShift, updateShift, reassignShift, fetchProfileById } from '../../../../dist/assets/js/fetch.js';

// --- CONSTANTS ---
const employeeData = [
    { id: '1', name: 'John Doe', position: 'Software Engineer', avatarUrl: 'https://i.pravatar.cc/150?img=1' },
    // ... (rest of your static data can remain here or be fetched)
];

const API_BASE_URL = detectApiBase();

// Toast helper (falls back to alert if Toastify isn't available)
const showToast = (message, type = 'info') => {
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
    };
    if (typeof window !== 'undefined' && window.Toastify) {
        window.Toastify({
            text: message,
            duration: 4000,
            gravity: 'top',
            position: 'right',
            backgroundColor: colors[type],
            stopOnFocus: true,
        }).showToast();
    } else {
        alert(message);
    }
};

/**
 * Helper: Fetch Current User
 */
const getCurrentUser = async () => {
    try {
        const token = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : null;
        const headers = { 'Content-Type': 'application/json' };
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
        const user = await response.json();
        console.log('Current User:', user);
        return { id: user?.id, role: user?.role || 'EMPLOYEE' };
    } catch (error) {
        console.error('Error fetching current user:', error);
        return { role: 'EMPLOYEE' };
    }
}

// fetch profile by id
const fetchProfileId = async () => {
    try {
        const currentUser = await getCurrentUser();
        const userId = currentUser?.id;
        const emp = await fetchProfileById(userId);
        console.log('Profile by ID:', emp);
        return emp;
    } catch (error) {
        console.error('Error fetching profile by ID:', error);
    }
};


/**
 * Helper: Fetch Employees
 */
async function fetchAllEmployees() {
    const managerId = (await fetchProfileId())?.managerId;
    if (!managerId) {
        console.warn('Manager ID not found for current user');
        return [];
    }

    try {
        const response = await fetchManagerById(managerId);
        // Some APIs return { data: [...] } or an array directly — normalize to an array.
        if (!response) return [];
        if (Array.isArray(response)) return response;
        if (Array.isArray(response.data)) return response.data;
        // If response is a single object, wrap it to keep downstream code consistent.
        return [response];
    } catch (error) {
        console.error('Error fetching employees by manager ID:', error);
        return [];
    }
};

/**
 * Helper: Process Events for Calendar
 */
function processDynamicEvents(dataArray) {
    let fcEvents = [];
    const colors = ['#f56954', '#00a65a', '#f39c12', '#0073b7', '#605ca8'];
    let colorIndex = 0;

    if (!Array.isArray(dataArray)) {
        console.warn("Invalid dataArray passed to processDynamicEvents", dataArray);
        return [];
    }

    if (dataArray.length === 0) {
        console.warn("No events in dataArray to process");
        return [];
    }

    dataArray.forEach((event, index) => {
        const color = colors[colorIndex % colors.length];

        // --- FIX STARTS HERE ---
        
        // 1. Safe extraction of the Date part (YYYY-MM-DD)
        // We take the first 10 characters of event.date
        let datePart = event.date ? event.date.substring(0, 10) : null;

        // 2. Safe extraction of the Time part (HH:mm:ss)
        let timePartStart = '00:00:00';
        let timePartEnd = '23:59:59';

        // Extract Start Time
        if (event.startTime) {
            if (event.startTime.includes('T')) {
                // If it's "1970-01-01T09:00:00.000Z", split by T and take the time
                const splitTime = event.startTime.split('T')[1]; // "09:00:00.000Z"
                timePartStart = splitTime.substring(0, 8); // "09:00:00"
            } else {
                // It is already "09:00" or "09:00:00"
                timePartStart = event.startTime;
            }
        }

        // Extract End Time
        if (event.endTime) {
            if (event.endTime.includes('T')) {
                const splitTime = event.endTime.split('T')[1];
                timePartEnd = splitTime.substring(0, 8);
            } else {
                timePartEnd = event.endTime;
            }
        }

        // 3. Combine to create correct ISO strings for the calendar
        const startIso = `${datePart}T${timePartStart}`;
        const endIso = `${datePart}T${timePartEnd}`;
        
        // --- FIX ENDS HERE ---

        // Validate timestamps
        const startObj = new Date(startIso);
        const endObj = new Date(endIso);
        
        if (isNaN(startObj.getTime()) || isNaN(endObj.getTime())) {
            console.warn(`Event ${index} has invalid dates:`, startIso, endIso);
            return; 
        }

        // Create Format for Display (Tooltip/Card)
        const timeOptions = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
        const formatStartTime = startObj.toLocaleTimeString('en-US', timeOptions);
        const formatEndTime = endObj.toLocaleTimeString('en-US', timeOptions);
        const timerString = `${formatStartTime} - ${formatEndTime}`;

        if (event.profile && Array.isArray(event.profile)) {
            event.profile.forEach(profile => {
                const fcEvent = {
                    // FullCalendar event IDs must be unique. A single shift can be assigned to multiple profiles,
                    // so we namespace the FC event id by profile id.
                    id: `${event.id}-${profile.id}`,
                    resourceId: String(profile.id), 
                    title: event.title || 'Untitled Event',
                    start: startIso,   
                    end: endIso,       
                    allDay: false,     
                    backgroundColor: color, 
                    borderColor: color,
                    extendedProps: {
                        shiftId: event.id,
                        description: event.description || 'No description',
                        timer: timerString,
                        isCompleted: event.isCompleted || false  // Include completed status
                    }
                };
                fcEvents.push(fcEvent);
            });
        }
        colorIndex++;
    })
    
    console.log("Final Fixed Events for FC:", fcEvents);
    return fcEvents;
}
// --- GLOBAL STATE FOR EDITING ---
let currentEventData = null; // Store current event data for editing

// --- FORM HANDLER FOR ADD EVENT ---
function initializeAddEventForm() {
    const form = document.getElementById('add-event-form');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        // Prevent any other listeners from triggering a native submit/navigation.
        if (typeof e.stopImmediatePropagation === 'function') {
            e.stopImmediatePropagation();
        }
        
        // Get form values
        const title = document.getElementById('event-title').value.trim();
        const date = document.getElementById('event-date').value.trim();
        const startTime = document.getElementById('event-start-time').value.trim();
        const endTime = document.getElementById('event-end-time').value.trim();
        const employeeSelectEl = document.getElementById('select-emp');
        const selectedEmployees = Array.from(employeeSelectEl.selectedOptions)
            .map(option => {
                const val = parseInt(option.value, 10);
                return !isNaN(val) ? val : null;
            })
            .filter(val => val !== null);
        const description = document.getElementById('event-description').value.trim();
        
        // Validation
        if (!title || !date || !startTime || !endTime || selectedEmployees.length === 0) {
            showToast('Please fill in all required fields and select at least one employee', 'warning');
            return;
        }
        
        // Additional validation for employee IDs
        if (selectedEmployees.some(id => typeof id !== 'number')) {
            showToast('Invalid employee selection. Please try again.', 'warning');
            console.error('Invalid employee IDs:', selectedEmployees);
            return;
        }
        
        try {
            // Show loading state on submit button
            const submitBtn = document.getElementById('submit-event-btn');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Processing...';
            
            // Convert date format from DD-MM-YYYY to YYYY-MM-DD
            let formattedDate = date;
            if (date.includes('-')) {
                const dateParts = date.split('-');
                if (dateParts.length === 3) {
                    // Check if it's DD-MM-YYYY format
                    if (dateParts[2].length === 4) {
                        formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
                    }
                }
            }
            
            // Check if we're editing or creating
            if (currentEventData && currentEventData.id) {
                // UPDATE MODE
                const completedCheckbox = document.getElementById('eventCompleted');
                const isCompleted = completedCheckbox ? !!completedCheckbox.checked : undefined;
                const updatePayload = {
                    date: formattedDate,
                    startTime: startTime.substring(0, 5),
                    endTime: endTime.substring(0, 5),
                    title: title,
                    description: description,
                    ...(isCompleted === undefined ? {} : { isCompleted })
                };
                
                const shiftIdForUpdate = currentEventData.shiftId || currentEventData.id;
                console.log('Updating shift with ID:', shiftIdForUpdate, 'Payload:', updatePayload);
                const response = await updateShift(shiftIdForUpdate, updatePayload);
                
                console.log('Event updated successfully:', response);
                showToast('Event updated successfully!', 'success');

                // Keep local state in sync
                currentEventData.title = title;
                currentEventData.description = description;
                if (isCompleted !== undefined) {
                    currentEventData.isCompleted = isCompleted;
                }

                // Update event in the current calendar view without a hard refresh
                const cal = (typeof window !== 'undefined' && window.__hrmsCalendar) ? window.__hrmsCalendar : null;
                if (cal) {
                    const shiftId = currentEventData.shiftId || currentEventData.id;
                    const allEvents = typeof cal.getEvents === 'function' ? cal.getEvents() : [];

                    // Build ISO timestamps (YYYY-MM-DDTHH:mm)
                    const startIso = `${formattedDate}T${startTime.substring(0, 5)}:00`;
                    const endIso = `${formattedDate}T${endTime.substring(0, 5)}:00`;
                    const startObj = new Date(startIso);
                    const endObj = new Date(endIso);

                    const timeOptions = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
                    const newTimer = (!isNaN(startObj.getTime()) && !isNaN(endObj.getTime()))
                        ? `${startObj.toLocaleTimeString('en-US', timeOptions)} - ${endObj.toLocaleTimeString('en-US', timeOptions)}`
                        : '';

                    const affected = allEvents.filter((ev) => String(ev.extendedProps?.shiftId) === String(shiftId));
                    const eventRebuilds = affected.map((ev) => ({
                        id: ev.id,
                        resourceId: ev.getResources?.()[0]?.id,
                        backgroundColor: ev.backgroundColor,
                        borderColor: ev.borderColor,
                        classNames: ev.classNames,
                    }));
                    affected.forEach((ev) => ev.remove());
                    eventRebuilds.forEach((rebuilt) => {
                        cal.addEvent({
                            id: rebuilt.id,
                            resourceId: rebuilt.resourceId,
                            title: title || 'Untitled Event',
                            start: !isNaN(startObj.getTime()) ? startObj : undefined,
                            end: !isNaN(endObj.getTime()) ? endObj : undefined,
                            allDay: false,
                            backgroundColor: rebuilt.backgroundColor,
                            borderColor: rebuilt.borderColor,
                            classNames: rebuilt.classNames,
                            extendedProps: {
                                shiftId: shiftId,
                                description: description || 'No description',
                                timer: newTimer,
                                isCompleted: (isCompleted !== undefined) ? isCompleted : (currentEventData.isCompleted || false)
                            }
                        });
                    });
                }

                // If details modal is open, refresh its displayed values too
                const detailsModal = document.getElementById('event_modal');
                if (detailsModal && !detailsModal.classList.contains('hidden')) {
                    const titleEl = document.getElementById('eventTitle');
                    const descEl = document.getElementById('eventDesc');
                    if (titleEl) titleEl.textContent = title || 'Untitled Event';
                    if (descEl) descEl.textContent = description || 'No description provided';
                }
            } else {
                // CREATE MODE - Support multiple employees
                console.log('Raw selected employee IDs before parsing:', Array.from(employeeSelectEl.selectedOptions).map(opt => ({ value: opt.value, type: typeof opt.value })));
                
                const payload = {
                    profileIds: selectedEmployees,
                    date: formattedDate,
                    startTime: startTime.substring(0, 5),
                    endTime: endTime.substring(0, 5),
                    title: title,
                    description: description
                };
                
                console.log('Creating new event(s), Payload:', payload, 'ProfileIds types:', selectedEmployees.map(id => typeof id));
                const response = await newShift(payload);
                
                console.log('Event(s) created successfully:', response);
                showToast(`Event created successfully for ${selectedEmployees.length} employee(s)!`, 'success');
            }
            
            // Reset form and state
            form.reset();
            currentEventData = null;
            document.getElementById('event-title').value = '';
            document.getElementById('event-date').value = '';
            document.getElementById('event-start-time').value = '';
            document.getElementById('event-end-time').value = '';
            document.getElementById('event-description').value = '';
            // Clear multi-select selections properly
            const selectEl = document.getElementById('select-emp');
            if (selectEl) {
                Array.from(selectEl.options).forEach(opt => opt.selected = false);
            }
            
            // Reset submit button text
            submitBtn.textContent = 'Add Event';
            
            // Close modal
            const modal = document.getElementById('add_event');
            if (modal) {
                modal.classList.add('hidden');
            }
            
            // Refresh calendar
            const cal = (typeof window !== 'undefined' && window.__hrmsCalendar) ? window.__hrmsCalendar : null;
            if (cal) {
                // Do NOT auto-refresh the page after editing, otherwise it hides console logs and
                // prevents us from verifying UI updates. If you still want a hard refresh, do it
                // manually (Ctrl+F5) or only after CREATE mode.
                if (!currentEventData || !currentEventData.id) {
                    // CREATE MODE fallback (optional). Keep disabled to avoid disruptive reloads.
                    // location.reload();
                }
            }
            
        } catch (error) {
            console.error('Error processing event:', error);
            showToast('Error: ' + (error.message || 'Unknown error'), 'error');
        } finally {
            // Restore submit button
            const submitBtn = document.getElementById('submit-event-btn');
            submitBtn.disabled = false;
            if (!currentEventData || !currentEventData.id) {
                submitBtn.textContent = 'Add Event';
            }
        }
    });
}

// --- MAIN INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async function () {
    const calendarEl = document.getElementById('calendar');

    // Only run if the calendar element exists on this page
    if (calendarEl) {
        
        // 1. Fetch Data
        let schedule = [];
        let employeesProfiles = [];

        try {
            const [scheduleData, employeesData] = await Promise.all([
                fetchAllSchedules(),
                fetchAllEmployees()
            ]);
            schedule = scheduleData || [];
            employeesProfiles = employeesData || [];
            console.log("Fetched Schedule Data:", schedule);
            console.log("Fetched Employees Data:", employeesProfiles);
            
            if (!schedule || schedule.length === 0) {
                console.warn("No schedule data received from API");
            }
            if (!employeesProfiles || employeesProfiles.length === 0) {
                console.warn("No employees data received from API");
            }
        } catch (error) {
            console.error("Critical error fetching initial data:", error);
        }

        // Determine current user role so we can adjust interactivity for EMPLOYEE
        let currentUser = { role: 'EMPLOYEE' };
        let isEmployee = false;
        try {
            currentUser = await getCurrentUser();
            isEmployee = String(currentUser?.role || '').toUpperCase() === 'EMPLOYEE';
        } catch (err) {
            console.error('Error resolving current user role, defaulting to EMPLOYEE restrictions if unknown:', err);
        }

        // 2. Populate Employee Select Dropdown
        const select = document.getElementById('select-emp');
        const employeeCountEl = document.getElementById('employee-count');

        // Helper to update the employee count badge
        function updateEmployeeCount() {
            if (employeeCountEl) {
                employeeCountEl.textContent = String((employeesProfiles && employeesProfiles.length) || 0);
            }
        }

        if (select) {
            // CRITICAL FIX: Clear static HTML options first and add a disabled placeholder for multiple select
            select.innerHTML = '<option value="" disabled>Select employees...</option>';

            if (employeesProfiles.length > 0) {
                employeesProfiles.forEach(emp => {
                    const option = document.createElement('option');
                    option.value = String(emp.id); // Store as string (HTML standard), will be parsed to int during form submission
                    option.dataset.employeeId = emp.id; // Also store as data attribute for reference
                    
                    // robust check for different name properties (backend often sends 'fullName')
                    option.text = emp.fullName || emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Unknown Employee'; 
                    
                    select.appendChild(option);
                });
            } else {
                // Optional: Disable dropdown if no employees found
                const option = document.createElement('option');
                option.text = "No employees found";
                option.disabled = true;
                select.appendChild(option);
            }

            // Update employee count after populating the select
            updateEmployeeCount();
        } else {
            // If select isn't present for some reason, still update the count badge
            updateEmployeeCount();
        }

        // 3. Initialize Draggable (if exists)
        if (typeof FullCalendar !== 'undefined') {
            var Draggable = FullCalendar.Draggable;
            var containerEl = document.getElementById('external-events');

            // Only allow draggable external events for non-EMPLOYEE roles
            if (containerEl) {
                if (!isEmployee) {
                    new Draggable(containerEl, {
                        itemSelector: '.fc-event',
                        eventData: function (eventEl) {
                            var className = eventEl.getAttribute('data-event-classname');
                            return {
                                title: eventEl.innerText.trim(),
                                classNames: [className],
                            };
                        }
                    });
                } else {
                    // Make external-events container visibly disabled and non-interactive for EMPLOYEE role
                    containerEl.classList.add('opacity-60');
                    containerEl.style.pointerEvents = 'none';
                }
            }

            // 4. Initialize Calendar
            var calendar = new FullCalendar.Calendar(calendarEl, {
                // Disable editing for employees — ensures drag/resize is not possible
                editable: !isEmployee,
                eventStartEditable: !isEmployee,
                eventDurationEditable: !isEmployee,
                schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
                initialView: 'resourceTimelineWeek',
                slotDuration: { days: 1 },
                slotLabelFormat: [
                    { weekday: 'short', day: 'numeric' }
                ],
                initialDate: new Date().toISOString().split('T')[0], // Default to today to avoid confusing blank screens
                height: 'auto',
                resourceAreaWidth: '30%',
                resourceAreaHeaderContent: 'Employee Directory',
                stickyHeaderDates: true,
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'resourceTimelineWeek'
                },
                customButtons: {
                    addEventButton: {
                        text: '+ New Event',
                        click: function () {

                            const addEvent = document.getElementById('add_event');
                            if (addEvent) {
                                addEvent.classList.remove('hidden');
                            }

                        }
                    }
                },
                resources: employeesProfiles.map(function (employee) {
                    return {
                        id: String(employee.id),
                        title: employee.fullName,
                        extendedProps: {
                            position: employee.position ? employee.position : 'Unknown',
                            avatarUrl: employee && employee.avatarUrl ? employee.avatarUrl : 'https://i.pravatar.cc/150?img=0'
                        }
                    };
                }),
                resourceLabelContent: function (arg) {
                    const user = arg.resource;
                    const role = user.extendedProps.position;
                    const avatar = user.extendedProps.avatarUrl;
                    return {
                        html: `
                        <div class="d-flex align-items-center" style="padding: 4px 0;">
                            <img src="${avatar}" class="rounded-circle me-2" alt="${user.title}" 
                                 style="width: 36px; height: 36px; object-fit: cover; border: 2px solid #f0f0f0; border-radius:50%;">
                            <div style="line-height: 1.2;">
                                <h6 class="m-0 text-dark" style="font-size: 0.9rem; font-weight:600;">${user.title}</h6>
                                <span class="text-muted" style="font-size: 0.75rem; color:#6b7280;">${role}</span>
                            </div>
                        </div>
                        `
                    };
                },
                eventContent: function (arg) {
                    const title = arg.event.title || 'Untitled Task';
                    const timer = arg.event.extendedProps.timer || '';
                    const description = arg.event.extendedProps.description || 'No description provided.';
                    // Safe date formatting
                    let formattedDate = '';
                    if (arg.event.start) {
                         formattedDate = arg.event.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }

                    return {
                        html: `
                            <div class="event-content-wrapper text-white" style="line-height: 1.1; overflow:hidden;">
                                <div class="event-title" style="font-weight:bold;">${title}</div>
                                <div class="event-date" style="font-size:0.8em; opacity:0.9;">${formattedDate} ${timer}</div>
                                <div class="event-description" style="font-size:0.8em;">${description}</div>
                            </div>
                        `
                    };
                },
                eventClick: function (info) {
                  // Show event details in modal
                  const event = info.event;
                  const resource = info.event.getResources()[0]; // Get the assigned employee
                  
                  // Store current event data for editing
                  currentEventData = {
                    id: event.id,
                    shiftId: event.extendedProps?.shiftId,
                    title: event.title,
                    start: event.start,
                    end: event.end,
                    description: event.extendedProps?.description,
                    resourceId: resource ? resource.id : null,
                    isCompleted: event.extendedProps?.isCompleted || false
                  };
                  
                  // Format dates
                  const eventDate = event.start ? new Date(event.start).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  }) : 'N/A';
                  
                  
                  // Format times
                  const startTime = event.start ? new Date(event.start).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    hourCycle: 'h12' 
                  }) : 'N/A';
                  
                  const endTime = event.end ? new Date(event.end).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    hourCycle: 'h12' 
                  }) : 'N/A';
                  
                  const resourceName = resource ? resource.title : 'Unassigned';
                  const description = event.extendedProps?.description || 'No description provided';
                  
                  // Populate modal with event details
                  document.getElementById('eventTitle').textContent = event.title || 'Untitled Event';
                  document.getElementById('eventDate').textContent = `${eventDate}`;
                  document.getElementById('eventTime').textContent = `${startTime} to ${endTime}`;
                  document.getElementById('eventEmployee').textContent = resourceName;
                  document.getElementById('eventDesc').textContent = description;
                  
                  // Set checkbox state
                  const completedCheckbox = document.getElementById('eventCompleted');
                  if (completedCheckbox) {
                    completedCheckbox.checked = currentEventData.isCompleted;
                  }
                  
                  // Show the modal
                  const modal = document.getElementById('event_modal');
                  if (modal) {
                    modal.classList.remove('hidden');
                  }
                },
                eventDrop: async function (info) {
                  // Immediately disallow drag/drop for EMPLOYEE role as a last line of defense
                  if (isEmployee) {
                    console.warn('Drag/drop attempted by EMPLOYEE role — reverting');
                    try { info.revert(); } catch (e) { /* ignore */ }
                    showToast('You are not permitted to move shifts.', 'warning');
                    return;
                  }

                  // Handle drag and drop - can be to new resource, new date, or both
                  const event = info.event;
                  const oldEvent = info.oldEvent;
                  const newResourceId = event.getResources()[0]?.id; // Get the new resource (employee)
                  const oldResourceId = oldEvent.getResources()[0]?.id; // Get the old resource
                  
                  if (!event.id) {
                    console.error('Event ID is missing');
                    info.revert(); // Revert the change
                    showToast('Error: Event ID is missing', 'error');
                    return;
                  }

                  const shiftId = event.extendedProps?.shiftId;
                  if (!shiftId) {
                    console.error('Shift ID is missing from event.extendedProps');
                    info.revert();
                    showToast('Error: Shift ID is missing', 'error');
                    return;
                  }

                  try {
                    const resourceChanged = newResourceId !== oldResourceId;
                    const dateChanged = oldEvent.start.getTime() !== event.start.getTime() || 
                                       oldEvent.end.getTime() !== event.end.getTime();
                    
                    console.log('Event dropped:', {
                      shiftId: event.id,
                      resourceChanged,
                      dateChanged,
                      oldDate: oldEvent.start,
                      newDate: event.start,
                      oldResourceId,
                      newResourceId
                    });

                    // Update date/time if changed
                    if (dateChanged) {
                      const eventDate = event.start ? event.start.toISOString().split('T')[0] : null;
                      const startTime = event.start ? event.start.getHours().toString().padStart(2, '0') + ':' + event.start.getMinutes().toString().padStart(2, '0') : null;
                      const endTime = event.end ? event.end.getHours().toString().padStart(2, '0') + ':' + event.end.getMinutes().toString().padStart(2, '0') : null;

                      console.log('Updating shift date/time:', {
                        shiftId: event.id,
                        date: eventDate,
                        startTime,
                        endTime
                      });

                      await updateShift(parseInt(shiftId), {
                        date: eventDate,
                        startTime: startTime,
                        endTime: endTime
                      });
                    }

                    // Update resource if changed
                    if (resourceChanged) {
                      console.log('Reassigning shift:', {
                        shiftId: event.id,
                        fromResourceId: oldResourceId,
                        toResourceId: newResourceId
                      });

                      await reassignShift(parseInt(shiftId), parseInt(newResourceId));
                    }

                    // Show success message
                    if (resourceChanged || dateChanged) {
                      let message = 'Shift updated: ';
                      if (resourceChanged && dateChanged) {
                        const newEmployeeName = info.event.getResources()[0]?.title || 'Unknown';
                        const newDate = event.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        message += `reassigned to ${newEmployeeName} on ${newDate}`;
                      } else if (resourceChanged) {
                        const newEmployeeName = info.event.getResources()[0]?.title || 'Unknown';
                        message += `reassigned to ${newEmployeeName}`;
                      } else if (dateChanged) {
                        const newDate = event.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        message += `moved to ${newDate}`;
                      }
                      console.log(message);
                      showToast(message, 'success');
                    }
                    
                  } catch (error) {
                    console.error('Error updating shift:', error);
                    info.revert(); // Revert the change if API call fails
                    showToast('Error updating shift: ' + (error.message || 'Unknown error'), 'error');
                  }
                },
                events: processDynamicEvents(schedule),
                editable: true,
                droppable: true,
            });

            calendar.render();

            // Expose calendar for other handlers (edit form submit, modal checkbox, etc.)
            if (typeof window !== 'undefined') {
                window.__hrmsCalendar = calendar;
            }
            
            // Setup close button handlers for event modal
            setupEventModalCloseHandlers();
        } else {
            console.error("FullCalendar library not loaded");
        }

        // Initialize form handler
        initializeAddEventForm();
        
        // Add close handler for the add event modal to reset form state
        const addEventModal = document.getElementById('add_event');
        if (addEventModal) {
            const closeBtn = addEventModal.querySelector('[data-modal-hide="add_event"]');
            if (closeBtn) {
                closeBtn.addEventListener('click', function() {
                    currentEventData = null;
                    const submitBtn = document.getElementById('submit-event-btn');
                    if (submitBtn) {
                        submitBtn.textContent = 'Add Event';
                    }
                    const formTitle = document.querySelector('#add_event .font-semibold');
                    if (formTitle) {
                        formTitle.textContent = 'Add New Event';
                    }
                });
            }
        }
    }
});

// --- EVENT MODAL CLOSE HANDLERS & EDIT BUTTON ---
function setupEventModalCloseHandlers() {
    const modal = document.getElementById('event_modal');
    if (!modal) return;
    
    // Close button in header
    const closeHeaderBtn = modal.querySelector('[data-modal-hide="event_modal"]');
    if (closeHeaderBtn) {
        closeHeaderBtn.addEventListener('click', function() {
            modal.classList.add('hidden');
        });
    }
    
    // Close button in footer
    const closeFooterBtn = modal.querySelector('.flex-1.bg-gray-200[data-modal-hide="event_modal"]');
    if (closeFooterBtn) {
        closeFooterBtn.addEventListener('click', function() {
            modal.classList.add('hidden');
        });
    }
    
    // Completed checkbox handler
    const completedCheckbox = document.getElementById('eventCompleted');
    if (completedCheckbox) {
        completedCheckbox.addEventListener('change', async function() {
            if (!currentEventData || !currentEventData.id) {
                showToast('No event data available', 'warning');
                this.checked = !this.checked; // Revert the change
                return;
            }
            
            try {
                const checkObj = { isCompleted: this.checked };
                const shiftIdForUpdate = currentEventData.shiftId || currentEventData.id;
                console.log('Updating completed status for shift:', shiftIdForUpdate);
                await updateShift(shiftIdForUpdate, checkObj);

                // Update the current event data
                currentEventData.isCompleted = this.checked;

                // Update calendar event UI state
                const cal = (typeof window !== 'undefined' && window.__hrmsCalendar) ? window.__hrmsCalendar : null;
                if (cal) {
                    const existingEvent = cal.getEventById(String(currentEventData.id));
                    if (existingEvent) {
                        existingEvent.setExtendedProp('isCompleted', this.checked);
                    }
                }
                
                const statusText = this.checked ? 'marked as completed' : 'marked as incomplete';
                console.log('Shift ' + statusText);
                
                // Optional: Show a subtle notification
                const label = modal.querySelector('label');
                if (label) {
                    label.classList.add('bg-opacity-10');
                    label.classList.add(this.checked ? 'bg-green-100' : 'bg-gray-100');
                    setTimeout(() => {
                        label.classList.remove('bg-opacity-10', 'bg-green-100', 'bg-gray-100');
                    }, 300);
                }
            } catch (error) {
                console.error('Error updating completed status:', error);
                this.checked = !this.checked; // Revert the change on error
                showToast('Error updating task status: ' + (error.message || 'Unknown error'), 'error');
            }
        });
    }
    
    // Edit button handler
    const editBtn = document.getElementById('editEventBtn');
    if (editBtn) {
        // If this button lives inside any <form>, browsers may treat it as a submit button by default.
        // Force it to behave like a normal button to avoid page refresh.
        if (!editBtn.hasAttribute('type')) {
            editBtn.setAttribute('type', 'button');
        }

        editBtn.addEventListener('click', function(e) {
            if (e) {
                e.preventDefault();
                if (typeof e.stopPropagation === 'function') e.stopPropagation();
            }
            if (!currentEventData) {
                showToast('No event data available', 'warning');
                return;
            }
            
            // Close the details modal
            modal.classList.add('hidden');
            
            // Parse the event dates back to form format
            const startDate = new Date(currentEventData.start);
            const endDate = new Date(currentEventData.end);
            
            // Format date as DD-MM-YYYY
            const formattedDate = startDate.getDate().toString().padStart(2, '0') + '-' + 
                                 (startDate.getMonth() + 1).toString().padStart(2, '0') + '-' + 
                                 startDate.getFullYear();
            
            // Format times as HH:MM
            const startTimeStr = startDate.getHours().toString().padStart(2, '0') + ':' + 
                                startDate.getMinutes().toString().padStart(2, '0');
            const endTimeStr = endDate.getHours().toString().padStart(2, '0') + ':' + 
                              endDate.getMinutes().toString().padStart(2, '0');
            
            // Populate the form with event data
            document.getElementById('event-title').value = currentEventData.title || '';
            document.getElementById('event-date').value = formattedDate;

            // Preselect the assigned employee (or employees) in the multi-select
            const select = document.getElementById('select-emp');
            if (select) {
                // If currentEventData.resourceId is a single id, select it. If an array of ids, select all.
                const assigned = Array.isArray(currentEventData.resourceId) ? currentEventData.resourceId.map(String) : [String(currentEventData.resourceId)];
                Array.from(select.options).forEach(opt => {
                    opt.selected = assigned.includes(opt.value);
                });
            }
            document.getElementById('event-start-time').value = startTimeStr;
            document.getElementById('event-end-time').value = endTimeStr;
            document.getElementById('event-description').value = currentEventData.description || '';
            document.getElementById('select-emp').value = currentEventData.resourceId || '';
            
            // Update form title and button
            const formTitle = document.querySelector('#add_event .font-semibold');
            if (formTitle) {
                formTitle.textContent = 'Edit Event';
            }
            
            const submitBtn = document.getElementById('submit-event-btn');
            if (submitBtn) {
                submitBtn.textContent = 'Update Event';
            }
            
            // Open the add event modal for editing
            const addEventModal = document.getElementById('add_event');
            if (addEventModal) {
                addEventModal.classList.remove('hidden');
            }
        });
    }
    
    // Also close on outside click (optional)
    document.addEventListener('click', function(event) {
        if (modal && !modal.classList.contains('hidden')) {
            // Check if click is outside the modal
            if (!modal.contains(event.target) && event.target.id !== 'calendar' && 
                !event.target.closest('.fc-event') && !event.target.closest('[data-testid="eventChip"]')) {
                // Don't close if clicking on calendar elements
                const isCalendarElement = event.target.closest('.fc') || event.target.closest('[role="button"]')?.closest('.fc');
                if (!isCalendarElement) {
                    // Uncomment to enable outside click closing
                    // modal.classList.add('hidden');
                }
            }
        }
    });
}