// Ephemeral CV editor mounted at /cv/edit. Loads the shipped base resume,
// lets you paste/edit arbitrary JSON, live-previews the print CV, and hands
// off to the browser print dialog for PDF generation.
//
// Storage is localStorage — client-only, private to the browser, survives
// refresh. No server round-trip; safe to use on any device signed into
// sprouse.dev.
import Editor, { type BeforeMount, type OnChange } from '@monaco-editor/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { resume as baseResume } from '../lib/resume';
import type { Resume } from '../types/resume';
import { VARIANTS, VARIANT_ORDER, type VariantSlug } from '../lib/variants';
import schema from '../../schemas/resume.schema.json';
import PrintCV from './PrintCV';

const STORAGE_KEY = 'cv-editor:resume-json';
const LENS_KEY = 'cv-editor:lens';
const SCHEMA_URI = 'https://sprouse.dev/schemas/resume.schema.json';

function stableStringify(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function readInitialLens(): VariantSlug {
  if (typeof window === 'undefined') return 'cto';
  const fromUrl = new URLSearchParams(window.location.search).get('lens');
  if (fromUrl && (VARIANT_ORDER as string[]).includes(fromUrl)) return fromUrl as VariantSlug;
  const fromStorage = window.localStorage.getItem(LENS_KEY);
  if (fromStorage && (VARIANT_ORDER as string[]).includes(fromStorage))
    return fromStorage as VariantSlug;
  return 'cto';
}

function readInitialJson(): string {
  if (typeof window === 'undefined') return stableStringify(baseResume);
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored ?? stableStringify(baseResume);
}

export default function CvEditor() {
  const [text, setText] = useState<string>(() => readInitialJson());
  const [lens, setLens] = useState<VariantSlug>(() => readInitialLens());
  const lastValidRef = useRef<Resume>(baseResume);

  // Parse once per text change; keep the last-valid resume so a bad edit
  // doesn't blank the preview.
  const { preview, parseError } = useMemo(() => {
    try {
      const parsed = JSON.parse(text) as Resume;
      if (!parsed || typeof parsed !== 'object' || !parsed.person || !parsed.experience) {
        return {
          preview: lastValidRef.current,
          parseError: 'JSON parses but is not a Resume (missing person/experience).' as
            | string
            | null
        };
      }
      lastValidRef.current = parsed;
      return { preview: parsed, parseError: null as string | null };
    } catch (err) {
      return { preview: lastValidRef.current, parseError: (err as Error).message as string | null };
    }
  }, [text]);

  // Persist to localStorage.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, text);
  }, [text]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(LENS_KEY, lens);
    const url = new URL(window.location.href);
    if (url.searchParams.get('lens') !== lens) {
      url.searchParams.set('lens', lens);
      window.history.replaceState(null, '', url.toString());
    }
  }, [lens]);

  const handleBeforeMount: BeforeMount = (monaco) => {
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      schemas: [
        {
          uri: SCHEMA_URI,
          fileMatch: ['*'],
          schema: schema as object
        }
      ]
    });
  };

  const handleChange: OnChange = (value) => {
    setText(value ?? '');
  };

  const loadBase = () => {
    if (!window.confirm('Replace the current editor contents with the shipped base resume?'))
      return;
    setText(stableStringify(baseResume));
  };

  const resetStorage = () => {
    if (!window.confirm('Clear the saved edits from this browser?')) return;
    window.localStorage.removeItem(STORAGE_KEY);
    setText(stableStringify(baseResume));
  };

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // no-op; not worth surfacing a UI error for a copy failure
    }
  };

  const printNow = () => window.print();

  return (
    <div className="cv-editor">
      <style>{EDITOR_STYLES}</style>

      <header className="cv-editor__toolbar no-print">
        <div className="cv-editor__toolbar-left">
          <a href="/cv" className="cv-editor__link">
            ← CV
          </a>
          <span className="cv-editor__sep">·</span>
          <label className="cv-editor__lens">
            Lens:
            <select
              value={lens}
              onChange={(e) => setLens(e.target.value as VariantSlug)}
              aria-label="Positioning lens"
            >
              {VARIANT_ORDER.map((slug) => (
                <option key={slug} value={slug}>
                  {VARIANTS[slug].label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="cv-editor__toolbar-right">
          <button type="button" onClick={loadBase}>
            Load base
          </button>
          <button type="button" onClick={copyJson}>
            Copy JSON
          </button>
          <button type="button" onClick={resetStorage}>
            Clear saved
          </button>
          <button type="button" className="cv-editor__primary" onClick={printNow}>
            Print / save as PDF
          </button>
        </div>
      </header>

      {parseError && (
        <div className="cv-editor__error no-print" role="alert">
          <strong>JSON error:</strong> {parseError} — showing last valid preview.
        </div>
      )}

      <div className="cv-editor__split">
        <div className="cv-editor__pane no-print">
          <Editor
            height="100%"
            defaultLanguage="json"
            value={text}
            onChange={handleChange}
            beforeMount={handleBeforeMount}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              wordWrap: 'on',
              tabSize: 2,
              scrollBeyondLastLine: false,
              automaticLayout: true
            }}
          />
        </div>
        <div className="cv-editor__preview">
          <PrintCV resume={preview} lens={lens} />
        </div>
      </div>
    </div>
  );
}

const EDITOR_STYLES = `
  html, body { background: #1e1e1e; }
  .cv-editor {
    display: flex;
    flex-direction: column;
    height: 100vh;
    color: #e7e5e4;
    font-family: 'Inter Variable', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  }
  .cv-editor__toolbar {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 14px;
    background: #111;
    border-bottom: 1px solid #333;
    font-size: 13px;
  }
  .cv-editor__toolbar-left,
  .cv-editor__toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .cv-editor__link {
    color: #e7e5e4;
    text-decoration: none;
    padding: 6px 10px;
    border: 1px solid #333;
    border-radius: 6px;
  }
  .cv-editor__sep { color: #666; }
  .cv-editor__lens {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #a8a29e;
  }
  .cv-editor__lens select {
    appearance: none;
    background: #1e1e1e;
    color: #e7e5e4;
    border: 1px solid #333;
    border-radius: 6px;
    padding: 6px 24px 6px 10px;
    font: inherit;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23a8a29e' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;
  }
  .cv-editor__toolbar button {
    appearance: none;
    background: #1e1e1e;
    color: #e7e5e4;
    border: 1px solid #333;
    border-radius: 6px;
    padding: 6px 12px;
    font: inherit;
    cursor: pointer;
  }
  .cv-editor__toolbar button:hover { background: #2a2a2a; }
  .cv-editor__primary {
    background: var(--color-brand, #b45309) !important;
    color: #fff !important;
    border-color: transparent !important;
  }
  .cv-editor__error {
    padding: 8px 14px;
    background: #7f1d1d;
    color: #fee2e2;
    font-size: 13px;
    border-bottom: 1px solid #450a0a;
  }
  .cv-editor__split {
    flex: 1 1 auto;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    min-height: 0;
  }
  .cv-editor__pane { min-width: 0; border-right: 1px solid #333; }
  .cv-editor__preview {
    min-width: 0;
    overflow: auto;
    background: #f5f5f4;
    padding: 24px 0;
  }
  @media (max-width: 900px) {
    .cv-editor__split {
      grid-template-columns: 1fr;
      grid-template-rows: 40vh 1fr;
    }
    .cv-editor__pane { border-right: none; border-bottom: 1px solid #333; }
  }
  @media print {
    html, body { background: #ffffff; }
    .cv-editor { height: auto; display: block; }
    .no-print { display: none !important; }
    .cv-editor__split {
      display: block;
      grid-template-columns: none;
    }
    .cv-editor__preview {
      background: #ffffff;
      padding: 0;
      overflow: visible;
    }
  }
  @page {
    size: letter;
    margin: 0.55in 0.6in;
  }
`;
