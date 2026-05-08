import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useState, useRef, useEffect } from "react";

const PROMPTS = [
    "What's TakeShape's agent architecture?",
    "Hot take on TypeScript?",
    "How did Fair Tread end?",
    "What music are you into?",
];

function messageText(message: UIMessage): string {
    const parts = (message as { parts?: Array<{ type: string; text?: string }> }).parts;
    if (Array.isArray(parts)) {
        return parts
            .filter((p) => p.type === "text" && typeof p.text === "string")
            .map((p) => p.text!)
            .join("");
    }
    const content = (message as { content?: unknown }).content;
    return typeof content === "string" ? content : "";
}

export default function Chat() {
    const transport = useRef(new DefaultChatTransport({ api: "/api/chat" }));
    const { messages, sendMessage, status, error, stop } = useChat({
        transport: transport.current,
    });
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: "smooth",
        });
    }, [messages.length]);

    const submit = (text: string) => {
        const trimmed = text.trim();
        if (!trimmed || status === "streaming" || status === "submitted") return;
        sendMessage({ text: trimmed });
        setInput("");
    };

    const isBusy = status === "submitted" || status === "streaming";

    return (
        <div className="mt-4 rounded-[10px] border border-rule bg-surface shadow-sm overflow-hidden">
            <div ref={scrollRef} className="px-6 py-5 max-h-[480px] overflow-y-auto">
                {messages.length === 0 ? (
                    <div>
                        <p className="m-0 mb-3 text-[15px] leading-relaxed text-muted">
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
                    <div className="flex flex-col gap-4">
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
                    type="text"
                    placeholder="Ask Andrew…"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isBusy}
                    className="flex-1 px-3.5 py-2.5 text-[15px] bg-surface text-ink border border-rule rounded-lg outline-none transition-colors focus:border-accent disabled:opacity-50"
                />
                {isBusy ? (
                    <button
                        type="button"
                        onClick={() => stop()}
                        className="px-4 py-2.5 text-[15px] font-medium bg-surface text-ink border border-rule rounded-lg cursor-pointer transition-colors hover:border-accent"
                    >
                        Stop
                    </button>
                ) : (
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="px-4 py-2.5 text-[15px] font-medium bg-accent text-accent-ink rounded-lg cursor-pointer transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Ask
                    </button>
                )}
            </form>
        </div>
    );
}

function Message({ message }: { message: UIMessage }) {
    const text = messageText(message);
    const isUser = message.role === "user";
    return (
        <div className={isUser ? "self-end max-w-[85%]" : "self-start max-w-[95%]"}>
            <div
                className={
                    isUser
                        ? "px-3.5 py-2.5 rounded-2xl rounded-br-sm bg-accent text-accent-ink text-[15px] leading-relaxed whitespace-pre-wrap"
                        : "text-[15px] leading-relaxed whitespace-pre-wrap"
                }
            >
                {text || (isUser ? "" : <span className="text-muted">…</span>)}
            </div>
        </div>
    );
}
