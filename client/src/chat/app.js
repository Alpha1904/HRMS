// --- CONFIGURATION ---
const API_URL = 'http://localhost:3000/api';
const SOCKET_URL = 'http://localhost:3000';
const TOKEN = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : null;
// --- STATE ---
let socket = null;
let currentRoomId = null;
let myId = null;
let myProfileId = null;
let myRole = null;
let searchTimeout = null;

let unreadCounts = {};

function getUnreadStorageKey() {
    return `chat_unread_${myId ?? 'anon'}`;
}

function loadUnreadCounts() {
    try {
        const raw = localStorage.getItem(getUnreadStorageKey());
        unreadCounts = raw ? JSON.parse(raw) : {};
        if (!unreadCounts || typeof unreadCounts !== 'object') unreadCounts = {};
    } catch (e) {
        unreadCounts = {};
    }
}

function saveUnreadCounts() {
    try {
        localStorage.setItem(getUnreadStorageKey(), JSON.stringify(unreadCounts));
    } catch (e) {
        // ignore
    }
}

function incrementUnread(roomId) {
    if (!roomId) return;
    unreadCounts[roomId] = (Number(unreadCounts[roomId]) || 0) + 1;
    saveUnreadCounts();
}

function clearUnread(roomId) {
    if (!roomId) return;
    unreadCounts[roomId] = 0;
    saveUnreadCounts();
    fetchMyRooms();
}

// --- DOM ELEMENTS ---
const el = {
    status: document.getElementById('connection-status'),
    roomList: document.getElementById('room-list'),
    messagesContainer: document.getElementById('messages-container'),
    chatForm: document.getElementById('chat-form'),
    input: document.getElementById('message-input'),
    sendBtn: document.getElementById('send-btn'),
    headerName: document.getElementById('active-room-name'),
    headerStatus: document.getElementById('active-room-status'),
    myNameDisplay: document.getElementById('my-name-display'),
    
    // Modal
    modal: document.getElementById('search-modal'),
    modalContent: document.getElementById('modal-content'),
    searchInput: document.getElementById('user-search-input'),
    searchResults: document.getElementById('user-results-list'),

    // Create Group Modal
    createGroupBtn: document.getElementById('create-group-btn'),
    createGroupModal: document.getElementById('create-group-modal'),
    createGroupModalContent: document.getElementById('create-group-modal-content'),
    groupNameInput: document.getElementById('group-name-input'),
    groupTypeSelect: document.getElementById('group-type-select'),
    groupMemberSearchInput: document.getElementById('group-member-search-input'),
    groupMemberResults: document.getElementById('group-member-results-list'),
    selectedMembersList: document.getElementById('selected-members-list'),
    createGroupSubmitBtn: document.getElementById('create-group-submit-btn')
};

const getCurrentUser = async () => {
    try {
        const token = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : null;
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch(`${API_URL}/auth/me`, {
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
        return { id: user?.id, profileId: user?.profile?.id, role: user?.role || 'EMPLOYEE', username: user?.email };
    } catch (error) {
        console.error('Error fetching current user:', error);
        return { role: 'EMPLOYEE' };
    }
}

// fetch user by id
const fetchUserByid = async (id) => {
    try{
        const response = await fetch(`${API_URL}/users/${id}`,)
         if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
  }
  return response.json();
    }catch(e){
        console.error('Error fetching user by id:', e);
        return null;
    }
};

// --- INITIALIZATION ---
async function init() {

    // 1. Decode Token to get My User ID (standard JWT 'sub' field)
    try {
        const payload = await getCurrentUser();
        myId = payload?.id; 
        myProfileId = payload?.profileId;
        myRole = payload?.role;
        const user = await fetchUserByid(myProfileId || myId);
        loadUnreadCounts();
        // Optional: If token has name, display it
        el.myNameDisplay.innerText = user.profile.fullName;
        // Show Create Group button only for MANAGER or HR_ADMIN role
        if (payload?.role === 'MANAGER' || payload?.role === 'HR_ADMIN') {
            el.createGroupBtn.classList.remove('hidden');
        }
    } catch (e) {
        console.error("Invalid Token", e);
        return;
    }

    // 2. Setup WebSocket
    setupSocket();

    // 3. Load Data
    fetchMyRooms();
}

// --- SOCKET.IO LOGIC ---
function setupSocket() {
    socket = io(SOCKET_URL, {
        auth: { token: TOKEN },
        transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
        console.log('Connected to WebSocket');
        el.status.classList.remove('bg-red-500');
        el.status.classList.add('bg-green-500');
        el.status.setAttribute('title', 'Connected');
        
        // Ensure we are subscribed to updates for all my rooms
        socket.emit('join_rooms');
    });

    socket.on('connect_error', (err) => {
        console.error('Socket connection error', err);
        el.status.classList.remove('bg-green-500');
        el.status.classList.add('bg-red-500');
        el.status.setAttribute('title', 'Disconnected (socket error)');
    });

    socket.on('disconnect', () => {
        console.log('Disconnected');
        el.status.classList.remove('bg-green-500');
        el.status.classList.add('bg-red-500');
        el.status.setAttribute('title', 'Disconnected');
    });

    socket.on('new_message', (msg) => {
        console.log('New message received:', msg);
        if (currentRoomId === msg.roomId) {
            const clientMessageId = msg?.clientMessageId;
            if (clientMessageId) {
                const existing = el.messagesContainer.querySelector(`[data-client-message-id="${clientMessageId}"]`);
                if (existing) {
                    const replacement = appendMessageUI(msg, true);
                    existing.replaceWith(replacement);
                    scrollToBottom();
                    return;
                }
            }

            appendMessageUI(msg);
            scrollToBottom();
        } else {
            const isFromMe = msg?.senderId === (myProfileId ?? myId);
            if (!isFromMe) {
                incrementUnread(msg.roomId);
            }
            fetchMyRooms(); 
        }
    });

    socket.on('error', (err) => console.error('Socket Error:', err));
}

// --- API ACTIONS ---

// 1. Fetch Sidebar List
async function fetchMyRooms() {
    try {
        const res = await fetch(`${API_URL}/chat/rooms`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        if (!res.ok) {
            const text = await res.text();
            console.error('Failed to fetch rooms', res.status, text);
            el.roomList.innerHTML = '<p class="text-center text-gray-400 p-4">Unable to load rooms.</p>';
            return;
        }

        // Read raw text first so we can handle empty responses gracefully
        const text = await res.text();
        if (!text || !text.trim()) {
            // Empty body; treat as no rooms
            renderSidebar([]);
            return;
        }

        let rooms;
        try {
            rooms = JSON.parse(text);
        } catch (parseErr) {
            console.error('Failed to parse rooms JSON', parseErr, text);
            el.roomList.innerHTML = '<p class="text-center text-gray-400 p-4">Unable to load rooms.</p>';
            return;
        }

        if (!Array.isArray(rooms)) {
            console.error('Unexpected rooms response', rooms);
            el.roomList.innerHTML = '<p class="text-center text-gray-400 p-4">No rooms available.</p>';
            return;
        }
        renderSidebar(rooms);
    } catch (err) {
        console.error("Failed to fetch rooms", err);
        el.roomList.innerHTML = '<p class="text-center text-gray-400 p-4">Unable to load rooms.</p>';
    }
}

// 2. Load History for a Room
async function loadChatHistory(roomId) {
    try {
        const res = await fetch(`${API_URL}/chat/rooms/${roomId}/messages`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const response = await res.json(); // { data: [], nextCursor: ... }
        
        el.messagesContainer.innerHTML = ''; // Clear current view
        
        // Backend sends Newest First (for efficient querying)
        // We reverse it to display Oldest -> Newest (Top to Bottom)
        const messages = response.data.reverse();
        
        if (messages.length === 0) {
            el.messagesContainer.innerHTML = `
                <div class="flex-1 flex items-center justify-center text-gray-400">
                    <p>No messages yet. Say hello!</p>
                </div>`;
        } else {
            messages.forEach(msg => appendMessageUI(msg));
            scrollToBottom();
        }
    } catch (err) {
        console.error("Failed to load history", err);
    }
}

// 3. Search Users (For Modal)
async function searchUsers(query) {
    try {
        const res = await fetch(`${API_URL}/chat/users?q=${query}`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const searchUsers = await res.json();

        const getAllUsers = await fetch(`${API_URL}/users`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });

        const allAsers = await getAllUsers.json();
        
        const users = searchUsers.length === 0 ? allAsers : searchUsers;
        renderUserResults(users);
    } catch (err) {
        console.error("Search failed", err);
    }
}

// 4. Create/Get Direct Chat
async function startDirectChat(targetUserId) {
    try {
        const res = await fetch(`${API_URL}/chat/dm`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ targetUserId })
        });
        
        if (!res.ok) throw new Error("Failed to create chat");
        
        const room = await res.json();
        
        toggleModal(false); // Close modal
        await fetchMyRooms(); // Refresh sidebar to show new room
        
        // Calculate the display name manually since the return object might be raw
        // In a DM, the name is the 'other' person
        // members now include Profile (user) with user.userId referencing the User id
        const otherMember = (room.members || []).find(m => (m.user?.userId || m.userId) !== myId);
        const displayName = otherMember ? (otherMember.user?.fullName || otherMember.user?.profile?.fullName || otherMember.user?.email || 'Chat') : "Chat";
        
        openRoom(room.id, displayName, "Direct Message");
    } catch (err) {
        alert("Error creating chat: " + err.message);
    }
}

// --- UI RENDERING ---

function renderSidebar(rooms) {
    el.roomList.innerHTML = '';
    
    if (!Array.isArray(rooms) || rooms.length === 0) {
        el.roomList.innerHTML = '<p class="text-center text-gray-400 p-4">No chat rooms found.</p>';
        return;
    }

    rooms.forEach(room => {
        // Name Logic: Group Name OR Other Person's Name
        let displayName = room.name || '';
        if (room.type === 'DIRECT') {
            const otherMember = (room.members || []).find(m => m.userId !== (myProfileId ?? myId));
            displayName = otherMember ? (otherMember.user?.fullName || otherMember.user?.profile?.fullName || otherMember.user?.email || 'Unknown User') : "Unknown User";
        }
        
        // Preview Logic
        const lastMsgObj = (room.messages && room.messages.length) ? room.messages[0] : null;
        const lastMsg = lastMsgObj ? lastMsgObj.content : "No messages yet";
        const isActive = room.id === currentRoomId;

        const unread = Number(unreadCounts?.[room.id]) || 0;
        const unreadLabel = unread > 99 ? '99+' : String(unread);

        const div = document.createElement('div');
        div.className = `p-3 rounded-lg cursor-pointer transition flex items-center gap-3 mb-1 ${isActive ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-gray-50 border border-transparent'}`;
        div.onclick = () => openRoom(room.id, displayName, room.type === 'GROUP' ? `${(room.members || []).length} members` : room.type === 'ANNOUNCEMENT' ? 'Announcement' : 'Direct Message', room.type);
        
        // Avatar (Initials)
        const initials = displayName.substring(0, 2).toUpperCase();
        
        div.innerHTML = `
            <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs shrink-0">
                ${room.type === 'GROUP' ? '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031M12 12.75a3 3 0 110-6 3 3 0 010 6zm0-3a.75.75 0 100-1.5.75.75 0 000 1.5zm-6.562 8.438A9.033 9.033 0 016.857 3a9.001 9.001 0 019.962 3.438 9 9 0 11-9.962 12.312z" /></svg>' : room.type === 'ANNOUNCEMENT' ? '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>' : initials}
            </div>
            <div class="overflow-hidden flex-1">
                <div class="flex justify-between items-center" onclick="clearUnread(${room.id})">
                    <p class="font-semibold text-gray-800 text-sm truncate">${displayName}</p>
                    <div class="flex items-center gap-2 shrink-0">
                        ${unread > 0 && !isActive ? `<span class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold text-white bg-rose-500 rounded-full shadow-sm">${unreadLabel}</span>` : ''}
                        ${lastMsgObj ? `<span class="text-[10px] text-gray-400">${new Date(lastMsgObj.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>` : ''}
                    </div>
                </div>
                <p class="text-xs text-gray-500 truncate mt-0.5">${lastMsg}</p>
            </div>
        `;
        el.roomList.appendChild(div);
    });
}

function openRoom(roomId, name, status, roomType = 'DIRECT') {
    currentRoomId = roomId;
    clearUnread(roomId);
    el.headerName.innerText = name;
    el.headerStatus.innerText = status;

    // Disable input for employees in ANNOUNCEMENT rooms
    const isAnnouncement = roomType === 'ANNOUNCEMENT';
    const isManagerOrHr = myRole === 'MANAGER' || myRole === 'HR_ADMIN';
    const canWrite = !isAnnouncement || isManagerOrHr;

    el.input.disabled = !canWrite;
    el.sendBtn.disabled = !canWrite;
    if (!canWrite) {
        el.input.placeholder = 'Only managers and HR can send messages in announcements';
    } else {
        el.input.placeholder = 'Type your message...';
        el.input.focus();
    }
    
    // Highlight sidebar logic (re-render or manual class toggle)
    Array.from(el.roomList.children).forEach(child => {
        if(child.innerHTML.includes(name)) child.classList.add('bg-indigo-50');
        else child.classList.remove('bg-indigo-50');
    });

    loadChatHistory(roomId);
}

function appendMessageUI(msg, returnOnly = false) {
    const isMe = msg.senderId === (myProfileId ?? myId);
    const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const senderName = msg.sender?.profile?.fullName || msg.sender?.fullName || '';
    
    const div = document.createElement('div');
    div.className = `flex w-full ${isMe ? 'justify-end' : 'justify-start'}`;
    if (msg?.id) div.dataset.messageId = msg.id;
    if (msg?.clientMessageId) div.dataset.clientMessageId = msg.clientMessageId;
    
    div.innerHTML = `
        <div class="max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}">
            <div class="px-5 py-2.5 shadow-sm text-sm ${
                isMe 
                ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none' 
                : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-none'
            }">
                <p>${msg.content}</p>
            </div>
            <div class="flex items-center gap-1 mt-1 px-1">
                ${!isMe ? `<span class="text-[10px] font-bold text-gray-500">${senderName}</span>` : ''}
                <span class="text-[10px] text-gray-400">${time}</span>
            </div>
        </div>
    `;
    
    if (!returnOnly) {
        el.messagesContainer.appendChild(div);
    }
    return div;
}

function scrollToBottom() {
    el.messagesContainer.scrollTop = el.messagesContainer.scrollHeight;
}

// --- MODAL & SEARCH LOGIC ---

function toggleModal(show) {
    if (show) {
        el.modal.classList.remove('hidden');
        // Small delay for transition opacity
        setTimeout(() => {
            el.modal.classList.remove('opacity-0');
            el.modalContent.classList.remove('scale-95');
            el.modalContent.classList.add('scale-100');
        }, 10);
        el.searchInput.focus();
        searchUsers(''); // Load default list
    } else {
        el.modal.classList.add('opacity-0');
        el.modalContent.classList.remove('scale-100');
        el.modalContent.classList.add('scale-95');
        setTimeout(() => {
            el.modal.classList.add('hidden');
        }, 200);
        el.searchInput.value = '';
    }
}

function renderUserResults(users) {
    el.searchResults.innerHTML = '';
    
    if (!Array.isArray(users) || users.length === 0) {
        el.searchResults.innerHTML = '<p class="text-center text-gray-400 text-sm py-4">No employees found.</p>';
        return;
    }

    users.forEach(user => {
        const div = document.createElement('div');
        div.className = "flex items-center p-3 hover:bg-indigo-50 rounded-lg cursor-pointer transition group border-b border-gray-50 last:border-0";
        div.onclick = () => startDirectChat(user.id);

        const displayName = user.profile?.fullName || user.email || 'User';
        const initials = displayName.substring(0, 2).toUpperCase();

        div.innerHTML = `
            <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm mr-3">
                ${initials}
            </div>
            <div>
                <p class="font-medium text-gray-800 group-hover:text-indigo-700 transition">${displayName}</p>
                <p class="text-xs text-gray-500">${user.role}</p>
            </div>
        `;
        el.searchResults.appendChild(div);
    });
}

// Search Debounce
el.searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => searchUsers(e.target.value), 300);
});

// Modal Close on Background Click
el.modal.addEventListener('click', (e) => {
    if (e.target === el.modal) toggleModal(false);
});

// --- CREATE GROUP MODAL & LOGIC ---

let selectedMembersForGroup = new Set(); // store user IDs

function toggleCreateGroupModal(show) {
    if (show) {
        el.createGroupModal.classList.remove('hidden');
        setTimeout(() => {
            el.createGroupModal.classList.remove('opacity-0');
            el.createGroupModalContent.classList.remove('scale-95');
            el.createGroupModalContent.classList.add('scale-100');
        }, 10);
        el.groupNameInput.focus();
        selectedMembersForGroup.clear();
        updateSelectedMembersUI();
        el.groupNameInput.value = '';
        el.groupMemberSearchInput.value = '';
        el.groupMemberResults.innerHTML = '<p class="text-center text-gray-400 text-sm py-4">Type to find colleagues...</p>';
        el.createGroupSubmitBtn.disabled = true;
        
    } else {
        el.createGroupModal.classList.add('opacity-0');
        el.createGroupModalContent.classList.remove('scale-100');
        el.createGroupModalContent.classList.add('scale-95');
        setTimeout(() => {
            el.createGroupModal.classList.add('hidden');
        }, 200);
    }
}

function mmBtn (){
    toggleCreateGroupModal(true);
    fetchMember({ target: { value: '' } });
}

function updateSelectedMembersUI() {
    if (selectedMembersForGroup.size === 0) {
        el.selectedMembersList.innerHTML = '<p class="text-gray-400 text-sm">No members selected</p>';
    } else {
        el.selectedMembersList.innerHTML = '';
        selectedMembersForGroup.forEach(userId => {
            const chip = document.createElement('span');
            chip.className = 'inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium';
            chip.innerHTML = `
                <span>User ${userId}</span>
                <button type="button" onclick="removeMemberFromGroup(${userId})" class="hover:text-indigo-900">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            `;
            el.selectedMembersList.appendChild(chip);
        });
    }
    updateCreateButtonState();
}

function removeMemberFromGroup(userId) {
    selectedMembersForGroup.delete(userId);
    updateSelectedMembersUI();
}

function renderGroupMemberResults(users) {
    el.groupMemberResults.innerHTML = '';
    if (!Array.isArray(users) || users.length === 0) {
        el.groupMemberResults.innerHTML = '<p class="text-center text-gray-400 text-sm py-4">No employees found.</p>';
        return;
    }
    users.forEach(user => {
        if (selectedMembersForGroup.has(user.id)) return; // hide already selected
        const div = document.createElement('div');
        div.className = 'flex items-center p-2 hover:bg-green-50 rounded-lg cursor-pointer transition border-b border-gray-50 last:border-0';
        div.onclick = () => {
            selectedMembersForGroup.add(user.id);
            updateSelectedMembersUI();
            el.groupMemberSearchInput.value = '';
            el.groupMemberResults.innerHTML = '<p class="text-center text-gray-400 text-sm py-4">Type to find colleagues...</p>';
        };
        const displayName = user.profile?.fullName || user.email || 'User';
        const initials = displayName.substring(0, 2).toUpperCase();
        div.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-xs mr-2">
                ${initials}
            </div>
            <div class="flex-1">
                <p class="font-medium text-gray-800 text-sm">${displayName}</p>
                <p class="text-xs text-gray-500">${user.role}</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
        `;
        el.groupMemberResults.appendChild(div);
    });
}

async function handleCreateGroup() {
    const name = el.groupNameInput.value.trim();
    const type = el.groupTypeSelect.value;
    if (!name) {
        alert('Please enter a group name');
        return;
    }
    const minMembers = type === 'ANNOUNCEMENT' ? 1 : 2;
    if (selectedMembersForGroup.size < minMembers) {
        alert(type === 'ANNOUNCEMENT' ? 'Please select at least one member' : 'Please select at least two members');
        return;
    }
    const memberUserIds = [myId, ...Array.from(selectedMembersForGroup)];
    const endpoint = type === 'ANNOUNCEMENT' ? `${API_URL}/chat/announcements` : `${API_URL}/chat/groups`;
    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, memberUserIds })
        });
        if (!res.ok) {
            const err = await res.json();
            alert(err.message || 'Failed to create group');
            return;
        }
        const groupRoom = await res.json();
        toggleCreateGroupModal(false);
        await fetchMyRooms();
        openRoom(groupRoom.id, groupRoom.name, type === 'ANNOUNCEMENT' ? 'Announcement' : `${groupRoom.members.length} members`, type);
    } catch (err) {
        console.error('Create group error', err);
        alert('Error creating group');
    }
}


const fetchMember = (e) => {
       clearTimeout(groupSearchTimeout);
    const q = e.target.value.trim();
    if (!q) {
        el.groupMemberResults.innerHTML = '<p class="text-center text-gray-400 text-sm py-4">Type to find colleagues...</p>';
        return;
    }
    groupSearchTimeout = setTimeout(async () => {
        try {
                    const res = await fetch(`${API_URL}/chat/users?q=${q}`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const searchUsers = await res.json();

        const getAllUsers = await fetch(`${API_URL}/users`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });

        const allUsers = await getAllUsers.json();
        
        const users = searchUsers.length === 0 ? allUsers : searchUsers;
            renderGroupMemberResults(users);
        } catch (err) {
            console.error('Group member search failed', err);
        }
    }, 300);
};
// Group member search debounce
let groupSearchTimeout = null;
el.groupMemberSearchInput.addEventListener('input', fetchMember);

// Enable/disable Create button based on group name input and type
el.groupNameInput.addEventListener('input', updateCreateButtonState);
el.groupTypeSelect.addEventListener('change', updateCreateButtonState);

function updateCreateButtonState() {
    const hasName = el.groupNameInput.value.trim();
    const type = el.groupTypeSelect.value;
    const minMembers = type === 'ANNOUNCEMENT' ? 1 : 2;
    const hasMembers = selectedMembersForGroup.size >= minMembers;
    el.createGroupSubmitBtn.disabled = !hasName || !hasMembers;
}

// Close on background click
el.createGroupModal.addEventListener('click', (e) => {
    if (e.target === el.createGroupModal) toggleCreateGroupModal(false);
});

// --- FORM HANDLING ---

el.chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const content = el.input.value.trim();
    if (!content || !currentRoomId) return;

    const clientMessageId = `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const optimisticMessage = {
        id: clientMessageId,
        clientMessageId,
        content,
        senderId: (myProfileId ?? myId),
        roomId: currentRoomId,
        createdAt: new Date().toISOString(),
        sender: { fullName: el.myNameDisplay?.innerText || 'Me' }
    };

    appendMessageUI(optimisticMessage);
    scrollToBottom();

    if (socket && socket.connected) {
        socket.emit('send_message', {
            roomId: currentRoomId,
            content: content,
            clientMessageId,
        });
    } else {
        fetch(`${API_URL}/chat/rooms/${currentRoomId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        }).catch((err) => console.error('Failed to send message (REST fallback)', err));
    }

    el.input.value = '';
    el.input.focus();
});

// Start App
init();