import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Streamdown } from 'streamdown';

const PROMPTS = [
  "What's TakeShape's agent architecture?",
  'How do you hire?',
  'Hot take on TypeScript?',
  'How did Fair Tread end?',
  'Why are you leaving TakeShape?'
];

interface UIPart {
  type: string;
  text?: string;
  input?: unknown;
  state?: string;
  toolCallId?: string;
}

function messageText(message: UIMessage): string {
  const parts = (message as { parts?: UIPart[] }).parts;
  if (!Array.isArray(parts)) {
    const content = (message as { content?: unknown }).content;
    return typeof content === 'string' ? content : '';
  }
  return parts
    .filter((p) => p.type === 'text' && typeof p.text === 'string')
    .map((p) => p.text!)
    .join('');
}

function slugifyCompany(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function flashRole(el: HTMLElement) {
  el.classList.add('role-flash');
  window.setTimeout(() => el.classList.remove('role-flash'), 1700);
}

function scrollToRole(company: string) {
  const slug = slugifyCompany(company);
  const el = document.getElementById(`role-${slug}`);
  if (!el) return;
  if (el instanceof HTMLDetailsElement) {
    el.open = true;
  }
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  flashRole(el);
}

function expandRole(company: string) {
  const slug = slugifyCompany(company);
  const el = document.getElementById(`role-${slug}`);
  if (!el) return;
  if (el instanceof HTMLDetailsElement && !el.open) {
    el.open = true;
  }
  flashRole(el);
}

const VARIANT_PATHS: Record<string, string> = {
  cto: '/',
  principal: '/principal',
  cofounder: '/cofounder'
};

async function navigateClient(path: string) {
  if (window.location.pathname === path) return;
  try {
    const { navigate } = await import('astro:transitions/client');
    navigate(path);
  } catch {
    window.location.href = path;
  }
}

function switchVariant(variant: string) {
  const path = VARIANT_PATHS[variant];
  if (!path) return;
  void navigateClient(path);
}

function showMethodology() {
  void navigateClient('/about-the-bot');
}

function useToolCallDispatcher(messages: UIMessage[]) {
  const seen = useRef(new Set<string>());
  useEffect(() => {
    for (const m of messages) {
      const parts = (m as { parts?: UIPart[] }).parts;
      if (!Array.isArray(parts)) continue;
      for (const part of parts) {
        if (!part.type?.startsWith('tool-')) continue;
        if (part.state && part.state !== 'input-available' && part.state !== 'output-available')
          continue;
        const id = part.toolCallId;
        if (!id || seen.current.has(id)) continue;
        seen.current.add(id);

        if (part.type === 'tool-scroll_to_role') {
          const input = part.input as { company?: string } | undefined;
          if (input?.company) scrollToRole(input.company);
        } else if (part.type === 'tool-expand_role') {
          const input = part.input as { company?: string } | undefined;
          if (input?.company) expandRole(input.company);
        } else if (part.type === 'tool-switch_variant') {
          const input = part.input as { variant?: string } | undefined;
          if (input?.variant) switchVariant(input.variant);
        } else if (part.type === 'tool-show_methodology') {
          showMethodology();
        }
      }
    }
  }, [messages]);
}

export default function Chat() {
  const transport = useMemo(() => new DefaultChatTransport({ api: '/api/chat' }), []);
  const { messages, sendMessage, status, error, stop, setMessages } = useChat({
    transport
  });
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useToolCallDispatcher(messages);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages.length, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
    };
  }, [open]);

  const submit = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || status === 'streaming' || status === 'submitted') return;
      sendMessage({ text: trimmed });
      setInput('');
    },
    [sendMessage, status]
  );

  const isBusy = status === 'submitted' || status === 'streaming';
  const hasUnread = !open && messages.some((m) => m.role === 'assistant');

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close chat with Andrew' : 'Open chat with Andrew'}
        aria-expanded={open}
        className="bg-accent text-accent-ink focus-visible:outline-accent fixed right-5 bottom-5 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {open ? (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
        {hasUnread && (
          <span
            className="bg-canvas border-accent absolute top-1 right-1 h-2.5 w-2.5 rounded-full border-2"
            aria-hidden="true"
          />
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 hidden bg-black/20 max-md:block"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`bg-surface border-rule fixed z-40 flex flex-col border shadow-2xl transition-transform duration-200 ease-out max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[80vh] max-md:rounded-t-[18px] md:right-5 md:bottom-24 md:max-h-[calc(100vh-7.5rem)] md:w-[400px] md:rounded-[14px] ${open ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'}`}
        role="dialog"
        aria-label="Chat with Andrew"
        aria-hidden={!open}
      >
        <header className="border-rule flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="m-0 text-[13px] font-semibold">Ask Andrew</p>
            <p className="text-muted m-0 text-[11px]">Grounded in his Q&A corpus</p>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (isBusy) stop();
                  setMessages([]);
                  setInput('');
                }}
                aria-label="Start a new chat"
                title="Start a new chat"
                className="text-muted hover:text-ink flex items-center gap-1 rounded px-2 py-1 text-[12px] transition-colors"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                  <path d="M8 16H3v5" />
                </svg>
                New
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="text-muted hover:text-ink p-1"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <div>
              <p className="text-muted m-0 mb-3 text-[14px] leading-relaxed">
                Ask anything about my career, technical taste, or what I&rsquo;m working on. The bot
                answers from a Q&amp;A corpus I authored — see{' '}
                <a href="/about-the-bot" className="underline">
                  how it works
                </a>
                .
              </p>
              <div className="flex flex-wrap gap-1.5">
                {PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => submit(p)}
                    className="border-rule hover:border-accent hover:text-accent rounded-full border px-2.5 py-1.5 text-xs transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((m) => (
                <Message key={m.id} message={m} />
              ))}
              {error && (
                <p className="m-0 text-sm text-red-600 dark:text-red-400">
                  Error: {error.message ?? 'Something went wrong.'}
                </p>
              )}
            </div>
          )}
        </div>

        <form
          className="border-rule bg-canvas flex gap-2 border-t p-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask Andrew…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isBusy}
            suppressHydrationWarning
            className="bg-surface text-ink border-rule focus:border-accent flex-1 rounded-lg border px-3 py-2 text-[14px] transition-colors outline-none disabled:opacity-50"
          />
          {isBusy ? (
            <button
              type="button"
              onClick={() => stop()}
              className="bg-surface text-ink border-rule hover:border-accent rounded-lg border px-3 py-2 text-[14px] font-medium transition-colors"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="bg-accent text-accent-ink rounded-lg px-3 py-2 text-[14px] font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              Ask
            </button>
          )}
        </form>
      </aside>
    </>
  );
}

function Message({ message }: { message: UIMessage }) {
  const text = messageText(message);
  const isUser = message.role === 'user';
  if (isUser) {
    return (
      <div className="max-w-[85%] self-end">
        <div className="bg-accent text-accent-ink rounded-2xl rounded-br-sm px-3 py-2 text-[14px] leading-relaxed whitespace-pre-wrap">
          {text}
        </div>
      </div>
    );
  }
  if (!text) {
    return (
      <div className="max-w-[95%] self-start">
        <span className="text-muted text-[14px]">…</span>
      </div>
    );
  }
  return (
    <div className="max-w-[95%] self-start">
      <Streamdown className="chat-markdown text-[14px] leading-relaxed">{text}</Streamdown>
    </div>
  );
}
