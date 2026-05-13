import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// Alias react-dom/server to the edge variant only for production builds.
// The .edge build is CommonJS and breaks Vite's dev server, but is required
// for Cloudflare Workers SSR (browser variant references MessageChannel,
// which the worker-validation step doesn't always provide).
const isBuild = process.env.npm_lifecycle_event === "build";

export default defineConfig({
    output: "server",
    adapter: cloudflare({
        platformProxy: { enabled: true },
    }),
    integrations: [
        react(),
        sitemap({
            // /og is a noindex internal route used to generate the OG image.
            filter: (page) => !page.includes("/og/"),
        }),
    ],
    vite: {
        plugins: [tailwindcss()],
        resolve: {
            alias: isBuild
                ? [
                      {
                          find: /^react-dom\/server$/,
                          replacement: "react-dom/server.edge",
                      },
                  ]
                : [],
        },
    },
    site: "https://sprouse.dev",
});
