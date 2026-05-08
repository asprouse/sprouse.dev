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

export const POST: APIRoute = async ({ request, locals }) => {
    const apiKey =
        (locals as any)?.runtime?.env?.ANTHROPIC_API_KEY ??
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
                    "Scroll the user's page to a specific role card and briefly highlight it. Use only when the answer is genuinely about that role.",
                inputSchema: z.object({
                    company: z
                        .string()
                        .describe(
                            `Company name as it appears on the page. Must be one of: ${COMPANY_NAMES.join(", ")}.`,
                        ),
                }),
                execute: async ({ company }) => ({ scrolled_to: company }),
            }),
        },
    });

    return result.toUIMessageStreamResponse();
};
