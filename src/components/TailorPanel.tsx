import { useEffect, useRef, useState } from 'react';
import {
  applyPatch,
  clearPatch,
  initTailorFromHash,
  readPatchFromHash,
  writePatchToHash,
  type TailorPatch
} from '../lib/tailor-client';

type State = 'idle' | 'loading' | 'applied' | 'error';

const SAMPLE_JD_HINT = 'Paste a job description — full text or just the key parts.';

export default function TailorPanel() {
  const [state, setState] = useState<State>(() =>
    typeof window !== 'undefined' && readPatchFromHash() ? 'applied' : 'idle'
  );
  const [error, setError] = useState<string | null>(null);
  const [jd, setJd] = useState('');
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    initTailorFromHash();

    const onCleared = () => {
      setState('idle');
      setError(null);
      setJd('');
    };
    window.addEventListener('tailor:cleared', onCleared);
    return () => window.removeEventListener('tailor:cleared', onCleared);
  }, []);

  async function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = jd.trim();
    if (value.length < 40) {
      setError('Paste a longer job description (a few sentences at minimum).');
      return;
    }
    setState('loading');
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
      writePatchToHash(patch);
      setState('applied');
      detailsRef.current?.removeAttribute('open');
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Tailoring failed.');
    }
  }

  function onClear() {
    clearPatch();
    setJd('');
  }

  return (
    <details ref={detailsRef} className="tailor-panel" suppressHydrationWarning>
      <summary className="tailor-panel-summary">
        {state === 'applied' ? 'Tailor: edit JD' : 'Tailor for a job'}
      </summary>
      <form onSubmit={submit} className="tailor-panel-body">
        <textarea
          className="tailor-textarea"
          placeholder={SAMPLE_JD_HINT}
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          rows={8}
          disabled={state === 'loading'}
          suppressHydrationWarning
        />
        <div className="tailor-actions">
          <button
            type="submit"
            className="tailor-submit"
            disabled={state === 'loading' || jd.trim().length < 40}
          >
            {state === 'loading' ? 'Tailoring…' : 'Tailor CV'}
          </button>
          {state === 'applied' && (
            <button type="button" className="tailor-clear" onClick={onClear}>
              Reset to default
            </button>
          )}
          <span className="tailor-meta">
            Re-ranks + emphasizes. Doesn&rsquo;t fabricate experience.
          </span>
        </div>
        {error && <p className="tailor-error">{error}</p>}
      </form>
      <style>{`
                .tailor-panel {
                    position: relative;
                }
                .tailor-panel-summary {
                    appearance: none;
                    background: none;
                    border: 1px solid var(--cv-rule, #d6d3d1);
                    color: var(--cv-ink, #0c0a09);
                    padding: 6px 12px;
                    border-radius: 6px;
                    font: inherit;
                    cursor: pointer;
                    list-style: none;
                    user-select: none;
                }
                .tailor-panel-summary::-webkit-details-marker {
                    display: none;
                }
                details[open] > .tailor-panel-summary {
                    background: color-mix(in oklab, var(--cv-accent, #ea580c) 8%, transparent);
                    border-color: var(--cv-accent, #ea580c);
                    color: var(--cv-accent, #ea580c);
                }
                .tailor-panel-body {
                    position: absolute;
                    top: calc(100% + 8px);
                    left: 0;
                    z-index: 10;
                    width: min(540px, 90vw);
                    padding: 14px;
                    background: #ffffff;
                    border: 1px solid var(--cv-rule, #d6d3d1);
                    border-radius: 8px;
                    box-shadow: 0 4px 16px rgba(12, 10, 9, 0.08);
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .tailor-textarea {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid var(--cv-rule, #d6d3d1);
                    border-radius: 6px;
                    font-family: inherit;
                    font-size: 13px;
                    line-height: 1.45;
                    resize: vertical;
                    min-height: 140px;
                    color: var(--cv-ink, #0c0a09);
                }
                .tailor-textarea:focus {
                    outline: 2px solid color-mix(in oklab, var(--cv-accent, #ea580c) 60%, transparent);
                    outline-offset: 1px;
                    border-color: var(--cv-accent, #ea580c);
                }
                .tailor-actions {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                .tailor-submit {
                    appearance: none;
                    background: var(--cv-accent, #ea580c);
                    color: #ffffff;
                    border: 1px solid var(--cv-accent, #ea580c);
                    padding: 6px 14px;
                    border-radius: 6px;
                    font: inherit;
                    font-weight: 600;
                    cursor: pointer;
                }
                .tailor-submit:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .tailor-clear {
                    appearance: none;
                    background: none;
                    border: 1px solid var(--cv-rule, #d6d3d1);
                    color: var(--cv-muted, #57534e);
                    padding: 6px 12px;
                    border-radius: 6px;
                    font: inherit;
                    cursor: pointer;
                }
                .tailor-meta {
                    margin-left: auto;
                    font-size: 11px;
                    color: var(--cv-muted, #57534e);
                }
                .tailor-error {
                    margin: 0;
                    padding: 8px 10px;
                    border-radius: 4px;
                    background: #fef2f2;
                    color: #991b1b;
                    font-size: 12px;
                }
            `}</style>
    </details>
  );
}
