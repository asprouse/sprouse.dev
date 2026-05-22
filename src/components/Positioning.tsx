import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  applyPatch,
  clearPatch,
  initTailorFromHash,
  readStateFromHash,
  writeStateToHash,
  type TailorPatch
} from '../lib/tailor/client';

export interface PositioningOption {
  slug: 'cto' | 'principal' | 'cofounder';
  label: string;
  /** URL the preset pill links to (e.g., /cv/print?lens=principal). */
  path: string;
}

interface Props {
  options: PositioningOption[];
  currentSlug: PositioningOption['slug'];
}

const CUSTOM = 'custom';
type SubmitState = 'idle' | 'loading' | 'error';

export default function Positioning({ options, currentSlug }: Props) {
  // Lazy initializers read the URL hash once during the first render so the
  // initial committed state already reflects an applied tailor — avoiding a
  // setState-in-effect pattern. SSR returns the empty defaults.
  const [tailored, setTailored] = useState(
    () => typeof window !== 'undefined' && readStateFromHash() !== null
  );
  const [jd, setJd] = useState(() => {
    if (typeof window === 'undefined') return '';
    return readStateFromHash()?.jd ?? '';
  });
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    initTailorFromHash();
    const onCleared = () => {
      setTailored(false);
      setJd('');
      setSubmitState('idle');
      setError(null);
    };
    window.addEventListener('tailor:cleared', onCleared);
    return () => window.removeEventListener('tailor:cleared', onCleared);
  }, []);

  function openDialog() {
    setError(null);
    setSubmitState('idle');
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = jd.trim();
    if (value.length < 40) {
      setError('Paste a longer job description (a few sentences at minimum).');
      return;
    }
    setSubmitState('loading');
    setError(null);
    try {
      const res = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jobDescription: value })
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || `Request failed (${res.status})`);
      }
      const patch = (await res.json()) as TailorPatch;
      applyPatch(patch);
      writeStateToHash({ jd: value, patch });
      setTailored(true);
      setSubmitState('idle');
      closeDialog();
    } catch (err) {
      setSubmitState('error');
      setError(err instanceof Error ? err.message : 'Tailoring failed.');
    }
  }

  function onReset() {
    clearPatch();
    closeDialog();
  }

  function onSelectChange(e: ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (value === CUSTOM) {
      openDialog();
      return;
    }
    if (tailored) {
      clearPatch();
    }
    const next = options.find((o) => o.slug === value);
    if (next) window.location.href = next.path;
  }

  return (
    <>
      {/* Desktop: pill row */}
      <div
        className="positioning-pills"
        role="tablist"
        aria-label="Positioning"
        suppressHydrationWarning
      >
        <span className="positioning-label">Lens</span>
        {options.map((opt) => {
          const isActive = !tailored && opt.slug === currentSlug;
          if (isActive) {
            return (
              <span
                key={opt.slug}
                className="positioning-pill current"
                role="tab"
                aria-selected="true"
                aria-current="page"
              >
                {opt.label}
              </span>
            );
          }
          return (
            <a
              key={opt.slug}
              href={opt.path}
              className="positioning-pill"
              role="tab"
              aria-selected="false"
            >
              {opt.label}
            </a>
          );
        })}
        <button
          type="button"
          className={['positioning-pill', 'positioning-custom', tailored && 'current']
            .filter(Boolean)
            .join(' ')}
          aria-pressed={tailored}
          onClick={openDialog}
        >
          {tailored ? 'Custom ✓' : 'Custom…'}
        </button>
      </div>

      {/* Mobile: native select */}
      <select
        className="positioning-select"
        value={tailored ? CUSTOM : currentSlug}
        onChange={onSelectChange}
        aria-label="Positioning"
      >
        {options.map((opt) => (
          <option key={opt.slug} value={opt.slug}>
            Lens: {opt.label}
          </option>
        ))}
        <option value={CUSTOM}>{tailored ? 'Custom (edit JD)…' : 'Custom (paste JD)…'}</option>
      </select>

      <dialog ref={dialogRef} className="positioning-dialog" onClose={() => setSubmitState('idle')}>
        <form method="dialog" onSubmit={submit}>
          <div className="positioning-dialog-head">
            <h2>{tailored ? 'Edit your job description' : 'Tailor from a job description'}</h2>
            <p>
              Pastes get re-ranked and emphasized against the CV. Andrew&rsquo;s experience
              isn&rsquo;t fabricated &mdash; only what&rsquo;s already there gets reframed.
            </p>
          </div>
          <textarea
            className="positioning-dialog-textarea"
            placeholder="Paste a job description — full text or just the key parts."
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            rows={10}
            disabled={submitState === 'loading'}
            autoFocus
          />
          {error && <p className="positioning-dialog-error">{error}</p>}
          <div className="positioning-dialog-actions">
            <button type="button" className="dialog-btn" onClick={closeDialog}>
              Cancel
            </button>
            {tailored && (
              <button type="button" className="dialog-btn dialog-reset" onClick={onReset}>
                Reset to default
              </button>
            )}
            <button
              type="submit"
              className="dialog-btn dialog-submit"
              disabled={submitState === 'loading' || jd.trim().length < 40}
            >
              {submitState === 'loading' ? 'Tailoring…' : tailored ? 'Re-tailor' : 'Tailor CV'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
