import {
  apiFetch,
  fmtMoney,
  fmtMonthLabel,
  getCurrentUser,
  getProfileIdForCurrentUser,
  hasAnyRole,
  monthInputValueToIsoDate,
  renderPaymentNav,
  showToast,
} from './core.js';

function el<T extends Element = Element>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing element: ${id}`);
  return node as unknown as T;
}

function setHidden(id: string, hidden: boolean) {
  const node = document.getElementById(id);
  if (!node) return;
  if (hidden) node.classList.add('hidden');
  else node.classList.remove('hidden');
}

type PayslipRow = {
  profileId: number;
  month: string;
  grossAmount: any;
  deductions: any;
  netAmount: any;
  status?: string;
};

function mapPayslipToRow(profileId: number, data: any): PayslipRow {
  return {
    profileId,
    month: String(data?.month ?? ''),
    grossAmount: (data as any)?.grossAmount,
    deductions: (data as any)?.deductions,
    netAmount: (data as any)?.netAmount,
    status: (data as any)?.status,
  };
}

function renderRows(rows: PayslipRow[]) {
  const tbody = el<HTMLTableSectionElement>('payslips-tbody');
  tbody.innerHTML = '';

  if (!rows.length) {
    setHidden('payslips-empty', false);
    return;
  }

  setHidden('payslips-empty', true);

  rows
    .sort((a, b) => String(b.month).localeCompare(String(a.month)))
    .forEach((r) => {
      const tr = document.createElement('tr');
      tr.className = 'border-t border-borderColor';

      const status = String(r.status || 'GENERATED');

      tr.innerHTML = `
        <td class="px-4 py-3 text-sm text-gray-800">${fmtMonthLabel(r.month)}</td>
        <td class="px-4 py-3 text-sm text-gray-800">${fmtMoney(r.grossAmount)}</td>
        <td class="px-4 py-3 text-sm text-gray-800">${fmtMoney(r.deductions)}</td>
        <td class="px-4 py-3 text-sm font-medium text-gray-900">${fmtMoney(r.netAmount)}</td>
        <td class="px-4 py-3 text-sm text-gray-700">${status}</td>
        <td class="px-4 py-3 text-sm">
          <button data-profile-id="${r.profileId}" data-month="${r.month}" class="btn-download px-3 py-2 rounded text-xs font-medium bg-primary text-white">Download PDF</button>
        </td>
      `;

      tbody.appendChild(tr);
    });

  tbody.querySelectorAll<HTMLButtonElement>('.btn-download').forEach((b) => {
    b.addEventListener('click', async () => {
      const profileId = Number(b.dataset.profileId);
      const month = String(b.dataset.month);
      await downloadPayslip(profileId, month);
    });
  });
}

async function downloadPayslip(profileId: number, monthIso: string) {
  const res = (await apiFetch(`/payment/payslip/download/${profileId}/${encodeURIComponent(monthIso)}`, { raw: true })) as Response;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `payslip_${profileId}_${fmtMonthLabel(monthIso)}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 500);
}

async function getPayslip(profileId: number, monthIso: string) {
  return await apiFetch(`/payment/payslip/${profileId}/${encodeURIComponent(monthIso)}`);
}

async function generatePayslip(profileId: number, monthIso: string) {
  return await apiFetch('/payment/payslip/generate', {
    method: 'POST',
    body: {
      profileId,
      month: monthIso,
    },
  });
}

function lastMonths(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    out.push(`${y}-${m}-01`);
    d.setUTCMonth(d.getUTCMonth() - 1);
  }
  return out;
}

async function safeGetPayslip(profileId: number, monthIso: string) {
  try {
    return await getPayslip(profileId, monthIso);
  } catch (e: any) {
    if (e?.status === 404) return null;
    throw e;
  }
}

async function init() {
  await renderPaymentNav('payment-nav');

  const me = await getCurrentUser();
  const role = String(me.role ?? '').toUpperCase();
  const isAdmin = hasAnyRole(role, ['HR_ADMIN', 'SYSTEM_ADMIN']);

  const monthInput = el<HTMLInputElement>('month');
  const btnLoad = el<HTMLButtonElement>('btn-load');
  const btnLoadLast = el<HTMLButtonElement>('btn-load-last');
  const btnGenerate = el<HTMLButtonElement>('btn-generate');
  const profileWrap = document.getElementById('admin-profile-wrap');

  if (!isAdmin && profileWrap) profileWrap.classList.add('hidden');
  if (!isAdmin) btnGenerate.classList.add('hidden');

  const now = new Date();
  const ym = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  monthInput.value = ym;

  let profileId: number | null = null;
  if (!isAdmin) {
    if (!me.id) throw new Error('No current user id');
    profileId = await getProfileIdForCurrentUser(me.id);
    const hint = document.getElementById('payslips-hint');
    if (hint) hint.textContent = `Profile ID: ${profileId}`;
  }

  const getProfileId = async () => {
    if (!isAdmin) return Number(profileId);
    const v = el<HTMLInputElement>('profileId').value.trim();
    const pid = Number(v);
    if (!pid) throw new Error('Please enter a valid Profile ID');
    return pid;
  };

  btnLoad.addEventListener('click', async () => {
    try {
      const pid = await getProfileId();
      const monthIso = monthInputValueToIsoDate(monthInput.value);
      if (!monthIso) throw new Error('Please select a month');

      const data = await getPayslip(pid, monthIso);
      renderRows([mapPayslipToRow(pid, data)]);
    } catch (e: any) {
      showToast(e?.message || 'Failed to load payslip', 'error');
      renderRows([]);
    }
  });

  btnLoadLast.addEventListener('click', async () => {
    try {
      const pid = await getProfileId();
      const months = lastMonths(12);

      const items = await Promise.all(
        months.map(async (m) => {
          const data = await safeGetPayslip(pid, m);
          if (!data) return null;
          return mapPayslipToRow(pid, data);
        }),
      );

      renderRows(items.filter(Boolean) as PayslipRow[]);
    } catch (e: any) {
      showToast(e?.message || 'Failed to load payslips', 'error');
      renderRows([]);
    }
  });

  btnGenerate.addEventListener('click', async () => {
    try {
      const pid = await getProfileId();
      const monthIso = monthInputValueToIsoDate(monthInput.value);
      if (!monthIso) throw new Error('Please select a month');

      try {
        await generatePayslip(pid, monthIso);
        showToast('Payslip generated', 'success');
      } catch (e: any) {
        if (e?.status === 409) {
          showToast('Payslip already exists for this month. Loading existing payslip.', 'info');
        } else {
          throw e;
        }
      }

      const data = await getPayslip(pid, monthIso);
      renderRows([mapPayslipToRow(pid, data)]);
    } catch (e: any) {
      showToast(e?.message || 'Failed to generate payslip', 'error');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  init().catch((e) => showToast(e?.message || 'Failed to initialize page', 'error'));
});
