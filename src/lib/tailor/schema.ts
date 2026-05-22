import { z } from 'zod';

export const tailorPatchSchema = z.object({
  variant: z
    .enum(['cto', 'principal', 'cofounder'])
    .describe(
      'Which positioning best matches this role. cto = engineering leadership at an AI-native company. principal = deep IC at a company whose product is itself a primitive (model labs, infra). cofounder = technical co-founder of a new venture.'
    ),
  summary: z
    .string()
    .max(1200)
    .describe(
      "A rewritten 3–6 sentence summary tailored to this JD (roughly 200–900 chars). Must not fabricate experience — only re-emphasize what's already in the resume. Keep first-person omitted (third-person resume tone)."
    ),
  roles: z
    .array(
      z.object({
        companySlug: z
          .string()
          .describe("Company slug, e.g. 'takeshape', 'fair-tread', 'ronik-design'."),
        projectIndices: z
          .array(z.number().int().nonnegative())
          .describe(
            'New order of project indices (0-based) for this role. Include all indices you want visible, in the desired order. Indices not listed AND not in hideProjectIndices stay in their original position relative to the listed ones.'
          ),
        hideProjectIndices: z
          .array(z.number().int().nonnegative())
          .describe(
            'Project indices to hide entirely. Use sparingly — only when a project is genuinely irrelevant to the JD. Default to keeping projects visible.'
          ),
        impactBulletIndices: z
          .array(z.number().int().nonnegative())
          .describe(
            'New order of impactBullets indices (0-based) for this role. Promote 1–3 bullets that most directly match the JD by listing them first; indices not listed keep their natural relative order. Never hide bullets — they are already a curated 3–6 per role.'
          )
          .optional()
      })
    )
    .describe(
      'Per-role re-ranking. Only include roles where the order should change from the default; omit roles that should render as-is. Focus on the current-era roles (TakeShape, Ronik 2nd, Fair Tread) since those have multiple projects and impact bullets.'
    ),
  emphasizedSkills: z
    .array(z.string())
    .max(20)
    .describe(
      "Skill names to visually emphasize (bold + accent). Use exact names as they appear in the resume's skill groups (e.g. 'TypeScript', 'React', 'AWS Lambda'). Pick 5–15 that map directly to the JD's requirements."
    ),
  rationale: z
    .string()
    .max(1500)
    .describe(
      "One short paragraph (2–4 sentences) explaining what you tailored and why. Shown to the user as a 'why' note. Plain prose, no markdown."
    )
});

export type TailorPatch = z.infer<typeof tailorPatchSchema>;
