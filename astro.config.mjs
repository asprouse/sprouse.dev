import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    output: "server",
    adapter: cloudflare({
        platformProxy: { enabled: true },
    }),
    integrations: [react()],
    vite: {
        plugins: [tailwindcss()],
        resolve: {
            alias: [
                {
                    find: /^react-dom\/server$/,
                    replacement: "react-dom/server.edge",
                },
            ],
        },
    },
    site: "https://sprouse.dev",
});
