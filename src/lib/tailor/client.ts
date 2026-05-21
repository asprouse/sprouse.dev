// Client-side tailor state: URL hash storage + DOM patch application.
// Loaded by /cv.astro and consumed by TailorPanel.tsx.

export interface TailorPatch {
  variant: 'cto' | 'principal' | 'cofounder';
  summary: string;
  roles: Array<{
    companySlug: string;
    projectIndices: number[];
    hideProjectIndices: number[];
  }>;
  emphasizedSkills: string[];
  rationale: string;
}

const HASH_KEY = 'tailor';

export function encodePatch(patch: TailorPatch): string {
  const json = JSON.stringify(patch);
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/=+$/, '');
}

export function decodePatch(encoded: string): TailorPatch | null {
  try {
    const padded = encoded + '==='.slice(0, (4 - (encoded.length % 4)) % 4);
    const bin = atob(padded);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as TailorPatch;
  } catch {
    return null;
  }
}

export function readPatchFromHash(): TailorPatch | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const encoded = params.get(HASH_KEY);
  if (!encoded) return null;
  return decodePatch(encoded);
}

export function writePatchToHash(patch: TailorPatch | null): void {
  if (typeof window === 'undefined') return;
  if (!patch) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
    return;
  }
  const params = new URLSearchParams();
  params.set(HASH_KEY, encodePatch(patch));
  history.replaceState(
    null,
    '',
    `${window.location.pathname}${window.location.search}#${params.toString()}`
  );
}

function clearTailorDom(): void {
  const summary = document.querySelector<HTMLElement>('.summary');
  if (summary) {
    const original = summary.getAttribute('data-original-summary');
    if (original) summary.textContent = original;
    summary.classList.remove('tailor-replaced');
  }

  document.querySelectorAll<HTMLElement>('.project').forEach((el) => {
    el.classList.remove('tailor-hidden', 'tailor-promoted');
    const originalIndex = el.getAttribute('data-project-index');
    if (originalIndex) el.style.order = originalIndex;
  });

  document.querySelectorAll<HTMLElement>('.skill-item').forEach((el) => {
    el.classList.remove('tailor-emphasis');
  });

  const badge = document.querySelector<HTMLElement>('.tailor-badge');
  if (badge) badge.hidden = true;

  const rationale = document.querySelector<HTMLElement>('[data-tailor-rationale]');
  if (rationale) {
    rationale.hidden = true;
    rationale.textContent = '';
  }
}

export function applyPatch(patch: TailorPatch): void {
  clearTailorDom();

  const summary = document.querySelector<HTMLElement>('.summary');
  if (summary && patch.summary) {
    summary.textContent = patch.summary;
    summary.classList.add('tailor-replaced');
  }

  for (const roleDirective of patch.roles) {
    const role = document.querySelector<HTMLElement>(
      `.role[data-role-slug="${cssEscape(roleDirective.companySlug)}"]`
    );
    if (!role) continue;

    const projects = Array.from(role.querySelectorAll<HTMLElement>('.project[data-project-index]'));

    const total = projects.length;
    const hideSet = new Set(roleDirective.hideProjectIndices);

    // Build a final ordering. Start with the explicit projectIndices,
    // then append any other (non-hidden) project that wasn't mentioned,
    // in their original index order.
    const explicit = roleDirective.projectIndices.filter(
      (i) => i >= 0 && i < total && !hideSet.has(i)
    );
    const remaining: number[] = [];
    for (let i = 0; i < total; i++) {
      if (hideSet.has(i)) continue;
      if (!explicit.includes(i)) remaining.push(i);
    }
    const finalOrder = [...explicit, ...remaining];

    const explicitSet = new Set(explicit);
    for (let position = 0; position < finalOrder.length; position++) {
      const originalIndex = finalOrder[position];
      if (originalIndex === undefined) continue;
      const project = projects[originalIndex];
      if (!project) continue;
      project.style.order = String(position);
      // Promoted = was reordered earlier than its natural position.
      // Only mark items that the model explicitly promoted, not the
      // implicit ones that just slid up because something else was hidden.
      if (explicitSet.has(originalIndex) && position < originalIndex) {
        project.classList.add('tailor-promoted');
      }
    }

    for (const hideIndex of hideSet) {
      const project = projects[hideIndex];
      if (project) project.classList.add('tailor-hidden');
    }
  }

  const emphasizedLower = new Set(patch.emphasizedSkills.map((s) => s.toLowerCase().trim()));
  document.querySelectorAll<HTMLElement>('.skill-item').forEach((el) => {
    const name = (el.getAttribute('data-skill') || '').toLowerCase().trim();
    if (emphasizedLower.has(name)) el.classList.add('tailor-emphasis');
  });

  const badge = document.querySelector<HTMLElement>('.tailor-badge');
  const variantSpan = document.querySelector<HTMLElement>('[data-tailor-variant]');
  if (badge && variantSpan) {
    variantSpan.textContent = patch.variant;
    badge.hidden = false;
  }

  const rationale = document.querySelector<HTMLElement>('[data-tailor-rationale]');
  if (rationale) {
    rationale.textContent = patch.rationale;
  }

  wireBadgeControls();
}

export function clearPatch(): void {
  clearTailorDom();
  writePatchToHash(null);
  window.dispatchEvent(new CustomEvent('tailor:cleared'));
}

function cssEscape(s: string): string {
  return s.replace(/["\\]/g, '\\$&');
}

let badgeWired = false;
function wireBadgeControls(): void {
  if (badgeWired) return;
  badgeWired = true;

  const whyBtn = document.querySelector<HTMLButtonElement>('[data-tailor-why-toggle]');
  const rationale = document.querySelector<HTMLElement>('[data-tailor-rationale]');
  if (whyBtn && rationale) {
    whyBtn.addEventListener('click', () => {
      rationale.hidden = !rationale.hidden;
    });
  }

  const clearBtn = document.querySelector<HTMLButtonElement>('[data-tailor-clear]');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => clearPatch());
  }
}

export function initTailorFromHash(): void {
  const patch = readPatchFromHash();
  if (patch) applyPatch(patch);
}
