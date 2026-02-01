import { apiRequest } from '../../api.js';
import { escapeHtml, toast } from '../../ui.js';
import type { CurrentUser } from '../../auth.js';

function canDelete(role: string): boolean {
  return role === 'MANAGER' || role === 'HR_ADMIN' || role === 'SYSTEM_ADMIN';
}

export async function renderDocuments(root: HTMLElement, departureId: number, user: CurrentUser): Promise<void> {
  root.innerHTML = '<div class="p-3 text-sm text-gray-500">Loading...</div>';

  const docs = await apiRequest('GET', `/departures/${departureId}/documents`);

  root.innerHTML = `
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
      <div>
        <h6 class="mb-1">Documents</h6>
        <p class="text-sm text-gray-500 mb-0">Upload and manage departure documents</p>
      </div>
      <div style="min-width: 520px">
        <form id="upForm" class="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input id="name" required class="bg-white border-borderColor text-gray-900 text-sm rounded-input block w-full py-2 px-2.5 h-[38px]" placeholder="Document name" />
          <input id="type" class="bg-white border-borderColor text-gray-900 text-sm rounded-input block w-full py-2 px-2.5 h-[38px]" placeholder="Type (optional)" />
          <input id="file" type="file" required class="md:col-span-2 bg-white border-borderColor text-gray-900 text-sm rounded-input block w-full py-2 px-2.5" />
          <button class="btn btn-primary md:col-span-2" type="submit">Upload</button>
          <div id="err" class="md:col-span-2 hidden text-sm text-red-600"></div>
        </form>
      </div>
    </div>

    <div class="table-responsive mt-3">
      <table class="table table-nowrap">
        <thead>
          <tr>
            <th class="py-2 px-5">Name</th>
            <th class="py-2 px-5">Type</th>
            <th class="py-2 px-5">Link</th>
            <th class="py-2 px-5">Actions</th>
          </tr>
        </thead>
        <tbody id="rows"></tbody>
      </table>
    </div>
  `;

  const rows = root.querySelector('#rows') as HTMLElement;

  const renderRows = (list: any[]) => {
    rows.innerHTML = (list || [])
      .map((d) => {
        return `
          <tr class="border-b border-borderColor">
            <td class="py-2 px-5 text-sm">${escapeHtml(d.name)}</td>
            <td class="py-2 px-5 text-sm">${escapeHtml(d.type || '')}</td>
            <td class="py-2 px-5 text-sm"><a class="text-primary" href="${escapeHtml(d.url)}" target="_blank" rel="noreferrer">Download</a></td>
            <td class="py-2 px-5 text-sm">
              ${canDelete(user.role) ? `<button class="btn btn-white del" data-id="${d.id}">Delete</button>` : ''}
            </td>
          </tr>
        `;
      })
      .join('');

    rows.querySelectorAll('.del').forEach((b) => {
      b.addEventListener('click', async () => {
        const id = Number((b as HTMLElement).getAttribute('data-id'));
        if (!confirm('Delete this document?')) return;
        try {
          await apiRequest('DELETE', `/departures/documents/${id}`);
          toast('Document deleted', 'success');
          window.location.hash = `#departure/${departureId}`;
        } catch (e: any) {
          toast(e?.message || 'Failed to delete document', 'error');
        }
      });
    });
  };

  renderRows(docs);

  const form = root.querySelector('#upForm') as HTMLFormElement;
  const err = root.querySelector('#err') as HTMLElement;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.classList.add('hidden');

    const fileInput = root.querySelector('#file') as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) {
      err.textContent = 'File is required';
      err.classList.remove('hidden');
      return;
    }

    const fd = new FormData();
    fd.append('file', file);
    fd.append('name', (root.querySelector('#name') as HTMLInputElement).value);
    fd.append('type', (root.querySelector('#type') as HTMLInputElement).value);

    try {
      await apiRequest('POST', `/departures/${departureId}/documents`, fd, { isFormData: true });
      toast('Uploaded', 'success');
      window.location.hash = `#departure/${departureId}`;
    } catch (e2: any) {
      err.textContent = e2?.message || 'Upload failed';
      err.classList.remove('hidden');
    }
  });
}
