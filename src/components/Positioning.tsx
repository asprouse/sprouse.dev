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
            aria-label="Job description"
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
      <style>{`
        .positioning-pills {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          border: 1px solid var(--color-rule, #d6d3d1);
          border-radius: 999px;
          padding: 2px;
          font-size: 13px;
          background: var(--color-surface, #ffffff);
        }
        .positioning-label {
          padding: 0 8px;
          color: var(--color-muted, #57534e);
          font-size: 12px;
        }
        .positioning-pill {
          appearance: none;
          background: none;
          border: none;
          padding: 4px 10px;
          border-radius: 999px;
          text-decoration: none;
          white-space: nowrap;
          font: inherit;
          font-size: 12px;
          font-weight: 500;
          color: var(--color-muted, #57534e);
          cursor: pointer;
        }
        .positioning-pill:hover {
          background: color-mix(in oklab, currentColor 6%, transparent);
          color: var(--color-ink, #0c0a09);
        }
        .positioning-pill.current,
        .positioning-pill.current:hover {
          background: var(--color-brand);
          color: var(--color-accent-ink, #ffffff);
        }

        .positioning-select {
          display: none;
        }

        .positioning-dialog {
          position: fixed;
          inset: 0;
          margin: auto;
          max-width: min(640px, 92vw);
          max-height: min(560px, 92vh);
          width: max-content;
          height: max-content;
          border: 1px solid var(--color-rule, #d6d3d1);
          border-radius: 12px;
          padding: 20px;
          font-family: inherit;
          background: var(--color-surface, #ffffff);
          color: var(--color-ink, #0c0a09);
        }
        .positioning-dialog::backdrop {
          background: rgba(12, 10, 9, 0.45);
        }
        .positioning-dialog-head h2 {
          margin: 0 0 6px;
          font-size: 18px;
          font-weight: 700;
        }
        .positioning-dialog-head p {
          margin: 0 0 14px;
          font-size: 13px;
          color: var(--color-muted, #57534e);
          line-height: 1.45;
        }
        .positioning-dialog-textarea {
          width: min(600px, 88vw);
          padding: 10px;
          border: 1px solid var(--color-rule, #d6d3d1);
          border-radius: 8px;
          font-family: inherit;
          font-size: 13px;
          line-height: 1.45;
          resize: vertical;
          min-height: 180px;
          color: var(--color-ink, #0c0a09);
          background: var(--color-surface, #ffffff);
        }
        .positioning-dialog-textarea:focus {
          outline: 2px solid color-mix(in oklab, var(--color-brand) 60%, transparent);
          outline-offset: 1px;
          border-color: var(--color-brand);
        }
        .positioning-dialog-error {
          margin: 10px 0 0;
          padding: 8px 10px;
          border-radius: 6px;
          background: #fef2f2;
          color: #991b1b;
          font-size: 12px;
        }
        .positioning-dialog-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
          align-items: center;
          margin-top: 14px;
          flex-wrap: wrap;
        }
        .dialog-btn {
          appearance: none;
          background: none;
          border: 1px solid var(--color-rule, #d6d3d1);
          color: var(--color-ink, #0c0a09);
          padding: 8px 14px;
          border-radius: 6px;
          font: inherit;
          font-size: 13px;
          cursor: pointer;
        }
        .dialog-btn:hover {
          background: color-mix(in oklab, currentColor 4%, transparent);
        }
        .dialog-reset {
          color: var(--color-muted, #57534e);
        }
        .dialog-submit {
          background: var(--color-brand);
          border-color: var(--color-brand);
          color: var(--color-accent-ink, #ffffff);
          font-weight: 600;
        }
        .dialog-submit:hover {
          background: var(--color-brand);
          opacity: 0.92;
        }
        .dialog-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 720px) {
          .positioning-pills {
            display: none;
          }
          .positioning-select {
            display: inline-block;
            appearance: none;
            background: var(--color-surface, #ffffff);
            border: 1px solid var(--color-rule, #d6d3d1);
            border-radius: 8px;
            padding: 7px 30px 7px 12px;
            font: inherit;
            font-size: 13px;
            color: var(--color-ink, #0c0a09);
            cursor: pointer;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2357534e' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 10px center;
          }
        }
      `}</style>
    </>
  );
}
