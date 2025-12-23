import { fetchAllSchedules, detectApiBase, fetchManagerById, newShift, updateShift } from '../../../../dist/assets/js/fetch.js';

// --- CONSTANTS ---
const employeeData = [
    { id: '1', name: 'John Doe', position: 'Software Engineer', avatarUrl: 'https://i.pravatar.cc/150?img=1' },
    // ... (rest of your static data can remain here or be fetched)
];

const API_BASE_URL = detectApiBase();

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

/**
 * Helper: Fetch Employees
 */
async function fetchAllEmployees() {
    const currentUser = await getCurrentUser();
    // Prefer the logged-in user's id (useful when the user is a manager).
    // Fallback to a development ID only if no user id is available.
    const managerId = currentUser?.id || 355;
    if (!managerId) return [];

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
                    id: String(event.id), // Add the shift ID from backend
                    resourceId: String(profile.id), 
                    title: event.title || 'Untitled Event',
                    start: startIso,   
                    end: endIso,       
                    allDay: false,     
                    backgroundColor: color, 
                    borderColor: color,
                    extendedProps: {
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
        
        // Get form values
        const title = document.getElementById('event-title').value.trim();
        const date = document.getElementById('event-date').value.trim();
        const startTime = document.getElementById('event-start-time').value.trim();
        const endTime = document.getElementById('event-end-time').value.trim();
        const employeeId = document.getElementById('select-emp').value;
        const description = document.getElementById('event-description').value.trim();
        
        // Validation
        if (!title || !date || !startTime || !endTime || !employeeId) {
            alert('Please fill in all required fields');
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
                const updatePayload = {
                    date: formattedDate,
                    startTime: startTime.substring(0, 5),
                    endTime: endTime.substring(0, 5)
                };
                
                console.log('Updating event with ID:', currentEventData.id, 'Payload:', updatePayload);
                const response = await updateShift(currentEventData.id, updatePayload);
                
                console.log('Event updated successfully:', response);
                alert('Event updated successfully!');
            } else {
                // CREATE MODE
                const payload = {
                    profileIds: [parseInt(employeeId)],
                    date: formattedDate,
                    startTime: startTime.substring(0, 5),
                    endTime: endTime.substring(0, 5),
                    title: title,
                    description: description
                };
                
                console.log('Creating new event, Payload:', payload);
                const response = await newShift(payload);
                
                console.log('Event created successfully:', response);
                alert('Event created successfully!');
            }
            
            // Reset form and state
            form.reset();
            currentEventData = null;
            document.getElementById('event-title').value = '';
            document.getElementById('event-date').value = '';
            document.getElementById('event-start-time').value = '';
            document.getElementById('event-end-time').value = '';
            document.getElementById('event-description').value = '';
            document.getElementById('select-emp').value = '';
            
            // Reset submit button text
            submitBtn.textContent = 'Add Event';
            
            // Close modal
            const modal = document.getElementById('add_event');
            if (modal) {
                modal.classList.add('hidden');
            }
            
            // Refresh calendar
            if (typeof calendar !== 'undefined' && calendar) {
                location.reload();
            }
            
        } catch (error) {
            console.error('Error processing event:', error);
            alert('Error: ' + (error.message || 'Unknown error'));
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

        // 2. Populate Employee Select Dropdown
        const select = document.getElementById('select-emp');
        if (select) {
            // CRITICAL FIX: Clear static HTML options first, keeping only the default placeholder
            select.innerHTML = '<option value="">Select Employee</option>';

            if (employeesProfiles.length > 0) {
                employeesProfiles.forEach(emp => {
                    const option = document.createElement('option');
                    option.value = emp.id; // Ensure this matches your backend ID format
                    
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
        }

        // 3. Initialize Draggable (if exists)
        if (typeof FullCalendar !== 'undefined') {
            var Draggable = FullCalendar.Draggable;
            var containerEl = document.getElementById('external-events');
            if (containerEl) {
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
            }

            // 4. Initialize Calendar
            var calendar = new FullCalendar.Calendar(calendarEl, {
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
                    left: 'prev,next today addEventButton',
                    center: 'title',
                    right: 'resourceTimelineWeek,resourceTimelineMonth'
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
                events: processDynamicEvents(schedule),
                editable: true,
                droppable: true,
            });

            calendar.render();
            
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
                alert('No event data available');
                this.checked = !this.checked; // Revert the change
                return;
            }
            
            try {
                const checkObj = { isCompleted: this.checked };
                console.log('Updating completed status for shift:', currentEventData.id);
                await updateShift(currentEventData.id, checkObj);
                
                // Update the current event data
                currentEventData.isCompleted = this.checked;
                
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
                alert('Error updating task status: ' + (error.message || 'Unknown error'));
            }
        });
    }
    
    // Edit button handler
    const editBtn = document.getElementById('editEventBtn');
    if (editBtn) {
        editBtn.addEventListener('click', function() {
            if (!currentEventData) {
                alert('No event data available');
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