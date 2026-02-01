import { apiRequest } from '../api.js';
import { escapeHtml, toast } from '../utils.js';

function canDelete(role) {
  return role === 'MANAGER' || role === 'HR_ADMIN' || role === 'SYSTEM_ADMIN';
}

export async function renderDocumentsTab(root, departureId, user) {
  root.innerHTML = '';

  const top = document.createElement('div');
  top.className = 'flex flex-col md:flex-row md:items-end md:justify-between gap-3';
  top.innerHTML = `
    <div>
      <div class="text-sm font-semibold text-slate-900">Documents</div>
      <div class="text-sm text-slate-600">Upload and manage departure documents.</div>
    </div>
  `;

  const uploadBox = document.createElement('div');
  uploadBox.className = 'w-full md:w-[520px]';
  uploadBox.innerHTML = `
    <form id="upForm" class="grid grid-cols-1 md:grid-cols-2 gap-2">
      <input id="name" required class="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Document name" />
      <input id="type" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Type (optional)" />
      <input id="file" type="file" required class="md:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      <button class="md:col-span-2 rounded-lg bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700">Upload</button>
      <div id="err" class="md:col-span-2 hidden text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3"></div>
    </form>
  `;

  top.appendChild(uploadBox);
  root.appendChild(top);

  const listWrap = document.createElement('div');
  listWrap.className = 'mt-4 rounded-xl border border-slate-200 overflow-hidden bg-white';
  listWrap.innerHTML = `<div class="p-4 text-sm text-slate-600">Loading...</div>`;
  root.appendChild(listWrap);

  const load = async () => {
    const docs = await apiRequest('GET', `/departures/${departureId}/documents`);

    const rows = (docs || [])
      .map((d) => {
        return `
          <tr class="border-t border-slate-200">
            <td class="px-4 py-3 text-sm text-slate-900">${escapeHtml(d.name)}</td>
            <td class="px-4 py-3 text-sm text-slate-700">${escapeHtml(d.type || '')}</td>
            <td class="px-4 py-3 text-sm">
              <a class="text-blue-700 hover:underline" href="${escapeHtml(d.url)}" target="_blank" rel="noreferrer">Download</a>
            </td>
            <td class="px-4 py-3 text-sm">
              ${canDelete(user.role) ? `<button data-id="${d.id}" class="del rounded-lg border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50">Delete</button>` : ''}
            </td>
          </tr>
        `;
      })
      .join('');

    listWrap.innerHTML = `
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead class="bg-slate-50">
            <tr>
              <th class="text-left text-xs font-semibold text-slate-700 px-4 py-2">Name</th>
              <th class="text-left text-xs font-semibold text-slate-700 px-4 py-2">Type</th>
              <th class="text-left text-xs font-semibold text-slate-700 px-4 py-2">Link</th>
              <th class="text-left text-xs font-semibold text-slate-700 px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr class="border-t border-slate-200"><td class="px-4 py-6 text-sm text-slate-600" colspan="4">No documents.</td></tr>`}
          </tbody>
        </table>
      </div>
    `;

    listWrap.querySelectorAll('.del').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const docId = Number(btn.getAttribute('data-id'));
        if (!confirm('Delete this document?')) return;
        try {
          await apiRequest('DELETE', `/departures/documents/${docId}`);
          toast('Document deleted', 'success');
          await load();
        } catch (e) {
          toast(e?.message || 'Failed to delete', 'error');
        }
      });
    });
  };

  const form = uploadBox.querySelector('#upForm');
  const err = uploadBox.querySelector('#err');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.classList.add('hidden');

    const file = uploadBox.querySelector('#file').files?.[0];
    if (!file) {
      err.textContent = 'File is required';
      err.classList.remove('hidden');
      return;
    }

    const fd = new FormData();
    fd.append('file', file);
    fd.append('name', uploadBox.querySelector('#name').value.trim());
    fd.append('type', uploadBox.querySelector('#type').value.trim());

    try {
      await apiRequest('POST', `/departures/${departureId}/documents`, fd, { isFormData: true });
      toast('Uploaded', 'success');
      form.reset();
      await load();
    } catch (e2) {
      err.textContent = e2?.message || 'Upload failed';
      err.classList.remove('hidden');
    }
  });

  await load();
}
