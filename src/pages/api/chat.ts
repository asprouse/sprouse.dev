import type { APIRoute } from 'astro';
import {
  streamText,
  convertToModelMessages,
  safeValidateUIMessages,
  stepCountIs,
  tool,
  type UIMessage
} from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { env } from 'cloudflare:workers';
import { z } from 'zod';
import { corpus, profile } from '../../lib/qa-loader';
import { resume } from '../../lib/resume';
import { buildIndex, retrieve } from '../../lib/retrieval';
import { buildSystemPrompt, extractQueryFromMessages } from '../../lib/chat-prompt';

export const prerender = false;

const index = buildIndex(corpus);
const COMPANY_NAMES = resume.experience.map((r) => r.company);
const PROJECT_CATALOG = resume.experience.map((r) => ({
  company: r.company,
  titles: r.projects.map((p) => p.title).filter((t): t is string => Boolean(t))
}));

// Policy caps applied on top of the AI SDK's structural validation. The SDK
// validates message shape; these caps enforce that nobody can shovel
// megabytes of input into a paid Anthropic call.
const MAX_MESSAGES = 30;
const MAX_TOTAL_TEXT = 60_000;

function rateLimitResponse(message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: 429,
    headers: {
      'content-type': 'application/json',
      'retry-after': '60'
    }
  });
}

export const POST: APIRoute = async ({ request }) => {
  const apiKey = env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }

  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';

  if (env.CHAT_RATE_LIMITER) {
    const { success } = await env.CHAT_RATE_LIMITER.limit({ key: clientIp });
    if (!success) {
      return rateLimitResponse("You're hitting the chat too fast. Give it a minute and try again.");
    }
  }

  if (env.GLOBAL_RATE_LIMITER) {
    const { success } = await env.GLOBAL_RATE_LIMITER.limit({ key: 'global' });
    if (!success) {
      return rateLimitResponse('Chat is at capacity right now. Try again in a minute.');
    }
  }

  const rawBody = (await request.json().catch(() => null)) as { messages?: unknown } | null;

  const validated = await safeValidateUIMessages({ messages: rawBody?.messages });
  if (!validated.success) {
    return new Response(JSON.stringify({ error: 'Invalid messages payload' }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    });
  }

  const messages: UIMessage[] = validated.data;
  if (messages.length === 0 || messages.length > MAX_MESSAGES) {
    return new Response(
      JSON.stringify({ error: `Message count out of range (1–${MAX_MESSAGES})` }),
      {
        status: 400,
        headers: { 'content-type': 'application/json' }
      }
    );
  }

  const totalText = messages.reduce((sum, m) => {
    const parts = (m as { parts?: Array<{ type: string; text?: string }> }).parts;
    if (!Array.isArray(parts)) return sum;
    return parts.reduce((s, p) => s + (typeof p.text === 'string' ? p.text.length : 0), sum);
  }, 0);
  if (totalText > MAX_TOTAL_TEXT) {
    return new Response(JSON.stringify({ error: 'Conversation too large' }), {
      status: 413,
      headers: { 'content-type': 'application/json' }
    });
  }

  const query = extractQueryFromMessages(messages);
  const retrieved = query ? retrieve(index, query, 5) : [];

  const system = buildSystemPrompt({
    profile,
    retrieved,
    companies: COMPANY_NAMES,
    projects: PROJECT_CATALOG
  });

  const anthropic = createAnthropic({ apiKey });
  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 200,
    temperature: 0.7,
    // Allow one model turn after a tool call so the model produces the
    // spoken answer alongside the UI side-effect. Without this, calls to
    // expand_project / scroll_to_role / etc. stop the stream with
    // finishReason=tool-calls and the user sees an empty bubble.
    stopWhen: stepCountIs(2),
    tools: {
      scroll_to_role: tool({
        description:
          "Scroll the user's page to a specific role card and briefly highlight it. Auto-expands the role if it's collapsed in the career retrospective. Use only when the answer is genuinely about that role.",
        inputSchema: z.object({
          company: z
            .string()
            .describe(
              `Company name as it appears on the page. Must be one of: ${COMPANY_NAMES.join(', ')}.`
            )
        }),
        execute: async ({ company }) => ({ scrolled_to: company })
      }),
      expand_role: tool({
        description:
          "Expand a compressed (pre-2015) role's details inline WITHOUT scrolling. Use when the user is reading something nearby and you want to surface adjacent context.",
        inputSchema: z.object({
          company: z.string().describe(`Company name. Must be one of: ${COMPANY_NAMES.join(', ')}.`)
        }),
        execute: async ({ company }) => ({ expanded: company })
      }),
      expand_project: tool({
        description:
          'Scroll to and expand a specific project card within a role. Use when the answer is genuinely about one named project, not the role overall. projectTitle must match exactly one of the titles listed in the PROJECTS section of the system prompt for the given company.',
        inputSchema: z.object({
          company: z
            .string()
            .describe(`Company name. Must be one of: ${COMPANY_NAMES.join(', ')}.`),
          projectTitle: z
            .string()
            .describe('Exact project title as listed in the PROJECTS section of the system prompt.')
        }),
        execute: async ({ company, projectTitle }) => ({ expanded: `${company}:${projectTitle}` })
      }),
      switch_variant: tool({
        description:
          'Navigate the user to a different archetype landing page when their question maps strongly to a different lens. Use sparingly.',
        inputSchema: z.object({
          variant: z
            .enum(['cto', 'principal', 'cofounder'])
            .describe('Which archetype landing to switch to.')
        }),
        execute: async ({ variant }) => ({ switched_to: variant })
      }),
      show_methodology: tool({
        description:
          'Navigate the user to /about-the-bot — the methodology page documenting how this chatbot was built (Q&A corpus, retrieval, persona prompt, corpus stats). Use when the user asks how the bot works, asks about its architecture, or wants the deeper meta explanation.',
        inputSchema: z.object({}),
        execute: async () => ({ navigated_to: 'about-the-bot' })
      })
    }
  });

  return result.toUIMessageStreamResponse();
};
