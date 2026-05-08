import type { APIRoute } from "astro";
import { streamText, convertToModelMessages, tool, type UIMessage } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { corpus, profile } from "../../lib/qa-loader";
import { resume } from "../../lib/resume";
import { buildIndex, retrieve } from "../../lib/retrieval";
import { buildSystemPrompt, extractQueryFromMessages } from "../../lib/chat-prompt";

export const prerender = false;

const index = buildIndex(corpus);
const COMPANY_NAMES = resume.experience.map((r) => r.company);

interface RateLimiter {
    limit: (input: { key: string }) => Promise<{ success: boolean }>;
}

interface RuntimeEnv {
    ANTHROPIC_API_KEY?: string;
    CHAT_RATE_LIMITER?: RateLimiter;
    GLOBAL_RATE_LIMITER?: RateLimiter;
}

function rateLimitResponse(message: string) {
    return new Response(JSON.stringify({ error: message }), {
        status: 429,
        headers: {
            "content-type": "application/json",
            "retry-after": "60",
        },
    });
}

export const POST: APIRoute = async ({ request, locals }) => {
    const env: RuntimeEnv =
        (locals as { runtime?: { env?: RuntimeEnv } }).runtime?.env ?? {};

    const apiKey =
        env.ANTHROPIC_API_KEY ??
        (typeof process !== "undefined" ? process.env.ANTHROPIC_API_KEY : undefined);

    if (!apiKey) {
        return new Response(
            JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
            { status: 500, headers: { "content-type": "application/json" } },
        );
    }

    const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";

    if (env.CHAT_RATE_LIMITER) {
        const { success } = await env.CHAT_RATE_LIMITER.limit({ key: clientIp });
        if (!success) {
            return rateLimitResponse(
                "You're hitting the chat too fast. Give it a minute and try again.",
            );
        }
    }

    if (env.GLOBAL_RATE_LIMITER) {
        const { success } = await env.GLOBAL_RATE_LIMITER.limit({ key: "global" });
        if (!success) {
            return rateLimitResponse(
                "Chat is at capacity right now. Try again in a minute.",
            );
        }
    }

    const body = (await request.json()) as { messages?: UIMessage[] };
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const query = extractQueryFromMessages(messages as any);
    const retrieved = query ? retrieve(index, query, 5) : [];

    const system = buildSystemPrompt({
        profile,
        retrieved,
        companies: COMPANY_NAMES,
    });

    const anthropic = createAnthropic({ apiKey });
    const result = streamText({
        model: anthropic("claude-sonnet-4-6"),
        system,
        messages: await convertToModelMessages(messages),
        maxOutputTokens: 800,
        temperature: 0.7,
        tools: {
            scroll_to_role: tool({
                description:
                    "Scroll the user's page to a specific role card and briefly highlight it. Auto-expands the role if it's collapsed in the career retrospective. Use only when the answer is genuinely about that role.",
                inputSchema: z.object({
                    company: z
                        .string()
                        .describe(
                            `Company name as it appears on the page. Must be one of: ${COMPANY_NAMES.join(", ")}.`,
                        ),
                }),
                execute: async ({ company }) => ({ scrolled_to: company }),
            }),
            expand_role: tool({
                description:
                    "Expand a compressed (pre-2015) role's details inline WITHOUT scrolling. Use when the user is reading something nearby and you want to surface adjacent context.",
                inputSchema: z.object({
                    company: z
                        .string()
                        .describe(
                            `Company name. Must be one of: ${COMPANY_NAMES.join(", ")}.`,
                        ),
                }),
                execute: async ({ company }) => ({ expanded: company }),
            }),
            switch_variant: tool({
                description:
                    "Navigate the user to a different archetype landing page when their question maps strongly to a different lens. Use sparingly.",
                inputSchema: z.object({
                    variant: z
                        .enum(["cto", "principal", "cofounder"])
                        .describe("Which archetype landing to switch to."),
                }),
                execute: async ({ variant }) => ({ switched_to: variant }),
            }),
            show_methodology: tool({
                description:
                    "Navigate the user to /about-the-bot — the methodology page documenting how this chatbot was built (Q&A corpus, retrieval, persona prompt, corpus stats). Use when the user asks how the bot works, asks about its architecture, or wants the deeper meta explanation.",
                inputSchema: z.object({}),
                execute: async () => ({ navigated_to: "about-the-bot" }),
            }),
        },
    });

    return result.toUIMessageStreamResponse();
};
