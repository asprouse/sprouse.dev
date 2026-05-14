import { resume } from "./resume";
import { slugifyCompany } from "./resume";

const RETROSPECTIVE_CUTOFF = "2015-01";

function formatResumeForPrompt(): string {
    const currentEra = resume.experience.filter(
        (r) => r.dateRange.from >= RETROSPECTIVE_CUTOFF,
    );

    const rolesText = currentEra
        .map((role) => {
            const slug = slugifyCompany(role.company);
            const projects = role.projects
                .map((p, idx) => {
                    const title = p.title ? `${p.title} — ` : "";
                    const desc = p.description.replace(/<[^>]+>/g, "").slice(0, 300);
                    return `    [${idx}] ${title}${desc}`;
                })
                .join("\n");
            const desc = role.description.replace(/<[^>]+>/g, "");
            return `${role.company} (slug: ${slug}) — ${role.title}\n  Summary: ${desc}\n  Projects:\n${projects}`;
        })
        .join("\n\n");

    return rolesText;
}

const SKILL_VOCABULARY = [
    "TypeScript", "GraphQL", "JavaScript", "HTML", "CSS", "Lua",
    "React", "Next.js", "Tailwind CSS",
    "Anthropic SDK", "OpenAI SDK", "Vercel AI SDK", "LangChain",
    "Anthropic", "OpenAI", "Google AI", "AWS Bedrock", "Azure OpenAI", "Arize",
    "AWS Lambda", "DynamoDB", "OpenSearch", "Redis", "S3",
    "SQS / SNS", "KMS", "Athena", "Stripe", "Shopify", "Netlify", "Node.js",
    "AWS CDK", "SST", "Pulumi", "Serverless Framework",
    "OpenTelemetry", "AWS X-Ray", "Sentry",
    "Zustand", "Monaco Editor",
    "JSON Schema", "OpenAPI", "REST", "HTTP 402",
];

export function buildTailorSystemPrompt(): string {
    return `You are tailoring Andrew Sprouse's CV for a specific job description (JD).

# Your job
Read the JD. Re-rank Andrew's existing projects, hide irrelevant ones, pick the best positioning variant, rewrite the summary, and emphasize matching skills. You are NOT writing new project descriptions or fabricating experience — only re-ranking and re-emphasizing what already exists.

# Positioning variants
- "cto": engineering leadership at an AI-native company. JDs that say CTO, VP Eng (skip unless small/early), Head of Engineering, founding engineer with leadership scope.
- "principal": deep IC at a company whose product is itself a primary primitive (model labs like Anthropic/OpenAI, infrastructure like Vercel/Cloudflare, primitives like Stripe/Shopify). Look for "principal engineer", "staff engineer", "founding engineer" at companies whose product is a developer tool / primitive.
- "cofounder": technical co-founder of a new venture. Look for "founding CTO", "technical co-founder", early-stage with equity.

If the JD doesn't cleanly map to one, pick the closest and explain why in the rationale.

# Re-ranking guidance
- Andrew's current-era roles each have multiple projects. Promote projects that match the JD's stated work. Hide projects only when genuinely irrelevant (e.g. hide e-commerce projects for a model-lab JD).
- TakeShape has the most projects — that's where re-ranking matters most.
- For older roles (Ronik 2nd, Fair Tread), small re-ranking is fine but they're already curated.
- It's fine to leave a role unchanged — only include roles in your output where the order or hidden set differs from default.

# Summary rewriting
- 3–5 sentences. Third-person resume tone (no "I").
- Lead with the framing that matches the JD ("Engineering leader…" for CTO; "Principal engineer with…" for principal; etc.).
- Mention concrete things from his real experience that map to the JD.
- End with the openTo statement matched to variant ("Open to CTO at an AI-native company" / "Open to Principal IC at a company whose product is a primitive" / "Open to founding a new venture").
- Never invent metrics, scale claims, or technologies Andrew didn't actually use.

# Skill emphasis
Pick 5–15 skills from this vocabulary that map to the JD's requirements:
${SKILL_VOCABULARY.join(", ")}

Use EXACT spellings from the list. If the JD asks for something not in this vocabulary, just don't include it — don't make up a skill.

# Available roles and projects (current era only — pre-2015 is retrospective and stays untouched)

${formatResumeForPrompt()}

# Rationale
Write one short paragraph (2–4 sentences) explaining what you changed and why. The user reads this. Be concrete: "Promoted the agent runtime project because the JD emphasizes runtime architecture. Hid the e-commerce projects since the JD is model infrastructure. Picked 'principal' because the company is building developer primitives."

Now produce the structured patch for the JD that follows.`;
}
