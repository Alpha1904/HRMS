import { apiRequest } from './api.js';
import { getMe, logout } from './auth.js';
import { hide, show, toast, qs } from './utils.js';
import { renderDeparturesList, renderDepartureDetail } from './departures/departures.js';
import { renderMyTasks } from './departures/tasks.js';

const sections = {
  overview: document.getElementById('overviewSection'),
  departures: document.getElementById('departuresSection'),
  departureDetail: document.getElementById('departureDetailSection'),
  tasks: document.getElementById('tasksSection'),
  surveys: document.getElementById('surveysSection'),
};

function setTitle(t) {
  const el = document.getElementById('pageTitle');
  if (el) el.textContent = t;
}

function setActiveSection(key) {
  Object.values(sections).forEach((s) => s && s.classList.add('hidden'));
  if (sections[key]) sections[key].classList.remove('hidden');
}

function navItem(href, label) {
  const a = document.createElement('a');
  a.href = href;
  a.className = 'block rounded-lg px-3 py-2 text-sm hover:bg-slate-50 text-slate-700';
  a.textContent = label;
  return a;
}

function buildNav(user) {
  const role = user?.role;
  const nav = document.getElementById('nav');
  const mobileNav = document.getElementById('mobileNav');
  nav.innerHTML = '';
  mobileNav.innerHTML = '';

  const items = [];
  items.push({ href: '#overview', label: 'Overview' });
  items.push({ href: '#departures', label: role === 'EMPLOYEE' ? 'My Departures' : 'Departures' });
  items.push({ href: '#tasks', label: 'My Tasks' });

  items.forEach((i) => {
    nav.appendChild(navItem(i.href, i.label));
    mobileNav.appendChild(navItem(i.href, i.label));
  });
}

async function renderOverview(user) {
  setTitle('Overview');
  setActiveSection('overview');
  const el = sections.overview;
  el.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'grid grid-cols-1 md:grid-cols-3 gap-4';

  const cards = [
    { title: 'Pending', status: 'PENDING' },
    { title: 'In progress', status: 'IN_PROGRESS' },
    { title: 'Completed', status: 'COMPLETED' },
  ];

  const results = await Promise.all(
    cards.map((c) => apiRequest('GET', `/departures?status=${c.status}&page=1&limit=1`).catch(() => null)),
  );

  results.forEach((r, idx) => {
    const total = r?.pagination?.total ?? 0;
    const card = document.createElement('div');
    card.className = 'bg-white border border-slate-200 rounded-xl p-5';
    card.innerHTML = `<div class="text-sm text-slate-600">${cards[idx].title}</div><div class="text-2xl font-semibold text-slate-900 mt-2">${total}</div>`;
    wrap.appendChild(card);
  });

  el.appendChild(wrap);

  const actions = document.createElement('div');
  actions.className = 'mt-6 flex flex-wrap gap-2';
  actions.innerHTML = `<a href="#departures" class="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">View departures</a>`;
  el.appendChild(actions);
}

async function route(user) {
  const hash = window.location.hash || '#overview';

  if (hash.startsWith('#departure/')) {
    const id = Number(hash.split('/')[1]);
    if (!id) {
      window.location.hash = '#departures';
      return;
    }
    setTitle(`Departure #${id}`);
    setActiveSection('departureDetail');
    await renderDepartureDetail(sections.departureDetail, id, user);
    return;
  }

  if (hash === '#departures') {
    setTitle('Departures');
    setActiveSection('departures');
    await renderDeparturesList(sections.departures, user);
    return;
  }

  if (hash === '#tasks') {
    setTitle('My Tasks');
    setActiveSection('tasks');
    await renderMyTasks(sections.tasks, user);
    return;
  }

  await renderOverview(user);
}

async function main() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.replace('./login.html');
      return;
    }

    const user = await getMe();
    localStorage.setItem('user', JSON.stringify(user));

    buildNav(user);

    const userLabel = `${user.email} (${user.role})`;
    const currentUser = document.getElementById('currentUser');
    const mobileCurrentUser = document.getElementById('mobileCurrentUser');
    if (currentUser) currentUser.textContent = userLabel;
    if (mobileCurrentUser) mobileCurrentUser.textContent = userLabel;

    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('mobileLogoutBtn').addEventListener('click', logout);

    document.getElementById('refreshBtn').addEventListener('click', () => route(user));

    const mobileSidebar = document.getElementById('mobileSidebar');
    const sidebar = document.getElementById('sidebar');
    const openBtn = document.getElementById('mobileMenuBtn');
    const closeBtn = document.getElementById('mobileCloseBtn');

    openBtn.addEventListener('click', () => {
      show(mobileSidebar);
    });
    closeBtn.addEventListener('click', () => {
      hide(mobileSidebar);
    });
    mobileSidebar.addEventListener('click', (e) => {
      if (e.target === mobileSidebar) hide(mobileSidebar);
    });

    window.addEventListener('hashchange', () => route(user));
    await route(user);
  } catch (e) {
    toast(e?.message || 'Failed to initialize app', 'error');
    logout();
  }
}

main();
