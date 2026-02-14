import { getCurrentUser, hasAnyRole, renderPaymentNav, showToast } from './core.js';

function el<T extends Element = Element>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing element: ${id}`);
  return node as unknown as T;
}

async function init() {
  const container = el<HTMLDivElement>('payroll-links');

  const me = await getCurrentUser();
  const role = String(me.role ?? '').toUpperCase();
  const isAdmin = hasAnyRole(role, ['HR_ADMIN', 'SYSTEM_ADMIN']);

  const links: Array<{ href: string; label: string; desc: string; show: boolean }> = [
    {
      href: 'payslip.html',
      label: 'Payslips',
      desc: 'View and download monthly payslips.',
      show: true,
    },
    {
      href: 'payment-compensation.html',
      label: 'Compensation',
      desc: 'Manage compensation components (admin).',
      show: isAdmin,
    },
    {
      href: 'payment-adjustments.html',
      label: 'Adjustments',
      desc: 'Manage salary adjustments (admin).',
      show: isAdmin,
    },
  ];

  container.innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      ${links
        .filter((l) => l.show)
        .map(
          (l) => `
          <a href="${l.href}" class="block border border-borderColor rounded p-4 bg-white hover:bg-dark-transparent">
            <div class="text-sm font-semibold text-gray-900">${l.label}</div>
            <div class="text-sm text-gray-600 mt-1">${l.desc}</div>
          </a>
        `,
        )
        .join('')}
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  init().catch((e) => showToast(e?.message || 'Failed to initialize payroll page', 'error'));
});
