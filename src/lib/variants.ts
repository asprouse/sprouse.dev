// Positioning variants ("lenses"). The hand-written content (tagline, openTo,
// proofBullets, metaTitle, metaDescription) lives in andrew.yml under
// `variants:` — see VariantEntry in the schema. This file derives the runtime
// shape (slug + URL path + label) and exposes it as VARIANTS for components.
import { resume } from './resume';
import type { VariantEntry } from '../types/resume';

export type VariantSlug = 'cto' | 'principal' | 'cofounder';

export interface Variant extends VariantEntry {
  slug: VariantSlug;
  path: string;
}

export const VARIANT_ORDER: VariantSlug[] = ['cto', 'principal', 'cofounder'];

export const VARIANTS: Record<VariantSlug, Variant> = Object.fromEntries(
  VARIANT_ORDER.map((slug) => [
    slug,
    {
      ...resume.variants[slug],
      slug,
      path: `/cv?lens=${slug}`
    }
  ])
) as Record<VariantSlug, Variant>;
