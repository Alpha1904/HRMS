export function qs<T extends Element = Element>(selector: string, root: ParentNode = document): T | null {
  return root.querySelector(selector) as T | null;
}

export function show(el: Element | null): void {
  if (!el) return;
  el.classList.remove('hidden');
}

export function hide(el: Element | null): void {
  if (!el) return;
  el.classList.add('hidden');
}

export function escapeHtml(s: any): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatDate(value: any): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

export function badgeClass(status: string): string {
  const map: Record<string, string> = {
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

export function toast(message: string, type: 'success' | 'error' | 'info' | 'warn' = 'info'): void {
  const root = document.getElementById('toastRoot');
  if (!root) {
    alert(message);
    return;
  }

  const colors: Record<string, string> = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-gray-900',
    warn: 'bg-amber-600',
  };

  const el = document.createElement('div');
  el.className = `${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg text-sm max-w-sm`;
  el.textContent = message;
  root.appendChild(el);

  setTimeout(() => {
    el.classList.add('opacity-0');
    setTimeout(() => el.remove(), 300);
  }, 2500);
}
