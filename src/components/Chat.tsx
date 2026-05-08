import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useState, useRef, useEffect, useCallback } from "react";

const PROMPTS = [
    "What's TakeShape's agent architecture?",
    "Hot take on TypeScript?",
    "How did Fair Tread end?",
    "What music are you into?",
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
        return typeof content === "string" ? content : "";
    }
    return parts
        .filter((p) => p.type === "text" && typeof p.text === "string")
        .map((p) => p.text!)
        .join("");
}

function slugifyCompany(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function scrollToRole(company: string) {
    const slug = slugifyCompany(company);
    const el = document.getElementById(`role-${slug}`);
    if (!el) return;
    if (el instanceof HTMLDetailsElement) {
        el.open = true;
    }
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.add("role-flash");
    window.setTimeout(() => el.classList.remove("role-flash"), 1700);
}

function useToolCallDispatcher(messages: UIMessage[]) {
    const seen = useRef(new Set<string>());
    useEffect(() => {
        for (const m of messages) {
            const parts = (m as { parts?: UIPart[] }).parts;
            if (!Array.isArray(parts)) continue;
            for (const part of parts) {
                if (!part.type?.startsWith("tool-")) continue;
                if (part.state && part.state !== "input-available" && part.state !== "output-available") continue;
                const id = part.toolCallId;
                if (!id || seen.current.has(id)) continue;
                seen.current.add(id);

                if (part.type === "tool-scroll_to_role") {
                    const input = part.input as { company?: string } | undefined;
                    if (input?.company) scrollToRole(input.company);
                }
            }
        }
    }, [messages]);
}

export default function Chat() {
    const transport = useRef(new DefaultChatTransport({ api: "/api/chat" }));
    const { messages, sendMessage, status, error, stop } = useChat({
        transport: transport.current,
    });
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useToolCallDispatcher(messages);

    useEffect(() => {
        scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: "smooth",
        });
    }, [messages.length, open]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", onKey);
        const t = window.setTimeout(() => inputRef.current?.focus(), 50);
        return () => {
            window.removeEventListener("keydown", onKey);
            window.clearTimeout(t);
        };
    }, [open]);

    const submit = useCallback(
        (text: string) => {
            const trimmed = text.trim();
            if (!trimmed || status === "streaming" || status === "submitted") return;
            sendMessage({ text: trimmed });
            setInput("");
        },
        [sendMessage, status],
    );

    const isBusy = status === "submitted" || status === "streaming";
    const hasUnread = !open && messages.some((m) => m.role === "assistant");

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? "Close chat with Andrew" : "Open chat with Andrew"}
                aria-expanded={open}
                className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-accent text-accent-ink shadow-lg flex items-center justify-center transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
                {open ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                )}
                {hasUnread && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-canvas border-2 border-accent" aria-hidden="true" />
                )}
            </button>

            {open && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 max-md:block hidden"
                    onClick={() => setOpen(false)}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`fixed z-40 bg-surface border border-rule shadow-2xl flex flex-col transition-transform duration-200 ease-out
                    md:bottom-24 md:right-5 md:w-[400px] md:max-h-[calc(100vh-7.5rem)] md:rounded-[14px]
                    max-md:inset-x-0 max-md:bottom-0 max-md:rounded-t-[18px] max-md:max-h-[80vh]
                    ${open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"}`}
                role="dialog"
                aria-label="Chat with Andrew"
                aria-hidden={!open}
            >
                <header className="flex items-center justify-between px-4 py-3 border-b border-rule">
                    <div>
                        <p className="text-[13px] font-semibold m-0">Ask Andrew</p>
                        <p className="text-[11px] text-muted m-0">Grounded in his Q&A corpus</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        aria-label="Close chat"
                        className="text-muted hover:text-ink p-1 -m-1"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                <div ref={scrollRef} className="flex-1 px-4 py-4 overflow-y-auto">
                    {messages.length === 0 ? (
                        <div>
                            <p className="m-0 mb-3 text-[14px] leading-relaxed text-muted">
                                Ask anything about my career, technical taste, or what I'm working on.
                                The bot answers from a Q&A corpus I authored — see{" "}
                                <a href="/about-the-bot" className="underline">how it works</a>.
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {PROMPTS.map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => submit(p)}
                                        className="text-xs px-2.5 py-1.5 rounded-full border border-rule hover:border-accent hover:text-accent transition-colors"
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
                                    Error: {error.message ?? "Something went wrong."}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <form
                    className="flex gap-2 border-t border-rule p-3 bg-canvas"
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
                        className="flex-1 px-3 py-2 text-[14px] bg-surface text-ink border border-rule rounded-lg outline-none transition-colors focus:border-accent disabled:opacity-50"
                    />
                    {isBusy ? (
                        <button
                            type="button"
                            onClick={() => stop()}
                            className="px-3 py-2 text-[14px] font-medium bg-surface text-ink border border-rule rounded-lg hover:border-accent transition-colors"
                        >
                            Stop
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={!input.trim()}
                            className="px-3 py-2 text-[14px] font-medium bg-accent text-accent-ink rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
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
    const isUser = message.role === "user";
    if (isUser) {
        return (
            <div className="self-end max-w-[85%]">
                <div className="px-3 py-2 rounded-2xl rounded-br-sm bg-accent text-accent-ink text-[14px] leading-relaxed whitespace-pre-wrap">
                    {text}
                </div>
            </div>
        );
    }
    return (
        <div className="self-start max-w-[95%]">
            <div className="text-[14px] leading-relaxed whitespace-pre-wrap">
                {text || <span className="text-muted">…</span>}
            </div>
        </div>
    );
}
