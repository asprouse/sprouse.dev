export type VariantSlug = 'cto' | 'principal' | 'cofounder';

export interface Variant {
  slug: VariantSlug;
  path: string;
  label: string;
  /** Elevator-pitch sentence. Sits directly under the H1 — must be readable in 2 seconds. */
  tagline: string;
  /** Three scannable proof points, ~10 words each. The 5-second-visitor scan layer. */
  proofBullets: [string, string, string];
  openTo: string;
  metaTitle: string;
  metaDescription: string;
}

export const VARIANTS: Record<VariantSlug, Variant> = {
  cto: {
    slug: 'cto',
    path: '/cv?lens=cto',
    label: 'CTO',
    tagline: 'Twenty years shipping production software. Currently CTO. Looking next.',
    proofBullets: [
      "Designed TakeShape's schema language and AI agent runtime",
      'Shipped production agents to enterprise customers including Valvoline',
      'Led TakeShape through two pivots: CMS → API mesh → agent platform'
    ],
    openTo:
      'Open to CTO at AI-native companies building primary AI products — applied AI, agent platforms, model-adjacent infrastructure.',
    metaTitle: 'Andrew Sprouse — CTO, builder of AI agent infrastructure',
    metaDescription:
      'Co-founder and CTO at TakeShape. Designed the schema language, built the agent runtime, shipped production agents to enterprise customers. Open to a new CTO role at an AI-native company.'
  },
  principal: {
    slug: 'principal',
    path: '/cv?lens=principal',
    label: 'Principal Engineer',
    tagline: 'Twenty years designing primary primitives. IC-first, schema-shaped.',
    proofBullets: [
      'Built a JSON Schema-derived agent runtime end-to-end at TakeShape',
      'Shipped an HTTP-402 paywall in 2015, nine years before x402',
      'Open-source: Mozilla Nunjucks (12k★), Serverless Framework webpack plugin'
    ],
    openTo:
      'Open to Principal / Staff Engineer roles at companies whose product is itself a primary primitive — LLM, runtime, commerce, payments.',
    metaTitle: 'Andrew Sprouse — Principal Engineer, twenty years of primary primitives',
    metaDescription:
      "Designed and shipped systems for two decades — from Fair Tread's HTTP-402 paywall (nine years before x402) to TakeShape's agent runtime. Looking for Principal Engineer work at a company whose product is itself a primary primitive."
  },
  cofounder: {
    slug: 'cofounder',
    path: '/cv?lens=cofounder',
    label: 'Co-founder',
    tagline: 'Two co-founder gigs in. Going application-first next time.',
    proofBullets: [
      'TakeShape + Fair Tread — two co-founder gigs through Techstars',
      'Raised a seed round, navigated three product pivots in seven years',
      'Application-first thesis: ship the product, let the platform fall out'
    ],
    openTo:
      'Open to technical co-founder roles, application-first — pick a real user problem AI now makes solvable, ship it, and let the dev-tools fall out of the work.',
    metaTitle: 'Andrew Sprouse — Technical co-founder, application-first',
    metaDescription:
      'Two prior co-founder gigs through Techstars, a seed round, and three product pivots. Looking to do it again, application-first, with a non-technical co-founder who handles the business side.'
  }
};

export const VARIANT_ORDER: VariantSlug[] = ['cto', 'principal', 'cofounder'];
