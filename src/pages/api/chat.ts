import type { APIRoute } from "astro";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { corpus, profile } from "../../lib/qa-loader";
import { buildIndex, retrieve } from "../../lib/retrieval";
import { buildSystemPrompt, extractQueryFromMessages } from "../../lib/chat-prompt";

export const prerender = false;

const index = buildIndex(corpus);

export const POST: APIRoute = async ({ request, locals }) => {
    const apiKey =
        // Cloudflare Worker binding (production)
        (locals as any)?.runtime?.env?.ANTHROPIC_API_KEY ??
        // Local dev via .dev.vars / process.env
        (typeof process !== "undefined" ? process.env.ANTHROPIC_API_KEY : undefined);

    if (!apiKey) {
        return new Response(
            JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
            { status: 500, headers: { "content-type": "application/json" } },
        );
    }

    const body = (await request.json()) as { messages?: UIMessage[] };
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const query = extractQueryFromMessages(messages as any);
    const retrieved = query ? retrieve(index, query, 5) : [];

    const system = buildSystemPrompt({ profile, retrieved });
    const modelMessages = await convertToModelMessages(messages);

    const anthropic = createAnthropic({ apiKey });
    const result = streamText({
        model: anthropic("claude-sonnet-4-6"),
        system,
        messages: modelMessages,
        maxOutputTokens: 800,
        temperature: 0.7,
    });

    return result.toUIMessageStreamResponse();
};
