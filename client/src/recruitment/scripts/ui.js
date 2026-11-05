(function () {
  const NS = (window.HRMSRecruitment = window.HRMSRecruitment || {});

  function ensureToastRoot() {
    let el = document.getElementById('toast-root');
    if (el) return el;

    el = document.createElement('div');
    el.id = 'toast-root';
    el.className = 'fixed top-4 right-4 z-[100] flex flex-col gap-2';
    document.body.appendChild(el);
    return el;
  }

  function toast(message, type, timeoutMs) {
    const root = ensureToastRoot();
    const t = String(type || 'info');

    const wrap = document.createElement('div');
    wrap.className = [
      'w-[min(420px,calc(100vw-2rem))]',
      'rounded-lg border shadow-lg',
      'bg-white/95 text-slate-900 dark:bg-slate-900/95 dark:text-slate-100',
      'backdrop-blur px-4 py-3',
      'flex items-start gap-3',
    ].join(' ');

    const badge = document.createElement('div');
    badge.className = [
      'mt-0.5 h-2.5 w-2.5 rounded-full',
      t === 'success'
        ? 'bg-emerald-500'
        : t === 'error'
          ? 'bg-rose-500'
          : t === 'warn'
            ? 'bg-amber-500'
            : 'bg-blue-500',
    ].join(' ');

    const content = document.createElement('div');
    content.className = 'text-sm leading-5';
    content.textContent = String(message || '');

    const closeBtn = document.createElement('button');
    closeBtn.className = 'ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-200';
    closeBtn.type = 'button';
    closeBtn.textContent = '✕';
    closeBtn.onclick = () => wrap.remove();

    wrap.appendChild(badge);
    wrap.appendChild(content);
    wrap.appendChild(closeBtn);
    root.appendChild(wrap);

    const ms = timeoutMs === undefined ? 3500 : timeoutMs;
    if (ms > 0) setTimeout(() => wrap.remove(), ms);
  }

  function setLoading(isLoading, label) {
    const el = document.getElementById('global-loading');
    if (!el) return;

    const textEl = document.getElementById('global-loading-text');
    if (textEl) textEl.textContent = label || 'Loading…';

    el.classList.toggle('hidden', !isLoading);
  }

  function openModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('hidden');
    el.setAttribute('aria-hidden', 'false');
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('hidden');
    el.setAttribute('aria-hidden', 'true');
  }

  function wireModalClose() {
    document.addEventListener('click', (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      const modal = target.closest('[data-modal]');
      if (!modal) return;

      if (target.matches('[data-modal-close]')) {
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
      }

      if (target.matches('[data-modal-overlay]')) {
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
      }
    });
  }

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  NS.ui = {
    toast,
    setLoading,
    openModal,
    closeModal,
    wireModalClose,
    qs,
    qsa,
  };
})();
