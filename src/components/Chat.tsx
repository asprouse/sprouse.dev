import { useState } from "react";

export default function Chat() {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");

    return (
        <div className="mt-4 p-6 rounded-[10px] border border-[var(--color-rule)] bg-[var(--color-bg-raised)] shadow-sm">
            <p className="m-0 mb-4 text-[var(--color-muted)] text-[15px] leading-relaxed">
                Coming soon — ask anything about my career, technical taste, or what I'm working on.
                Answers are grounded in a Q&A corpus I'm authoring (see the methodology page).
            </p>
            <form
                className="flex gap-2"
                onSubmit={(e) => {
                    e.preventDefault();
                    setOpen(true);
                }}
            >
                <input
                    type="text"
                    placeholder="Try: what's TakeShape's agent architecture?"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 text-[15px] bg-[var(--color-bg)] text-[var(--color-fg)] border border-[var(--color-rule)] rounded-lg outline-none transition-colors focus:border-[var(--color-accent)]"
                />
                <button
                    type="submit"
                    disabled={!input.trim()}
                    className="px-4.5 py-2.5 text-[15px] font-medium bg-[var(--color-accent)] text-[var(--color-accent-fg)] rounded-lg cursor-pointer transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Ask
                </button>
            </form>
            {open && (
                <p className="mt-4 text-sm text-[var(--color-muted)]">
                    (Backend wiring still in progress — your question came through, the model just
                    isn't connected yet.)
                </p>
            )}
        </div>
    );
}
