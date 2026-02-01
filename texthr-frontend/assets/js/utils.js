export function qs(sel, root = document) {
  return root.querySelector(sel);
}

export function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

export function show(el) {
  if (!el) return;
  el.classList.remove('hidden');
}

export function hide(el) {
  if (!el) return;
  el.classList.add('hidden');
}

export function setLoading(btn, loading) {
  if (!btn) return;
  btn.disabled = !!loading;
  const txt = btn.getAttribute('data-text') || btn.textContent;
  if (!btn.getAttribute('data-text')) btn.setAttribute('data-text', txt);
  btn.textContent = loading ? 'Loading...' : txt;
}

export function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

export function badgeClass(status) {
  const map = {
    PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
    APPROVED: 'bg-blue-50 text-blue-800 border-blue-200',
    IN_PROGRESS: 'bg-violet-50 text-violet-800 border-violet-200',
    COMPLETED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    CANCELLED: 'bg-slate-50 text-slate-700 border-slate-200',
    NOT_STARTED: 'bg-slate-50 text-slate-700 border-slate-200',
    BLOCKED: 'bg-red-50 text-red-800 border-red-200',
  };
  return map[status] || 'bg-slate-50 text-slate-700 border-slate-200';
}

export function toast(message, type = 'info') {
  const root = document.getElementById('toastRoot');
  if (!root) return;

  const colors = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-slate-900',
    warn: 'bg-amber-600',
  };

  const el = document.createElement('div');
  el.className = `${colors[type] || colors.info} text-white px-4 py-3 rounded-lg shadow-lg text-sm max-w-sm`;
  el.textContent = message;
  root.appendChild(el);

  setTimeout(() => {
    el.classList.add('opacity-0');
    setTimeout(() => el.remove(), 300);
  }, 2500);
}

export function escapeHtml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
