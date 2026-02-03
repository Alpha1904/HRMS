import { apiRequest } from './api.js';
import { escapeHtml } from './ui.js';

export type ProfileLite = {
  id: number;
  userId?: number;
  fullName: string;
};

let profilesCache: ProfileLite[] | null = null;
let profilesPromise: Promise<ProfileLite[]> | null = null;

export async function fetchAllProfiles(): Promise<ProfileLite[]> {
  if (profilesCache) return profilesCache;
  if (profilesPromise) return profilesPromise;

  profilesPromise = (async () => {
    const all: ProfileLite[] = [];
    let page = 1;
    const limit = 200;

    while (true) {
      const res: any = await apiRequest('GET', `/profiles?page=${page}&limit=${limit}`);
      const data: any[] = Array.isArray(res?.data) ? res.data : [];
      data.forEach((p) => {
        all.push({
          id: Number(p?.id),
          userId: p?.userId === undefined || p?.userId === null ? undefined : Number(p.userId),
          fullName: String(p?.fullName ?? ''),
        });
      });

      const meta = res?.meta;
      const lastPage = Number(meta?.lastPage ?? page);
      if (page >= lastPage) break;
      page += 1;
    }

    const sorted = all
      .filter((p) => p.id && p.fullName)
      .sort((a, b) => a.fullName.localeCompare(b.fullName));

    profilesCache = sorted;
    return sorted;
  })();

  return profilesPromise;
}

export function renderProfileOptions(
  profiles: ProfileLite[],
  opts: {
    valueField: 'id' | 'userId';
    selected?: number | string | null;
    includeEmpty?: { value: string; label: string };
    includeUnknownSelected?: boolean;
  },
): string {
  const selectedVal = opts.selected === undefined || opts.selected === null ? '' : String(opts.selected);

  const out: string[] = [];
  if (opts.includeEmpty) {
    out.push(`<option value="${escapeHtml(opts.includeEmpty.value)}">${escapeHtml(opts.includeEmpty.label)}</option>`);
  }

  const seenSelected = new Set<string>();

  profiles.forEach((p) => {
    const value = opts.valueField === 'id' ? String(p.id) : p.userId ? String(p.userId) : '';
    if (!value) return;
    const selected = value === selectedVal ? ' selected' : '';
    if (selected) seenSelected.add(value);
    out.push(`<option value="${escapeHtml(value)}"${selected}>${escapeHtml(p.fullName)}</option>`);
  });

  if (opts.includeUnknownSelected && selectedVal && !seenSelected.has(selectedVal)) {
    out.unshift(`<option value="${escapeHtml(selectedVal)}" selected>${escapeHtml(selectedVal)}</option>`);
  }

  return out.join('');
}
