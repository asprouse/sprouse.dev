export type VariantSlug = "cto" | "principal" | "cofounder";

export interface Variant {
    slug: VariantSlug;
    path: string;
    label: string;
    headline: string;
    openTo: string;
    metaTitle: string;
    metaDescription: string;
}

export const VARIANTS: Record<VariantSlug, Variant> = {
    cto: {
        slug: "cto",
        path: "/",
        label: "CTO",
        headline:
            "Seven years as TakeShape's CTO and lead engineer building agent infrastructure — schema language, runtime, multi-provider LLM integration, production agents for Valvoline. The lesson I'm taking forward: the best dev tools come out of trying to ship a real product. Looking to be a CTO who builds the product first and the platform out of what the product teaches us.",
        openTo: "Open to CTO at AI-native companies building primary AI products — applied AI, agent platforms, model-adjacent infrastructure.",
        metaTitle: "Andrew Sprouse — CTO, builder of AI agent infrastructure",
        metaDescription:
            "Co-founder and CTO at TakeShape. Designed the schema language, built the agent runtime, shipped production agents to enterprise customers. Open to a new CTO role at an AI-native company.",
    },
    principal: {
        slug: "principal",
        path: "/principal",
        label: "Principal Engineer",
        headline:
            "Twenty years of designing systems and writing the hard code — from Fair Tread's HTTP-402 paywall in 2015, nine years before Coinbase's x402 made agentic micropayments a mainstream category, to TakeShape's schema-driven agent runtime today. What I want next: Principal Engineer work at a company whose product is itself a primary primitive — an LLM, a runtime, a commerce backbone, a payments rail.",
        openTo: "Open to Principal / Staff Engineer roles at companies whose product is itself a primary primitive — LLM, runtime, commerce, payments.",
        metaTitle: "Andrew Sprouse — Principal Engineer, twenty years of primary primitives",
        metaDescription:
            "Designed and shipped systems for two decades — from Fair Tread's HTTP-402 paywall (nine years before x402) to TakeShape's agent runtime. Looking for Principal Engineer work at a company whose product is itself a primary primitive.",
    },
    cofounder: {
        slug: "cofounder",
        path: "/cofounder",
        label: "Co-founder",
        headline:
            "Two co-founder gigs (TakeShape + Fair Tread), Techstars, a seed round, three product pivots — I'm coming out of seven years of dev-tools work knowing the sharper play is to ship an end-user product first and build the platform out of what shipping taught us. I know exactly what kind of technical co-founder I am and what I need from the business side of the table.",
        openTo: "Open to technical co-founder roles, application-first — pick a real user problem AI now makes solvable, ship it, and let the dev-tools fall out of the work.",
        metaTitle: "Andrew Sprouse — Technical co-founder, application-first",
        metaDescription:
            "Two prior co-founder gigs through Techstars, a seed round, and three product pivots. Looking to do it again, application-first, with a non-technical co-founder who handles the business side.",
    },
};

export const VARIANT_ORDER: VariantSlug[] = ["cto", "principal", "cofounder"];
