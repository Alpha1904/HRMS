import { fetchAllSchedules, detectApiBase, fetchManagerById } from '../../../../dist/assets/js/fetch.js';

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
        console.warn("Invalid dataArray passed to processDynamicEvents");
        return [];
    }

    dataArray.forEach(event => {
        const color = colors[colorIndex % colors.length];

        // 1. Construct Proper Start/End Timestamps
        // We assume event.date is "YYYY-MM-DD" and event.startTime is ISO or "HH:mm"
        // If your API returns full ISO strings for startTime/endTime, use them directly.
        
        let startIso = event.startTime;
        let endIso = event.endTime;

        // If 'T' is missing in startTime, assume it's just time and combine with date
        if (event.date && event.startTime && !event.startTime.includes('T')) {
            startIso = `${event.date.split('T')[0]}T${event.startTime}`;
        }
        // If 'T' is missing in endTime, combine with date
        if (event.date && event.endTime && !event.endTime.includes('T')) {
            endIso = `${event.date.split('T')[0]}T${event.endTime}`;
        }
        
        // 2. Create Format for Display (Tooltip/Card)
        const startObj = new Date(startIso);
        const endObj = new Date(endIso);
        const timeOptions = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
        
        const formatStartTime = isNaN(startObj.getTime()) ? '' : startObj.toLocaleTimeString('en-US', timeOptions);
        const formatEndTime = isNaN(endObj.getTime()) ? '' : endObj.toLocaleTimeString('en-US', timeOptions);
        const timerString = (formatStartTime && formatEndTime) ? `${formatStartTime} - ${formatEndTime}` : '';

        if (event.profile && Array.isArray(event.profile)) {
            event.profile.forEach(profile => {
                fcEvents.push({
                    resourceId: String(profile.id), // Must match the resource ID string exactly
                    title: event.title,
                    start: startIso,   // FIXED: Passing full ISO string (Date + Time)
                    end: endIso,       // FIXED: Passing full ISO string
                    allDay: false,     // FIXED: Set to false to show actual shift duration
                    backgroundColor: color, // Explicitly setting background
                    borderColor: color,
                    extendedProps: {
                        description: event.description,
                        timer: timerString
                    }
                });
            });
        }
        colorIndex++;
    })
    console.log("Final Event objects for FC:", fcEvents);
    return fcEvents;
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
                        text: '+ Quick Task',
                        click: function () {
                            // var addEventModal = document.getElementById('add_event');
                            // if(addEventModal) {
                            //     // Logic to show modal (using flowbite or manual class toggle)
                            //     addEventModal.classList.remove('hidden');
                            // } else {
                            //     alert('Add Event Modal not found in DOM');
                            // }

                            // test adding a quick event directly
                            console.log("Adding quick event to calendar");
                            calendar.addEvent({
                                resourceId: '384', // Ensure this ID exists in your resources
                                title: 'New Task',
                                start: new Date().toISOString().split('T')[0],
                                allDay: true
                            });
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
                  console.log(`Event clicked: ${info.event.title}`);
                },
                events: processDynamicEvents(schedule),
                editable: true,
                droppable: true,
            });

            calendar.render();
        } else {
            console.error("FullCalendar library not loaded");
        }
    }
});