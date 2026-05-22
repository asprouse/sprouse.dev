/// <reference path="../.astro/types.d.ts" />
/// <reference path="../worker-configuration.d.ts" />

// ANTHROPIC_API_KEY is a secret set in the Cloudflare dashboard, not declared
// in wrangler.jsonc, so `wrangler types` doesn't pick it up — augment the
// generated Cloudflare.Env here.
declare namespace Cloudflare {
  interface Env {
    ANTHROPIC_API_KEY?: string;
  }
}

// @modyfi/vite-plugin-yaml transforms *.yml imports into parsed JS modules.
declare module '*.yml' {
  const data: unknown;
  export default data;
}
declare module '*.yaml' {
  const data: unknown;
  export default data;
}
