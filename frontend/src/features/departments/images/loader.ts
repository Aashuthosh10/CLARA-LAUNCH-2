type ImageModule = () => Promise<string>;

// All department images discovered at build time.
// Runtime usage is restricted to the currently selected department folder.
const ALL_IMAGE_MODULES = import.meta.glob(['../../../assets/*/*.{png,jpg,jpeg,webp}', '!../../../assets/logo/**'], {
  eager: false,
  import: 'default',
}) as Record<string, ImageModule>;

function normalizePath(p: string) {
  return p.replace(/\\/g, '/');
}

function extractFolderNameFromGlobKey(globKey: string): string | null {
  const k = normalizePath(globKey);
  // Robustly extract the folder name right after the `assets/` segment:
  // e.g. ".../assets/Data Science/2nd image.png" -> "Data Science"
  const m = k.match(/assets\/([^/]+)\//i);
  return m?.[1] ?? null;
}

const DISCOVERED_DEPARTMENT_FOLDERS: string[] = (() => {
  const set = new Set<string>();
  for (const globKey of Object.keys(ALL_IMAGE_MODULES)) {
    const folder = extractFolderNameFromGlobKey(globKey);
    if (folder) set.add(folder);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
})();

function extractSlotIndexFromFilename(filename: string): number | null {
  // Preferred: ordinal mapping like "1st image", "2nd image", "3rd image", etc.
  // Also accepts variations like "image1.png".
  const ordinal = filename.match(/(?:^|\\b)([1-5])(?:st|nd|rd|th)(?=\\D|$)/i);
  if (ordinal?.[1]) return parseInt(ordinal[1], 10);

  // Fallback: scan all 1-2 digit number tokens and pick the first within [1..5].
  // This avoids the earlier bug where a filename like "2024_image2.png"
  // would match "2024" first and then incorrectly return null.
  const tokens = filename.match(/[0-9]{1,2}/g);
  if (!tokens) return null;
  for (const t of tokens) {
    const n = parseInt(t, 10);
    if (Number.isFinite(n) && n >= 1 && n <= 5) return n;
  }
  return null;
}

function buildFixedSlotImageUrlsForFolder(folderName: string): Promise<string[]> {
  const slotUrls: [string, string, string, string, string] = ['', '', '', '', ''];
  const chosenFilename: [string | null, string | null, string | null, string | null, string | null] = [
    null,
    null,
    null,
    null,
    null,
  ];

  const slotCandidates: Array<{
    slot: number;
    urlPromise: ImageModule;
    filename: string;
  }> = [];

  for (const [globKey, urlPromise] of Object.entries(ALL_IMAGE_MODULES)) {
    const folder = extractFolderNameFromGlobKey(globKey);
    if (!folder || folder !== folderName) continue;

    const normalized = normalizePath(globKey);
    const filename = normalized.split('/').pop() ?? normalized;
    const slot = extractSlotIndexFromFilename(filename);
    if (!slot) continue;

    slotCandidates.push({ slot, urlPromise, filename });
  }

  // Deterministic: sort by slot then filename, then pick the lexicographically smallest filename per slot.
  slotCandidates.sort((a, b) => {
    if (a.slot !== b.slot) return a.slot - b.slot;
    return a.filename.localeCompare(b.filename);
  });

  // Load only chosen candidates (at most 5).
  const chosen = new Map<number, { urlPromise: ImageModule; filename: string }>();
  for (const cand of slotCandidates) {
    if (!chosen.has(cand.slot) || (chosen.get(cand.slot)!.filename > cand.filename)) {
      chosen.set(cand.slot, { urlPromise: cand.urlPromise, filename: cand.filename });
    }
  }

  const promises: Array<Promise<{ slot: number; url: string; filename: string }>> = [];
  for (const [slot, info] of chosen.entries()) {
    promises.push(
      info.urlPromise().then((url) => ({
        slot,
        url,
        filename: info.filename,
      }))
    );
  }

  return Promise.all(promises).then((resolved) => {
    for (const item of resolved) {
      const idx = item.slot - 1;
      if (idx < 0 || idx > 4) continue;
      // If duplicates exist, deterministic pick already happened in `chosen`.
      slotUrls[idx] = item.url;
      chosenFilename[idx] = item.filename;
    }
    return slotUrls;
  });
}

export async function loadDepartmentImageUrls(folderName: string): Promise<string[]> {
  // Always return 5 fixed slots (empty slots are intentionally empty strings).
  return buildFixedSlotImageUrlsForFolder(folderName);
}

export function getDiscoveredDepartmentFolders(): string[] {
  return DISCOVERED_DEPARTMENT_FOLDERS;
}

